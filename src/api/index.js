import { client } from "./client";
import { mock } from "./mock";
import { redirectUri } from "./oauth";
import { getTokens, setTokens } from "./tokens";
import { toast } from "@/store/toast";

/**
 * 기본값은 실제 API 호출.
 * `.env.development` 에 VITE_USE_MOCK=true 가 있어서 로컬 `npm run dev` 만 더미로 돈다.
 * 백엔드가 뜨면 그 줄을 지우거나 false 로 바꾸면 됨. 프로덕션 빌드는 항상 실제 API.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export { client, ApiError } from "./client";
export * from "./tokens";
export { startSocialLogin, isConfigured, redirectUri, consumeOAuthState } from "./oauth";

const delay = (data, ms = 250) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));

/** real: 실제 호출 함수, fake: mock 값(지연 후 반환) */
const call = (real, fake) => (USE_MOCK ? delay(typeof fake === "function" ? fake() : fake) : real());

/**
 * 데모 폴백 — 서버에 상품 seed 가 아직 없어서 실패하는 구간을 더미로 이어붙인다.
 * 카탈로그에 의존하는 호출이 한 번이라도 "상품이 없다" 류로 실패하면 그때부터
 * 탭 세션 동안 해당 구간 전체를 더미로 돌린다(장바구니만 더미고 목록은 실서버면
 * 담은 물건이 사라져서, 도메인을 통째로 넘겨야 앞뒤가 맞는다).
 * 인증·프로필·아바타는 실서버 그대로다.
 *
 * TODO: 백엔드에 상품 seed 가 들어오면 callOrDemo 를 call 로 되돌리고 이 블록을 지운다.
 */
const DEMO_KEY = "mcm-demo-fallback";
const DEMO_CODES = new Set([
  "PRODUCT_NOT_FOUND",
  "PRODUCT_CODE_NOT_DETECTED",
  "PRODUCT_CODE_AMBIGUOUS",
  "VARIANT_NOT_FOUND",
  "SERIAL_NOT_FOUND",
  "NOT_FOUND",
  "VALIDATION_ERROR",
]);

const demoOn = () => sessionStorage.getItem(DEMO_KEY) === "1";
function latchDemo() {
  if (demoOn()) return;
  sessionStorage.setItem(DEMO_KEY, "1");
  toast("상품 데이터가 서버에 아직 없어 이 구간은 데모 데이터로 표시합니다.");
  // 데이터 출처가 바뀌었으니 이미 받아둔 목록 캐시는 버린다.
  // (store 를 직접 import 하면 store → api 와 순환참조라 이벤트로 알린다)
  window.dispatchEvent(new Event("mcm-demo-latched"));
}

const resolveFake = (fake) => (typeof fake === "function" ? fake() : fake);

/** 카탈로그(상품)에 기대는 호출 — 서버가 못 주면 더미로 대체한다 */
const callOrDemo = (real, fake) => {
  if (USE_MOCK || demoOn()) return delay(resolveFake(fake));
  return real().catch((e) => {
    if (!DEMO_CODES.has(e?.code)) throw e;
    latchDemo();
    return resolveFake(fake);
  });
};

/* ── 3. 인증 ─────────────────────────────────────────── */
export const signup = (body) => call(() => client.post("/auth/signup", body), mock.signup);

export const login = (email, password) =>
  call(() => client.post("/auth/login", { email, password }), mock.login);

/**
 * 소셜 클라이언트 ID 가 없을 때 쓰는 데모 인가코드.
 * 백엔드 /auth/social 은 Google/Kakao 프로필 fetch 를 mock 으로 처리하고
 * authorizationCode 를 해시해 deterministic 프로필을 만든다 → 코드가 곧 계정 식별자다.
 * 브라우저마다 다른 코드를 저장해 데모 방문자끼리 계정(장바구니·코디)이 섞이지 않게 한다.
 * 하나의 공용 데모 계정을 쓰고 싶으면 이 함수가 고정 문자열을 반환하게 바꾸면 된다.
 */
const DEMO_CODE_KEY = "mcm-demo-oauth-code";
export function demoAuthorizationCode() {
  let code = localStorage.getItem(DEMO_CODE_KEY);
  if (!code) {
    code = `demo-${crypto.randomUUID?.() ?? `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`}`;
    localStorage.setItem(DEMO_CODE_KEY, code);
  }
  return code;
}

/** provider: google | kakao — 인가 코드는 /oauth/callback 에서 받아 넘긴다 */
export const socialLogin = (provider, authorizationCode) =>
  call(
    () =>
      client.post("/auth/social", {
        provider,
        authorizationCode,
        redirectUri: redirectUri(),
      }),
    () => mock.social(provider)
  );

