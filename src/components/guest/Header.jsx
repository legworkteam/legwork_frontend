import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components'
import { cartCount, useAuth, useData } from '@/store'

export default function Header({ transparent = false }) {
  const navigate = useNavigate()
  const authed = useAuth((s) => s.authed)
  const cart = useData((s) => s.cart)
  const load = useData((s) => s.load)

  useEffect(() => {
    if (authed) load('cart')
  }, [authed, load])

  const count = cartCount(cart)

  return (
    <header className={`flex items-center justify-between px-4 py-3 ${transparent ? 'bg-transparent' : 'bg-bg'}`}>
      <button type="button" aria-label="메뉴 열기" className="p-1 text-gold">
        <Icon name="menu" size={20} />
      </button>
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
