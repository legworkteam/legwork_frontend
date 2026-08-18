import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useData } from '@/store'
import Header from '../../components/guest/Header'
import BottomNav from '../../components/guest/BottomNav'
import { NAV_TABS } from '../../components/guest/navTabs'
import { PRODUCTS, formatPrice } from '../../data/products'
import boutiqueBg from '../../assets/guest/scan/boutique-bg.jpg'

const POPULAR = [...PRODUCTS].sort((a, b) => b.likes - a.likes).slice(0, 6)

export default function Home() {
  const navigate = useNavigate()
  const authed = useAuth((s) => s.authed)
  const coordis = useData((s) => s.coordis)
  const loadCoordis = useData((s) => s.load)

  useEffect(() => {
    if (authed) loadCoordis('coordis')
  }, [authed, loadCoordis])

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-bg">
      <Header />

      <div className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-16 text-center text-bg">
        <img src={boutiqueBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/70 to-ink" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">Atelier Lens</p>
          <h1 className="font-serif text-3xl font-semibold leading-tight">디지털 럭셔리의 완성</h1>
          <p className="text-sm text-bg/70">
            매장에서 품번을 스캔하면 나만의 아바타로
            <br />
            바로 스타일링해볼 수 있어요
          </p>
          <button
            type="button"
            onClick={() => navigate('/scan')}
            className="mt-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg transition hover:brightness-95"
          >
            품번 스캔하기
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-ink">인기 상품</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {POPULAR.map((p) => (
            <Link key={p.id} to={`/coordi/${p.id}`} className="w-32 shrink-0 overflow-hidden rounded-xl bg-card">
              <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" />
              <div className="p-2 text-left">
                <p className="truncate text-xs font-medium text-ink">{p.name}</p>
                <p className="text-[11px] text-ink/60">{formatPrice(p.price)}</p>
              </div>
            </Link>
          ))}
        </div>

        {authed && coordis?.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-sm font-semibold tracking-wide text-ink">저장한 코디</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {coordis.map((c) => {
                const thumb = c.items?.[0]?.image
                return (
                  <Link
                    key={c.savedCoordiId}
                    to={`/saved/${c.savedCoordiId}`}
                    className="w-32 shrink-0 overflow-hidden rounded-xl bg-card"
                  >
                    <div className="flex aspect-square w-full items-center justify-center overflow-hidden">
                      {thumb ? (
                        <img src={thumb} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-serif text-lg text-ink/25">{c.name[0]}</span>
                      )}
                    </div>
                    <div className="p-2 text-left">
                      <p className="truncate text-xs font-medium text-ink">{c.name}</p>
                      <p className="text-[11px] text-ink/60">{c.itemCount}개 아이템</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>

      <BottomNav tabs={NAV_TABS} activeKey="home" />
    </div>
  )
}
