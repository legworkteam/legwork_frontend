import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components'
import { cartCount, useAuth, useData } from '@/store'

/** 좌상단 메뉴. 게스트 구간은 [GUEST], 나머지는 PrivateRoute 가 로그인으로 보낸다 */
const SECTIONS = [
  ['둘러보기', [
    ['home', '홈', '/'],
    ['scan', '품번 스캔', '/scan'],
    ['avatar', '아바타 피팅', '/coordi/avatar-demo'],
  ]],
  ['내 정보', [
    ['bookmark', '저장한 코디', '/saved'],
    ['bag', '장바구니', '/cart'],
    ['receipt', '결제 내역', '/orders'],
    ['care', '제품 사후관리', '/care'],
    ['clock', '수리 예약', '/repair-reservations'],
    ['profile', '마이페이지', '/mypage'],
  ]],
]

export default function Header({ transparent = false }) {
  const navigate = useNavigate()
  const authed = useAuth((s) => s.authed)
  const user = useAuth((s) => s.user)
  const loadMe = useAuth((s) => s.loadMe)
  const signOut = useAuth((s) => s.signOut)
  const cart = useData((s) => s.cart)
  const load = useData((s) => s.load)
  const menu = useRef(null)

  useEffect(() => {
    if (!authed) return
    load('cart')
    loadMe() // 메뉴에 이름/이메일을 보여주기 위해 (내부에서 중복 호출은 막힌다)
  }, [authed, load, loadMe])

  const count = cartCount(cart)
  const close = () => menu.current?.close()
  const go = (to) => {
    close()
    navigate(to)
  }

  return (
    <header className={`flex items-center justify-between px-4 py-3 ${transparent ? 'bg-transparent' : 'bg-bg'}`}>
      <button
        type="button"
        aria-label="메뉴 열기"
        className="p-1 text-gold"
        onClick={() => menu.current?.showModal()}
      >
        <Icon name="menu" size={20} />
      </button>

      {/* 네이티브 <dialog> — 배경 잠금·Esc 닫기·포커스 트랩을 브라우저가 처리한다 */}
      <dialog
        ref={menu}
        aria-label="메뉴"
        className="m-0 mr-auto h-full max-h-full w-[280px] max-w-[80%] bg-bg p-0 text-ink backdrop:bg-ink/50"
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="flex h-full flex-col text-left">
          <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <span className="font-serif text-lg font-semibold tracking-tighter text-gold">MCM</span>
            <button type="button" aria-label="메뉴 닫기" className="p-1 text-[15px] text-muted" onClick={close}>
              ✕
            </button>
          </div>

          {authed ? (
            <button
              type="button"
              onClick={() => go('/mypage')}
              className="flex items-center gap-3 border-b border-line px-5 py-4 text-left"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-card font-serif text-base">
                {user?.name?.[0] ?? 'M'}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[13px] font-semibold">{user?.name ?? '회원'}</b>
                <span className="block truncate text-[11px] text-muted">{user?.email}</span>
              </span>
              <span className="text-greige">›</span>
            </button>
          ) : (
            <div className="border-b border-line px-5 py-4">
              <p className="text-[12px] leading-relaxed text-muted">
                로그인하면 저장한 코디와 장바구니를 이어서 볼 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => go('/login')}
                className="mt-3 w-full rounded-full bg-ink py-2.5 text-xs font-semibold text-white"
              >
                로그인 / 회원가입
              </button>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto py-2">
            {SECTIONS.map(([section, items]) => (
              <div key={section} className="px-2 py-2">
                <p className="px-3 pb-1 text-[10px] uppercase tracking-widest text-muted">{section}</p>
                {items.map(([icon, label, to]) => (
                  <button
                    key={to}
                    type="button"
                    onClick={() => go(to)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] hover:bg-card"
                  >
                    <Icon name={icon} size={18} className="text-gold" />
                    {label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {authed && (
            <button
              type="button"
              className="border-t border-line px-5 py-4 text-left text-[13px] text-muted"
              onClick={async () => {
                close()
                await signOut()
                navigate('/login', { replace: true })
              }}
            >
              로그아웃
            </button>
          )}
        </div>
      </dialog>
      <span className="font-serif text-lg font-semibold tracking-tighter text-gold">MCM</span>
      <button type="button" aria-label="장바구니" className="relative p-1 text-gold" onClick={() => navigate('/cart')}>
        <Icon name="bag" size={20} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9px] font-semibold text-bg">
            {count}
          </span>
        )}
      </button>
    </header>
  )
}
