import { client } from "./client";
import { mock } from "./mock";
import { redirectUri } from "./oauth";

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

/* ── 3. 인증 ─────────────────────────────────────────── */
export const signup = (body) => call(() => client.post("/auth/signup", body), mock.signup);

export const login = (email, password) =>
  call(() => client.post("/auth/login", { email, password }), mock.login);

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

/* ── 4. 내 계정 / 아바타 ─────────────────────────────── */
export const getMe = () => call(() => client.get("/me"), mock.me);
export const patchMe = (body) => call(() => client.patch("/me", body), () => mock.patchMe(body));
export const patchPassword = (currentPassword, newPassword) =>
  call(() => client.patch("/me/password", { currentPassword, newPassword }), {});
export const getAvatar = () => call(() => client.get("/me/avatar"), mock.avatar);
export const putAvatar = (body) => call(() => client.put("/me/avatar", body), () => mock.putAvatar(body));

/* ── 10. 저장한 코디 ─────────────────────────────────── */
export const getCoordis = (cursor) =>
  call(() => client.get("/me/coordis", { params: { cursor } }), mock.coordis);
export const getCoordi = (savedCoordiId) =>
  call(() => client.get(`/me/coordis/${savedCoordiId}`), () => mock.coordi(savedCoordiId));
/** items 는 [{productId, variantId, name?, price?, image?}] — name/price/image 는 mock 전용 표시값, 실제 호출엔 productId/variantId만 실린다 */
export const createCoordi = (name, items) =>
  call(
    () =>
      client.post("/me/coordis", {
        name,
        items: items.map(({ productId, variantId }) => ({ productId, variantId })),
      }),
    () => mock.createCoordi(name, items)
  );
export const deleteCoordi = (id) =>
  call(() => client.delete(`/me/coordis/${id}`), () => mock.deleteCoordi(id));

/* ── 11. 장바구니 ────────────────────────────────────── */
export const getCart = () => call(() => client.get("/cart"), mock.cart);
/** meta(name/price/optionName/productId)는 명세엔 없는 mock 전용 표시값 — 실제 API 호출엔 안 실린다 */
export const addCartItem = (variantId, quantity = 1, meta) =>
  call(() => client.post("/cart/items", { variantId, quantity }), () => mock.addCartItem(variantId, quantity, meta));
export const patchCartItem = (cartItemId, body) =>
  call(() => client.patch(`/cart/items/${cartItemId}`, body), () => mock.patchCartItem(cartItemId, body));
export const deleteCartItem = (cartItemId) =>
  call(() => client.delete(`/cart/items/${cartItemId}`), () => mock.deleteCartItem(cartItemId));

/* ── 12. 주문 / 모의결제 ─────────────────────────────── */
export const createOrder = (cartItemIds) =>
  call(
    () => client.post("/orders", { cartItemIds, paymentMethod: "mock" }),
    () => mock.createOrder({ cartItemIds })
  );
export const getOrders = (cursor) =>
  call(() => client.get("/me/orders", { params: { cursor } }), mock.orders);
export const getOrder = (orderId) =>
  call(() => client.get(`/me/orders/${orderId}`), () => mock.order(orderId));

/* ── 13. 보유 제품 / 사후관리 ────────────────────────── */
export const getMyProducts = (cursor) =>
  call(() => client.get("/me/products", { params: { cursor } }), mock.products);
export const getMyProduct = (registrationId) =>
  call(() => client.get(`/me/products/${registrationId}`), () => mock.product(registrationId));
export const registerProduct = (body) =>
  call(() => client.post("/me/products", body), () => mock.registerProduct(body));
export const getCareGuide = (registrationId) =>
  call(() => client.get(`/me/products/${registrationId}/care-guide`), mock.careGuide);

/* ── 14. AI 손상 진단 (202 → Job) ────────────────────── */
export const createDiagnosis = (registrationId, files) => {
  const form = new FormData();
  form.append("registrationId", registrationId);
  files.forEach((f) => form.append("files", f));
  return call(() => client.post("/diagnoses", form), () => mock.createDiagnosis(registrationId));
};
export const getDiagnosis = (diagnosisId) =>
  call(() => client.get(`/diagnoses/${diagnosisId}`), () => mock.diagnosis(diagnosisId));
export const getDiagnosisCareGuide = (diagnosisId) =>
  call(() => client.get(`/diagnoses/${diagnosisId}/care-guide`), mock.diagnosisCareGuide);

/* ── 7. Job 폴링 ─────────────────────────────────────── */
export const getJob = (jobId) => call(() => client.get(`/jobs/${jobId}`), () => mock.job(jobId));

/* ── 15. 수리 예약 / 매장 ────────────────────────────── */
export const getStores = (date) => call(() => client.get("/stores", { params: { date } }), () => mock.stores(date));
export const createReservation = (body) =>
  call(() => client.post("/repair-reservations", body), () => mock.createReservation(body));
export const getReservations = () =>
  call(() => client.get("/me/repair-reservations"), mock.reservations);
export const cancelReservation = (reservationId) =>
  call(
    () => client.patch(`/me/repair-reservations/${reservationId}`, { status: "cancelled" }),
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

/* 명세 16: 파일 포맷/용량 */
export const FILE_LIMITS = {
  image: { types: ["image/jpeg", "image/png", "image/webp"], max: 20 * 1024 * 1024, label: "JPEG/PNG/WEBP 20MB" },
  video: { types: ["video/mp4", "video/quicktime"], max: 100 * 1024 * 1024, label: "MP4/MOV 100MB" },
};

/** 업로드 전 검증 (명세 16: extension + Content-Type 조합, 서버가 signature 까지 검증) */
export function validateUpload(file) {
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const { types, max, label } = FILE_LIMITS[kind];
  if (!types.includes(file.type)) return `${file.name}: 허용하지 않는 형식입니다 (${label})`;
  if (file.size > max) return `${file.name}: 용량 초과입니다 (${label})`;
  return null;
}
