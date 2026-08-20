import { create } from "zustand";
import * as api from "@/api";
import { toast, toastError } from "./toast";

/**
 * 마이페이지 데이터 캐시. 값이 null 이면 "아직 안 불러옴"(로딩), errors[key] 가 있으면 실패.
 * 화면은 load(key) 만 호출하고, 재시도는 load(key, true).
 */

/** 목록 응답이 배열이든 {items:[...]} 든 받아준다 (명세에 body 가 없는 API 대비) */
const list = (r) => r?.items ?? (Array.isArray(r) ? r : []);

const LOADERS = {
  coordis: () => api.getCoordis().then(list),
  cart: async () => {
    const r = await api.getCart();
    const items = list(r);
    return {
      items,
      totalAmount: r?.totalAmount ?? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    };
  },
  products: () => api.getMyProducts().then(list),
  orders: () => api.getOrders().then(list),
  reservations: () => api.getReservations().then(list),
};

const inflight = new Set();

/* 데모 폴백이 켜지는 순간 데이터 출처가 바뀐다 — 실서버에서 받아둔 목록은 버린다 */
window.addEventListener("mcm-demo-latched", () => useData.getState().reset());

export const useData = create((set, get) => ({
  coordis: null,
  cart: null,
  products: null,
  orders: null,
  reservations: null,
  /** 로드 실패한 키 → ApiError. 화면은 무한 로딩 대신 재시도 UI 를 띄운다 */
  errors: {},

  load: async (key, force = false) => {
    if (inflight.has(key) || (!force && get()[key])) return;
    inflight.add(key);
    set((s) => ({ errors: { ...s.errors, [key]: null } }));
    try {
      set({ [key]: await LOADERS[key]() });
    } catch (e) {
      set((s) => ({ errors: { ...s.errors, [key]: e } }));
    } finally {
      inflight.delete(key);
    }
  },
  put: (key, value) => set({ [key]: value }),
  reset: () =>
    set({ coordis: null, cart: null, products: null, orders: null, reservations: null, errors: {} }),

  /* 장바구니 — 금액 기준은 서버라서 변경 후 항상 재조회 */
  addCartItem: async (variantId, quantity = 1, meta) => {
    try {
      await api.addCartItem(variantId, quantity, meta);
      toast(`${meta?.name ?? "상품"}을 장바구니에 담았습니다.`);
    } catch (e) {
      toastError(e); // 재고 없음(409) 등
    } finally {
      get().load("cart", true);
    }
  },
  setQuantity: async (cartItemId, quantity) => {
    if (quantity < 1) return;
    set({ cart: patchItem(get().cart, cartItemId, { quantity }) }); // 낙관적
    try {
      await api.patchCartItem(cartItemId, { quantity });
    } catch (e) {
      toastError(e); // 재고 부족(409) 등
    } finally {
      get().load("cart", true); // 성공/실패 모두 서버 값으로 되돌림
    }
  },
  removeCartItem: async (cartItemId) => {
    await api.deleteCartItem(cartItemId);
    get().load("cart", true);
  },

  saveCoordi: async (name, items) => {
    try {
      await api.createCoordi(name, items);
      toast(`${name}을 저장했습니다.`);
    } catch (e) {
      toastError(e);
    } finally {
      get().load("coordis", true);
    }
  },
  removeCoordi: async (savedCoordiId) => {
    const before = get().coordis;
    set({ coordis: before.filter((c) => c.savedCoordiId !== savedCoordiId) });
    try {
      await api.deleteCoordi(savedCoordiId);
    } catch (e) {
      set({ coordis: before }); // 롤백
      throw e;
    }
  },

  cancelReservation: async (reservationId) => {
    await api.cancelReservation(reservationId);
    get().load("reservations", true);
  },
}));

const patchItem = (cart, id, patch) => ({
  ...cart,
  items: cart.items.map((i) => (i.cartItemId === id ? { ...i, ...patch } : i)),
  totalAmount: cart.items.reduce(
    (s, i) => s + i.unitPrice * (i.cartItemId === id ? patch.quantity : i.quantity),
    0
  ),
});

export const cartCount = (cart) => (cart?.items ?? []).reduce((s, i) => s + i.quantity, 0);
