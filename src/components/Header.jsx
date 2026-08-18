export default function Header({ transparent = false }) {
  return (
    <header
      className={`flex items-center justify-between px-4 py-3 ${
        transparent ? 'bg-transparent text-ivory' : 'bg-ivory text-ink'
      }`}
    >
      <button type="button" aria-label="메뉴 열기" className="p-1">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
      <span className="font-serif text-lg font-semibold tracking-[0.2em]">MCM</span>
      <button type="button" aria-label="알림" className="p-1">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>
    </header>
  )
}
