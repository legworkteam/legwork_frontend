import { NavLink } from 'react-router-dom'

const ICON_PATHS = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v10h14V10" />,
  scan: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M4 12h16" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" />
    </>
  ),
  avatar: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="10" r="2.6" />
      <path d="M7 18c1-2.5 3-3.5 5-3.5s4 1 5 3.5" />
    </>
  ),
  care: (
    <path d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1.2 4 2.7C10.5 6.2 12 5 14 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20Z" />
  ),
}

export default function BottomNav({ tabs, activeKey }) {
  return (
    <nav className="flex items-center justify-around border-t border-taupe/60 bg-ivory py-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          className={({ isActive }) => {
            const active = activeKey ? activeKey === tab.key : isActive
            return `flex flex-col items-center gap-1 px-4 py-1 text-[11px] tracking-wide ${
              active ? 'text-gold' : 'text-ink/50'
            }`
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {ICON_PATHS[tab.icon]}
          </svg>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
