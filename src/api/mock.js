/**
 * 백엔드 연동 전 더미. api/index.js 의 USE_MOCK=false 로 바꾸면 이 파일은 안 쓰인다.
 *
 * ⚠️ 명세에 응답 body 가 적혀 있는 것(진단/주문/OCR/게스트세션 등)은 명세 그대로 맞췄고,
 *    body 가 없는 목록 API(cart, coordis, me/products, stores 등)는 필드명을 추정했다.
 *    README 의 "백엔드 확인 필요" 목록 참고.
 */
/* crypto.randomUUID 는 secure context 전용 — 폰에서 http://192.168.x.x 로 열면 undefined 라 폴백이 필요 */
const uuid = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
/* UTC → KST(+09:00) 로 오프셋을 실제로 더해서 만든다 (명세 1.1) */
const MOCK_STORE_ID = uuid();
const nowKst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().replace("Z", "+09:00");

export const state = {
  user: {
    userId: uuid(),
    email: "user@example.com",
    name: "김민준",
    phone: "010-1234-5678",
    authProvider: "kakao",
    hasAvatar: true,
    createdAt: "2024-03-11T10:00:00+09:00",
  },
  avatar: { heightCm: 178, weightKg: 72, gender: "male", previewFileId: null },

  /* items 는 명세엔 없는 mock 전용 필드 — 실제 상세 조회는 백엔드가 productId/variantId 로 상품을 다시 찾아 내려준다 */
  coordis: [
    { savedCoordiId: uuid(), name: "Aren Backpack Look", itemCount: 3, thumbnailFileId: null, tone: "#C9BFB2", createdAt: "2026-08-07T12:00:00+09:00", items: [] },
    { savedCoordiId: uuid(), name: "Monogram City Set", itemCount: 4, thumbnailFileId: null, tone: "#B9AFA4", createdAt: "2026-08-05T12:00:00+09:00", items: [] },
    { savedCoordiId: uuid(), name: "Summer Visetos", itemCount: 2, thumbnailFileId: null, tone: "#D3CCC4", createdAt: "2026-07-29T12:00:00+09:00", items: [] },
    { savedCoordiId: uuid(), name: "Essential Black", itemCount: 3, thumbnailFileId: null, tone: "#A9A29B", createdAt: "2026-07-21T12:00:00+09:00", items: [] },
  ],

  cart: [
    { cartItemId: uuid(), productId: uuid(), variantId: uuid(), name: "Stark Backpack", color: "Cognac", size: "Medium", unitPrice: 1290000, quantity: 1, thumbnailFileId: null, stock: 5 },
    { cartItemId: uuid(), productId: uuid(), variantId: uuid(), name: "Aren Crossbody", color: "Black", size: "One", unitPrice: 790000, quantity: 2, thumbnailFileId: null, stock: 3 },
    { cartItemId: uuid(), productId: uuid(), variantId: uuid(), name: "Visetos Card Wallet", color: "Brown", size: "One", unitPrice: 390000, quantity: 1, thumbnailFileId: null, stock: 8 },
  ],

  orders: [
    {
      orderId: uuid(),
      orderStatus: "paid",
      paymentStatus: "success",
      paidAmount: 890000,
      paidAt: "2026-07-30T14:12:00+09:00",
      items: [{ productName: "Visetos Tote", variant: { color: "Beige", size: "One" }, unitPrice: 890000, quantity: 1, thumbnailFileId: null }],
    },
  ],

  products: [
    {
      registrationId: uuid(),
      name: "Stark Backpack",
      serialNumber: "MCM-2024-8831",
      nickname: "출근용 백팩",
      source: "purchase",
      purchaseDate: "2024-05-12",
      thumbnailFileId: null,
      lastDiagnosis: null,
      lastReservation: null,
    },
    {
      registrationId: uuid(),
      name: "Aren Crossbody",
      serialNumber: "MCM-2023-4412",
      nickname: "데일리",
      source: "manual",
      purchaseDate: "2023-11-02",
      thumbnailFileId: null,
      lastDiagnosis: null,
      lastReservation: null,
    },
  ],

  tryOns: [
    { tryOnId: uuid(), scope: "productOnly", resultFileId: null, provider: "mock", savedAt: "2026-08-18T10:00:00+09:00", createdAt: "2026-08-18T10:00:00+09:00" },
  ],
  diagnoses: [],
  reservations: [],
  jobs: {},
};

/* 진단 결과 샘플 — 명세 14. 응답 스키마 그대로 */
const sampleDamages = [
  { damageType: "abrasion", severity: "medium", confidence: 0.88, location: "corner", boundingBox: null },
  { damageType: "discoloration", severity: "low", confidence: 0.72, location: "front", boundingBox: null },
];

