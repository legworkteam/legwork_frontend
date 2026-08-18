/**
 * 소셜 로그인 (명세 §3 POST /auth/social).
 * SDK 스크립트 없이 표준 Authorization Code 리다이렉트만 사용한다.
 *   1) 여기서 카카오/구글 인가 페이지로 이동
 *   2) /oauth/callback 이 code 를 받아 백엔드에 넘김
 *   3) 백엔드가 code 를 교환·검증하고 서비스 JWT 발급
 *
 * 필요한 값 (.env):
 *   VITE_KAKAO_CLIENT_ID   = 카카오 REST API 키
 *   VITE_GOOGLE_CLIENT_ID  = Google OAuth 클라이언트 ID
 * 각 콘솔에 Redirect URI 로 `<배포주소>/oauth/callback` 을 등록해야 한다.
 */
const PROVIDERS = {
  kakao: {
    authUrl: "https://kauth.kakao.com/oauth/authorize",
    clientId: import.meta.env.VITE_KAKAO_CLIENT_ID,
    params: {},
  },
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    params: { scope: "openid email profile", prompt: "select_account" },
  },
};

const KEY = "mcm-oauth";
export const redirectUri = () => `${location.origin}/oauth/callback`;
export const isConfigured = (provider) => !!PROVIDERS[provider]?.clientId;

const randomId = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;

/** 인가 페이지로 이동. 돌아올 경로(from)를 함께 보관한다. */
export function startSocialLogin(provider, from = "/mypage") {
  const cfg = PROVIDERS[provider];
  if (!cfg?.clientId) {
    throw new Error(
      `${PROVIDER_LABEL[provider] ?? provider} 클라이언트 ID가 설정되지 않았습니다. .env.local 을 확인해 주세요.`
    );
  }
  const state = randomId(); // CSRF 방지 — 콜백에서 대조
  sessionStorage.setItem(KEY, JSON.stringify({ provider, from, state }));
  location.href = buildAuthUrl(provider, state);
}

/** 인가 URL 조립 (startSocialLogin 이 사용. 리다이렉트 없이 검증할 수 있게 분리) */
export function buildAuthUrl(provider, state) {
  const cfg = PROVIDERS[provider];
  const query = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    state,
    ...cfg.params,
  });
  return `${cfg.authUrl}?${query}`;
}

const PROVIDER_LABEL = { kakao: "카카오", google: "Google" };

/** 콜백에서 호출. state 가 맞지 않으면 null 을 돌려준다. */
export function consumeOAuthState(stateFromUrl) {
  const raw = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  if (!raw) return null;
  const saved = JSON.parse(raw);
  return saved.state === stateFromUrl ? saved : null;
}
