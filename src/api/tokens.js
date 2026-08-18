/**
 * 토큰 저장소. localStorage 단일 소유자 — axios interceptor 와 zustand 양쪽이 여기만 본다.
 * (서로 import 하면 순환참조라서 이 모듈로 분리)
 *
 * 게스트 플로우(팀원 파트)는 POST /guest-sessions 응답을 받으면
 *   setTokens({ guestToken, guestSessionId })
 * 만 호출하면 됨. 로그인 시 /auth/claim 으로 자동 이관된다.
 */
const KEY = "mcm-auth";
const listeners = new Set();

export const getTokens = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
};

export const setTokens = (patch) => {
  localStorage.setItem(KEY, JSON.stringify({ ...getTokens(), ...patch }));
  emit();
};

export const clearTokens = () => {
  localStorage.removeItem(KEY);
  emit();
};

export const subscribeTokens = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const emit = () => listeners.forEach((fn) => fn(getTokens()));
