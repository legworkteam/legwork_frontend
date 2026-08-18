import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "./icons";
import { cartCount, useAuth, useData } from "@/store";

/**
 * 하단 탭 5개 — 홈/아바타/스캔은 게스트 구간(로그인 여부 무관, [GUEST]), 케어/프로필은 MEMBER.
 * 아이콘은 게스트 구간(BottomNav)과 같은 라인아이콘 세트(icons.jsx)를 쓴다.
 * 4번째 값은 활성 탭 판정용 prefix 목록(없으면 path 자신만 사용) —
 * 아바타 플로우는 /fitting, /coordi 여러 경로에 걸쳐 있어서 별도로 지정한다. (/scan 은 스캔 탭이 따로 있음)
 */
const TABS = [
  ["/", "home", "홈"],
  ["/coordi/avatar-demo", "avatar", "아바타", ["/fitting", "/coordi"]],
  ["/scan", "scan", "스캔"],
  ["/care", "care", "케어"],
  ["/mypage", "profile", "프로필"],
];

/**
 * 모든 화면의 공통 껍데기 — 모바일 프레임 + 헤더 + 하단 탭.
 *   title  없으면 MCM 워드마크
 *   back   경로 문자열이면 그 경로로, true 면 history back, 없으면 뒤로가기 숨김
 *   right  헤더 우측 장바구니 아이콘 노출 여부
 */
export default function Screen({ title, back, right = true, children }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const authed = useAuth((s) => s.authed);
  const cart = useData((s) => s.cart);
  const load = useData((s) => s.load);

  useEffect(() => {
    if (authed) load("cart"); // 헤더 뱃지용
  }, [authed, load]);
  // 중괄호 필수 — 값을 반환하면 React 가 cleanup 으로 오해한다
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const tab = TABS.slice(1).find(([p, , , prefixes]) => (prefixes ?? [p]).some((prefix) => pathname.startsWith(prefix)))?.[0] ?? "/";
  const count = cartCount(cart);

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-bg pb-24">
      <header
        className={`sticky top-0 z-20 grid h-14 grid-cols-[44px_1fr_44px] items-center bg-bg px-2 ${
          title ? "border-b border-line" : ""
        }`}
      >
        {back ? (
          <button
            aria-label="뒤로"
            className="grid h-11 place-items-center text-gold"
            onClick={() => nav(back === true ? -1 : back)}
          >
            <Icon name="chevronLeft" size={20} />
          </button>
        ) : (
          <span />
        )}

        {title ? (
          <h1 className="text-center font-serif text-base font-bold">{title}</h1>
        ) : (
          <div className="text-center font-serif text-lg font-semibold tracking-tighter text-gold">MCM</div>
        )}

        {right ? (
          <button
            aria-label="장바구니"
            className="relative grid h-11 place-items-center text-gold"
            onClick={() => nav("/cart")}
          >
            <Icon name="bag" size={20} />
            {count > 0 && (
              <span className="absolute right-1 top-1.5 min-w-3.5 rounded-lg bg-ink px-1 text-[9px] leading-[14px] text-white">
                {count}
              </span>
            )}
          </button>
        ) : (
          <span />
        )}
      </header>

      <main className="view-in px-5 pb-6 pt-2">{children}</main>

      <nav className="fixed bottom-0 z-20 grid w-full max-w-[430px] grid-cols-5 border-t border-line bg-bg/95 py-2 backdrop-blur">
        {TABS.map(([path, icon, label]) => {
          const on = tab === path;
          return (
            <button
              key={path}
              onClick={() => nav(path)}
              className={`grid justify-items-center gap-0.5 py-1 text-[10px] ${
                on ? "font-semibold text-ink" : "text-muted"
              }`}
            >
              <Icon name={icon} size={20} className={on ? "text-gold" : "opacity-60"} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
