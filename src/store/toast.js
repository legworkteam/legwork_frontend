import { create } from "zustand";

/** 화면 하단 토스트 — 컴포넌트는 <Toast/> 하나, 호출은 어디서든 toast() */
export const useToast = create((set) => ({
  msg: "",
  show: (msg) => {
    set({ msg });
    clearTimeout(useToast._t);
    useToast._t = setTimeout(() => set({ msg: "" }), 2000);
  },
}));

export const toast = (msg) => useToast.getState().show(msg);

/** ApiError 면 서버가 준 message 를 그대로 노출 (명세 1.4) */
export const toastError = (e) => toast(e?.message ?? "요청을 처리하지 못했습니다.");