export const logout = (refreshToken) =>
  call(() => client.post("/auth/logout", { refreshToken }), {});

/** 게스트 세션 데이터(아바타 파라미터/최근 본 상품/저장 요청한 try-on)를 회원으로 이관 */
export const claimGuest = (guestToken) =>
  call(() => client.post("/auth/claim", { guestToken }), mock.claim);

/* ── 2. 게스트 세션 ──────────────────────────────────── */
export const createGuestSession = () =>
  call(() => client.post("/guest-sessions", {}), mock.guestSession);

/**
 * GUEST 엔드포인트 호출 직전에만 토큰을 보장한다(앱 시작 시 무조건 발급하지 않음).
 * 게스트 토큰은 당일 23:59:59 KST 만료라(명세 0) 만료 시각을 같이 저장해 두고 지나면 재발급한다.
 */
async function ensureGuestToken() {
  const { accessToken, guestToken, guestExpiresAt } = getTokens();
  if (accessToken) return; // 회원이면 회원 JWT 가 우선
  if (guestToken && Date.now() < Date.parse(guestExpiresAt)) return;
  const { guestToken: t, guestSessionId, expiresAt } = await createGuestSession();
  setTokens({ guestToken: t, guestSessionId, guestExpiresAt: expiresAt });
}

/** GUEST 엔드포인트는 호출 직전에 토큰을 보장한다 */
const guest = (fn) => async () => {
  await ensureGuestToken();
  return fn();
};

/**
 * 로컬 데모 카탈로그는 정수 id, 서버 상품은 UUID.
 * 서버 API(피팅/추천/상세)를 걸 수 있는 상품인지 판별한다.
 * TODO: 서버에 카탈로그 목록 API 가 생겨 로컬 JSON 을 버리면 이 분기도 같이 제거.
 */
export const isServerProduct = (id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id ?? ""));

/* ── 4. 아바타 ───────────────────────────────────────── */
/** 서버가 강제하는 범위 (초과 시 VALIDATION_ERROR) */
export const AVATAR_LIMITS = { heightCm: [100, 230], weightKg: [30, 200] };

const GUEST_AVATAR_KEY = "mcm-guest-avatar";

/**
 * 게스트 신체정보는 게스트 세션에만 저장된다.
 * 서버에 조회 API 가 없고 /auth/claim 도 아바타는 옮겨주지 않으므로
 * (claim 응답은 recentProductsClaimed 뿐), 로그인 후 회원 아바타로 승격시키려면
 * 프론트가 값을 들고 있어야 한다.
 */
export const putGuestAvatar = (body) =>
  call(guest(() => client.put("/guest-sessions/me/avatar-parameters", body)), () => body).then((saved) => {
    localStorage.setItem(GUEST_AVATAR_KEY, JSON.stringify(body));
    return saved;
  });

