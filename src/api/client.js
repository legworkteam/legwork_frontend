import axios from "axios";
import { clearTokens, getTokens, setTokens } from "./tokens";

/** 명세 1.1 Base URL */
export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 20000, // 업로드/진단 접수까지 여유. AI 처리 자체는 Job 폴링이라 이 값과 무관
});

/** 명세 1.4 공통 실패 응답 → 화면에서 code 로 분기, message 를 그대로 노출 */
export class ApiError extends Error {
  constructor({ code, message, details, status }) {
    super(message ?? "요청을 처리하지 못했습니다.");
    Object.assign(this, { code, details, status });
  }
}

/* 1.2 인증 레벨: 회원 JWT 우선, 없으면 게스트 토큰 */
client.interceptors.request.use((cfg) => {
  const { accessToken, guestToken } = getTokens();
  const token = accessToken ?? guestToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/* 서버가 envelope 없이 떨어졌을 때(프록시 오류 등) 쓰는 기본 문구 — 명세 1.5 */
const BY_STATUS = {
  400: "잘못된 요청입니다.",
  401: "로그인이 필요합니다.",
  403: "권한이 없습니다.",
  404: "요청한 정보를 찾을 수 없습니다.",
  409: "처리 중 충돌이 발생했습니다. 다시 확인해 주세요.",
  422: "입력값을 확인해 주세요.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "서버 오류가 발생했습니다.",
  503: "일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.",
};

/* 1.3 공통 성공 응답 → data 만 반환. 목록의 meta.pagination 은 data 에 얹어준다 */
client.interceptors.response.use(
  (res) => {
    if (res.config.responseType === "blob") return res.data;
    const { data, meta } = res.data ?? {};
    if (Array.isArray(data) && meta?.pagination) return { items: data, ...meta.pagination };
    return data;
  },
  async (err) => {
    const res = err.response;
    const body = res?.data?.error;
    const failed = new ApiError({
      ...body,
      status: res?.status,
      // 서버가 못 뜬 경우/타임아웃은 envelope 자체가 없다
      message:
        body?.message ??
        (err.code === "ECONNABORTED"
          ? "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
          : res
            ? BY_STATUS[res.status]
            : "서버에 연결할 수 없습니다. 네트워크를 확인해 주세요."),
    });

    // TOKEN_EXPIRED 만 1회 재발급 후 재시도 (명세 3. Refresh 14일 + rotation)
    if (failed.code === "TOKEN_EXPIRED" && !err.config._retried) {
      err.config._retried = true;
      if (await refresh()) return client(err.config);
    }
    if (failed.status === 401) forceLogin();
    throw failed;
  }
);

let refreshing = null;
function refresh() {
  const { refreshToken } = getTokens();
  if (!refreshToken) return Promise.resolve(false);
  // 동시에 여러 요청이 만료돼도 재발급은 한 번만
  refreshing ??= axios
    .post(`${client.defaults.baseURL}/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      setTokens(data.data);
      return true;
    })
    .catch(() => {
      forceLogin();
      return false;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function forceLogin() {
  clearTokens();
  if (!location.pathname.startsWith("/login")) location.href = "/login";
}
