import { create } from "zustand";
import * as api from "@/api";
import { clearTokens, getTokens, setTokens, subscribeTokens } from "@/api/tokens";
import { useData } from "./data";
import { toastError } from "./toast";

/**
 * 로그인 상태. 토큰 자체는 api/tokens.js 가 소유하고 여기서는 화면 상태만 들고 있다.
 * (axios interceptor ↔ 스토어 순환참조 방지)
 */
let loadingMe = false; // PrivateRoute 가 라우트마다 호출해도 /me 는 한 번만

export const useAuth = create((set, get) => ({
  authed: !!getTokens().accessToken,
  user: null,
  avatar: null,
  /** 게스트가 로그인 전에 누른 액션 (게스트 화면에서 setPending → 로그인 후 /complete 가 소비) */
  pending: null,
  setPending: (pending) => set({ pending }),

  /** fn 은 토큰을 반환하는 API 호출 — api.login / api.socialLogin */
  signIn: async (fn) => {
    setTokens(await fn()); // { accessToken, refreshToken, ... }

    // 명세 3. /auth/claim — 게스트 세션 데이터를 회원으로 이관
    const { guestToken } = getTokens();
    if (guestToken) {
      await api.claimGuest(guestToken).catch(() => null);
      setTokens({ guestToken: null, guestSessionId: null });
    }
    set({ authed: true });
    await get().loadMe();

    // 게스트가 입력한 키/몸무게/성별을 회원 아바타로 승격.
    // 회원에게 이미 아바타가 있으면 그쪽이 우선이고 게스트 값은 버린다.
    const guestAvatar = api.takeGuestAvatar();
    if (guestAvatar && !get().avatar) await get().saveAvatar(guestAvatar).catch(() => null);

    // 게스트 화면에서 setPending 으로 남겨둔 액션(예: 장바구니 담기)을 로그인 직후 실행
    await get().pending?.run?.().catch(() => null);
  },

  loadMe: async () => {
    if (get().user || loadingMe) return;
    loadingMe = true;
    try {
      // 아바타는 아직 안 만들었을 수 있으므로(404) 실패해도 진행
      const [user, avatar] = await Promise.all([api.getMe(), api.getAvatar().catch(() => null)]);
      set({ user, avatar });
    } catch (e) {
      toastError(e); // 401 은 interceptor 가 이미 /login 으로 보냄
    } finally {
      loadingMe = false;
    }
  },

  /** 회원 아바타 저장 — 다음에 아바타 탭에 들어와도 키/몸무게/성별이 그대로 유지되도록 서버에 반영 */
  saveAvatar: async (body) => {
    const avatar = await api.putAvatar(body);
    set({ avatar });
    return avatar;
  },

  signOut: async () => {
    await api.logout(getTokens().refreshToken).catch(() => null);
    clearTokens();
    set({ authed: false, user: null, avatar: null, pending: null });
    useData.getState().reset();
  },
}));

/* 토큰이 밖에서 사라지면(401 / refresh 실패) 화면 상태도 로그아웃으로 */
subscribeTokens((t) => {
  if (!t.accessToken && useAuth.getState().authed) {
    useAuth.setState({ authed: false, user: null, avatar: null });
  }
});