export const mock = {
  login: () => issueTokens(),
  social: (provider) => issueTokens({ provider: provider.toUpperCase() }),
  signup: () => ({ userId: uuid() }),
  refresh: () => issueTokens(),
  tryOns: () => ({ items: state.tryOns, nextCursor: null, hasNext: false, limit: 20 }),
  deleteTryOn: (id) => {
    state.tryOns = state.tryOns.filter((t) => t.tryOnId !== id);
    return {};
  },

  claim: () => ({ claimed: { coordis: 0, recentProducts: 2, tryOns: 1 } }),

  guestSession: () => ({
    guestToken: `mock.guest.${Date.now()}`,
    guestSessionId: uuid(),
    expiresAt: `${new Date().toISOString().slice(0, 10)}T23:59:59+09:00`,
  }),
  /** 로컬 카탈로그의 실제 품번 — ProductConfirm 이 findProduct 로 찾아 이미지까지 붙는다 */
  recognize: () => ({ recognizedCode: "MWS 6SAF29 BG001", confidence: 0.97, product: null }),

  me: () => state.user,
  patchMe: (body) => Object.assign(state.user, body),
  avatar: () => state.avatar,
  putAvatar: (body) => Object.assign(state.avatar, body),

  coordis: () => ({ items: state.coordis, nextCursor: null, hasNext: false, limit: 20 }),
  coordi: (id) => state.coordis.find((c) => c.savedCoordiId === id),
  createCoordi: (name, items) => {
    const coordi = {
      savedCoordiId: uuid(),
      name,
      itemCount: items.length,
      thumbnailFileId: null,
      tone: "#C9BFB2",
      createdAt: nowKst(),
      items,
    };
    state.coordis.unshift(coordi);
    return coordi;
  },
  deleteCoordi: (id) => {
    state.coordis = state.coordis.filter((c) => c.savedCoordiId !== id);
    return {};
  },

  cart: () => ({
    items: state.cart,
    totalAmount: state.cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  }),
  /* meta 는 명세엔 없는 mock 전용 표시값(게스트 구간 카탈로그가 별도 mock 이라 이름/가격을 직접 넘겨받음) */
  addCartItem: (variantId, quantity, meta = {}) => {
    const existing = state.cart.find((c) => c.variantId === variantId);
    if (existing) {
      existing.quantity += quantity;
      return existing;
    }
    const item = {
      cartItemId: uuid(),
      productId: meta.productId ?? uuid(),
      variantId,
      name: meta.name ?? "담은 상품",
      color: meta.optionName ?? null,
      size: null,
      unitPrice: meta.price ?? 0,
      quantity,
      thumbnailFileId: null,
      stock: 5,
    };
    state.cart.push(item);
    return item;
  },
  patchCartItem: (id, body) => {
    const item = state.cart.find((c) => c.cartItemId === id);
    Object.assign(item, body);
    return item;
  },
  deleteCartItem: (id) => {
    state.cart = state.cart.filter((c) => c.cartItemId !== id);
    return {};
  },

  createOrder: ({ cartItemIds }) => {
    const picked = state.cart.filter((c) => cartItemIds.includes(c.cartItemId));
    const order = {
      orderId: uuid(),
      orderStatus: "paid",
      paymentStatus: "success",
      paidAmount: picked.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
      paidAt: nowKst(),
      items: picked.map(({ name, color, size, unitPrice, quantity, thumbnailFileId }) => ({
        productName: name,
        variant: { color, size },
        unitPrice,
        quantity,
        thumbnailFileId,
      })),
    };
    state.orders.unshift(order);
    state.cart = state.cart.filter((c) => !cartItemIds.includes(c.cartItemId));
    // 명세 12-8: 구매 상품을 RegisteredProduct(source=purchase)로 자동 등록
    picked.forEach((p) =>
      state.products.push({
        registrationId: uuid(),
        name: p.name,
        serialNumber: `MCM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        nickname: null,
        source: "purchase",
        purchaseDate: nowKst().slice(0, 10),
        thumbnailFileId: null,
        lastDiagnosis: null,
        lastReservation: null,
      })
    );
    return order;
  },
  orders: () => ({ items: state.orders, nextCursor: null, hasNext: false, limit: 20 }),
  order: (id) => state.orders.find((o) => o.orderId === id),

  products: () => ({ items: state.products, nextCursor: null, hasNext: false, limit: 20 }),
  product: (id) => state.products.find((p) => p.registrationId === id),
  registerProduct: (body) => {
    const p = {
      registrationId: uuid(),
      productName: "MCM 등록 제품",
      nickname: body.nickname ?? null,
      serialNumber: body.serialNumber,
      purchaseDate: body.purchaseDate,
      source: "manual",
      thumbnailFileId: null,
      lastDiagnosis: null,
      lastReservation: null,
    };
    state.products.push(p);
    return p;
  },
  careGuide: () => ({
    material: "Visetos Coated Canvas / Leather Trim",
    basics: [
      "직사광선과 고온다습을 피해 더스트백에 보관하세요.",
      "3개월 주기로 전용 가죽 크림을 얇게 도포합니다.",
      "금속 장식은 마른 천으로 닦아 수분을 제거합니다.",
    ],
    cautions: ["알코올·아세톤 성분 클리너 사용 금지", "젖은 상태로 보관 금지"],
    asInfo: "가까운 매장 또는 앱 내 수리 예약으로 접수하실 수 있습니다.",
  }),

  /* 명세 14 + 7: 202 → jobId, 폴링 후 diagnosisId */
  createDiagnosis: (registrationId) => {
    const jobId = uuid();
    const diagnosisId = uuid();
    state.jobs[jobId] = { jobId, type: "diagnosis", startedAt: Date.now(), diagnosisId, registrationId };
    return { jobId, type: "diagnosis" };
  },
  job: (jobId) => {
    const j = state.jobs[jobId];
    if (!j) return { jobId, status: "failed", progress: 0, result: null, error: { code: "NOT_FOUND" } };
    const progress = Math.min(100, Math.round(((Date.now() - j.startedAt) / 4000) * 100));
    if (progress < 100)
      return { jobId, type: j.type, status: progress ? "processing" : "pending", progress, result: null, error: null };

    if (!state.diagnoses.some((d) => d.diagnosisId === j.diagnosisId)) {
      const d = {
        diagnosisId: j.diagnosisId,
        registrationId: j.registrationId,
        repairNeeded: true,
        summary: "모서리 마모와 부분 변색이 확인됩니다.",
        damages: sampleDamages,
        createdAt: nowKst(),
      };
      state.diagnoses.unshift(d);
      const p = state.products.find((x) => x.registrationId === j.registrationId);
      if (p) p.lastDiagnosis = { diagnosisId: d.diagnosisId, repairNeeded: true, createdAt: d.createdAt };
    }
    return { jobId, type: j.type, status: "succeeded", progress: 100, result: { diagnosisId: j.diagnosisId }, error: null };
  },
  diagnosis: (id) => state.diagnoses.find((d) => d.diagnosisId === id),
  diagnosisCareGuide: () => ({
    summary: "마모 부위는 홈케어로 진행 상태를 늦출 수 있으나, 도금 손상은 매장 수리가 필요합니다.",
    steps: ["부드러운 솔로 이물질 제거", "가죽 전용 보습제 소량 도포", "24시간 그늘에서 건조"],
  }),

  stores: (date) => ({
    stores: [
      { storeId: MOCK_STORE_ID, name: "MCM 청담 플래그십", address: "서울 강남구 도산대로", availableSlots: slotsFor(date, [10, 11, 14, 16]) },
      { storeId: uuid(), name: "MCM 롯데 본점", address: "서울 중구 남대문로", availableSlots: slotsFor(date, [13, 15, 17]) },
    ],
  }),
  createReservation: (body) => {
    const r = {
      repairReservationId: uuid(),
      storeId: body.storeId ?? MOCK_STORE_ID,
      slot: body.slot,
      status: "confirmed",
      note: body.note ?? "",
      diagnosisId: body.diagnosisId ?? null,
    };
    state.reservations.unshift(r);
    return r;
  },
  reservations: () => ({ items: state.reservations, nextCursor: null, hasNext: false, limit: 20 }),
  patchReservation: (id, body) => {
    const r = state.reservations.find((x) => x.repairReservationId === id);
    Object.assign(r, body);
    return r;
  },
};

function issueTokens(extra = {}) {
  Object.assign(state.user, extra);
  return {
    userId: state.user.userId,
    accessToken: `mock.access.${Date.now()}`,
    refreshToken: `mock.refresh.${Date.now()}`,
    accessTokenExpiresIn: 7200,
    refreshTokenExpiresIn: 1209600,
  };
}

function slotsFor(date, hours) {
  const day = date ?? new Date().toISOString().slice(0, 10);
  return hours.map((h) => `${day}T${String(h).padStart(2, "0")}:00:00+09:00`);
}