/** 한 번 꺼내면 지운다 — 로그인 직후 1회만 승격한다 */
export function takeGuestAvatar() {
  try {
    const raw = localStorage.getItem(GUEST_AVATAR_KEY);
    localStorage.removeItem(GUEST_AVATAR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ── 5. 품번 사진 OCR ────────────────────────────────── */
/** 사진 1장 → 서버가 OCR·정규화·상품조회까지 수행. 실패 코드: PRODUCT_CODE_NOT_DETECTED / _AMBIGUOUS / PRODUCT_NOT_FOUND */
export const recognizeProduct = (file) =>
  callOrDemo(
    guest(() => {
      const form = new FormData();
      form.append("image", file);
      return client.post("/product-recognitions", form);
    }),
    mock.recognize
  );

/* ── 5·6. 상품 / 규칙기반 추천 ───────────────────────── */
export const getProduct = (productId) => callOrDemo(guest(() => client.get(`/products/${productId}`)), null);
export const getProductVariants = (productId) =>
  callOrDemo(guest(() => client.get(`/products/${productId}/variants`)), []);
export const getRecentProducts = () => callOrDemo(guest(() => client.get("/recent-products")), { items: [] });
/** 게스트는 서버가 최대 3개로 제한한다(명세 6) */
export const getProductRecommendations = (productId, limit = 3) =>
  callOrDemo(guest(() => client.get(`/products/${productId}/recommendations`, { params: { limit } })), []);

/* ── 8·9. 가상 착용 (202 → Job 폴링, 결과는 files/{id}) ─ */
/** 아바타 착용. 회원이 신체정보를 생략하면 서버가 /me/avatar 값을 쓴다(명세 8) */
export const createAvatarTryOn = (productId, body = {}) =>
  callOrDemo(
    guest(() => client.post("/avatar-try-ons", { scope: "productOnly", productId, ...body })),
    () => ({ jobId: "mock-tryon", type: "avatarTryOn" })
  );

/** 내 사진 착용 — multipart. 게스트는 세션당 3회 제한(서버가 카운트) */
export const createPhotoTryOn = (photo, productId) =>
  callOrDemo(
    guest(() => {
      const form = new FormData();
      form.append("photo", photo);
      form.append("scope", "productOnly");
      form.append("productId", productId);
      return client.post("/try-ons", form);
    }),
    () => ({ jobId: "mock-tryon", type: "photoTryOn" })
  );

/** 임시 결과(TTL 3시간)를 영구 저장 — 회원만 */
export const saveTryOn = (tryOnId) => callOrDemo(() => client.post(`/try-ons/${tryOnId}/save`), {});
export const getMyTryOns = () => callOrDemo(() => client.get("/me/try-ons"), mock.tryOns);
export const deleteTryOn = (tryOnId) =>
  callOrDemo(() => client.delete(`/me/try-ons/${tryOnId}`), () => mock.deleteTryOn(tryOnId));

/* ── 4. 내 계정 / 아바타 ─────────────────────────────── */
export const getMe = () => call(() => client.get("/me"), mock.me);
export const patchMe = (body) => call(() => client.patch("/me", body), () => mock.patchMe(body));
export const patchPassword = (currentPassword, newPassword) =>
  call(() => client.patch("/me/password", { currentPassword, newPassword }), {});
export const getAvatar = () => call(() => client.get("/me/avatar"), mock.avatar);
export const putAvatar = (body) => call(() => client.put("/me/avatar", body), () => mock.putAvatar(body));

/* ── 10. 저장한 코디 ─────────────────────────────────── */
export const getCoordis = (cursor) =>
  callOrDemo(() => client.get("/me/coordis", { params: { cursor } }), mock.coordis);
export const getCoordi = (savedCoordiId) =>
  callOrDemo(() => client.get(`/me/coordis/${savedCoordiId}`), () => mock.coordi(savedCoordiId));
/** items 는 [{productId, variantId, name?, price?, image?}] — name/price/image 는 mock 전용 표시값, 실제 호출엔 productId/variantId만 실린다 */
export const createCoordi = (name, items) =>
  callOrDemo(
    () =>
      client.post("/me/coordis", {
        name,
        items: items.map(({ productId, variantId }) => ({ productId, variantId })),
      }),
    () => mock.createCoordi(name, items)
  );
export const deleteCoordi = (id) =>
  callOrDemo(() => client.delete(`/me/coordis/${id}`), () => mock.deleteCoordi(id));

/* ── 11. 장바구니 ────────────────────────────────────── */
export const getCart = () => callOrDemo(() => client.get("/cart"), mock.cart);
/** meta(name/price/optionName/productId)는 명세엔 없는 mock 전용 표시값 — 실제 API 호출엔 안 실린다 */
export const addCartItem = (variantId, quantity = 1, meta) =>
  callOrDemo(() => client.post("/cart/items", { variantId, quantity }), () => mock.addCartItem(variantId, quantity, meta));
export const patchCartItem = (cartItemId, body) =>
  callOrDemo(() => client.patch(`/cart/items/${cartItemId}`, body), () => mock.patchCartItem(cartItemId, body));
export const deleteCartItem = (cartItemId) =>
  callOrDemo(() => client.delete(`/cart/items/${cartItemId}`), () => mock.deleteCartItem(cartItemId));

/* ── 12. 주문 / 모의결제 ─────────────────────────────── */
export const createOrder = (cartItemIds) =>
  callOrDemo(
    () => client.post("/orders", { cartItemIds, paymentMethod: "mock" }),
    () => mock.createOrder({ cartItemIds })
  );
export const getOrders = (cursor) =>
  callOrDemo(() => client.get("/me/orders", { params: { cursor } }), mock.orders);
export const getOrder = (orderId) =>
  callOrDemo(() => client.get(`/me/orders/${orderId}`), () => mock.order(orderId));

/* ── 13. 보유 제품 / 사후관리 ────────────────────────── */
export const getMyProducts = (cursor) =>
  callOrDemo(() => client.get("/me/products", { params: { cursor } }), mock.products);
export const getMyProduct = (registrationId) =>
  callOrDemo(() => client.get(`/me/products/${registrationId}`), () => mock.product(registrationId));
export const registerProduct = (body) =>
  callOrDemo(() => client.post("/me/products", body), () => mock.registerProduct(body));
export const getCareGuide = (registrationId) =>
  callOrDemo(() => client.get(`/me/products/${registrationId}/care-guide`), mock.careGuide);

/* ── 14. AI 손상 진단 (202 → Job) ────────────────────── */
export const createDiagnosis = (registrationId, files) => {
  const form = new FormData();
  form.append("registrationId", registrationId);
  files.forEach((f) => form.append("files", f));
  return callOrDemo(() => client.post("/diagnoses", form), () => mock.createDiagnosis(registrationId));
};
export const getDiagnosis = (diagnosisId) =>
  callOrDemo(() => client.get(`/diagnoses/${diagnosisId}`), () => mock.diagnosis(diagnosisId));
export const getDiagnosisCareGuide = (diagnosisId) =>
  callOrDemo(() => client.get(`/diagnoses/${diagnosisId}/care-guide`), mock.diagnosisCareGuide);

/* ── 7. Job 폴링 ─────────────────────────────────────── */
export const getJob = (jobId) => callOrDemo(() => client.get(`/jobs/${jobId}`), () => mock.job(jobId));

/* ── 15. 수리 예약 / 매장 ────────────────────────────── */
export const getStores = (date) => callOrDemo(() => client.get("/stores", { params: { date } }), () => mock.stores(date));
export const createReservation = (body) =>
  callOrDemo(() => client.post("/repair-reservations", body), () => mock.createReservation(body));
/* 명세 15 는 /me/repair-reservations + PATCH 로 적혀 있으나, 실제 백엔드는 아래 경로로 구현돼 있다 */
export const getReservations = () => callOrDemo(() => client.get("/repair-reservations"), mock.reservations);
export const cancelReservation = (reservationId) =>
  callOrDemo(
    () => client.post(`/repair-reservations/${reservationId}/cancel`),
    () => mock.patchReservation(reservationId, { status: "cancelled" })
  );

/* ── 16. 파일 (개인 파일은 토큰 필요 → blob) ─────────── */
export const getFileBlob = (fileId) =>
  client.get(`/files/${fileId}`, { responseType: "blob" });

/* ── 명세 14: 진단 카테고리 ──────────────────────────── */
export const DAMAGE_LABEL = {
  scratch: "스크래치",
  stain: "오염",
  tear: "찢어짐",
  hardwareDamage: "금속 장식 손상",
  discoloration: "변색",
  deformation: "변형",
  abrasion: "마모",
};

/** 명세 14 손상 심각도 — 서버 enum 은 low|medium|high */
export const SEVERITY_LABEL = { low: "경미", medium: "보통", high: "심각" };

/* 명세 16: 파일 포맷/용량 */
export const FILE_LIMITS = {
  image: { types: ["image/jpeg", "image/png", "image/webp"], max: 20 * 1024 * 1024, label: "JPEG/PNG/WEBP 20MB" },
  video: { types: ["video/mp4", "video/quicktime"], max: 100 * 1024 * 1024, label: "MP4/MOV 100MB" },
};

/**
 * 명세 3: 비밀번호 규칙 — 최소 8자, 대문자·숫자·특수문자 포함.
 * 서버가 최종 판정하지만, 왕복 한 번 없이 폼에서 먼저 걸러낸다.
 * <input pattern> 은 암묵적으로 ^(?:...)$ 로 감싸지므로 lookahead + .{8,} 조합으로 쓴다.
 */
export const PASSWORD_PATTERN = "(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}";
export const PASSWORD_HINT = "8자 이상, 대문자·숫자·특수문자를 각각 1개 이상 포함해야 합니다.";

/** 위 규칙을 폼 input 에 그대로 얹는다 (브라우저 기본 검증 + 한글 메시지) */
export const passwordFieldProps = () => ({
  pattern: PASSWORD_PATTERN,
  title: PASSWORD_HINT,
  onInvalid: (e) => e.target.setCustomValidity(e.target.value ? PASSWORD_HINT : ""),
  onInput: (e) => e.target.setCustomValidity(""),
});

/** 업로드 전 검증 (명세 16: extension + Content-Type 조합, 서버가 signature 까지 검증) */
export function validateUpload(file) {
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const { types, max, label } = FILE_LIMITS[kind];
  if (!types.includes(file.type)) return `${file.name}: 허용하지 않는 형식입니다 (${label})`;
  if (file.size > max) return `${file.name}: 용량 초과입니다 (${label})`;
  return null;
}
