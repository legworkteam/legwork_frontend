import { NavLink } from 'react-router-dom'
import { Icon } from '@/components'

export default function BottomNav({ tabs, activeKey }) {
  return (
    <nav className="flex items-center justify-around border-t border-greige/60 bg-bg py-2">
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
          <Icon name={tab.icon} />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
