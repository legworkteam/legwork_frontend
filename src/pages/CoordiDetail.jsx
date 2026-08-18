import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { NAV_TABS } from '../components/navTabs'
import WornItemCard from '../components/WornItemCard'
import { DEFAULT_COORDI, MOCK_COORDI } from '../data/mockCoordi'
import profileAvatar from '../assets/coordi/profile-avatar.jpg'

export default function CoordiDetail() {
  const { productId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const coordi = MOCK_COORDI[productId] ?? DEFAULT_COORDI
  const bodyInfo = location.state ?? { height: 175, weight: 68 }
  const [selectedHairstyle, setSelectedHairstyle] = useState(coordi.hairstyles[0]?.id)

  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col bg-ivory">
      <header className="flex items-center justify-between px-4 py-3">
        <button type="button" aria-label="메뉴 열기" className="p-1 text-gold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <span className="font-serif text-lg font-semibold tracking-tighter text-gold">MCM</span>
        <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-card">
          <img src={profileAvatar} alt="프로필" className="h-full w-full object-cover" />
        </span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="relative overflow-hidden rounded-2xl bg-card">
          <img src={coordi.heroImage} alt="아바타 스타일링" className="h-80 w-full object-cover" />

          <div className="absolute left-3 top-3 flex items-start gap-2 rounded-xl bg-ivory/70 p-3 backdrop-blur-md">
            <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-gold" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink/60">체형 데이터 적용됨</p>
              <p className="text-sm font-semibold text-ink">
                {bodyInfo.height}cm / {bodyInfo.weight}kg
              </p>
            </div>
          </div>

          {coordi.tags.map((tag, index) => (
            <span
              key={tag}
              className="absolute flex items-center gap-1.5 rounded-full bg-ivory/70 px-3 py-1.5 text-[11px] font-medium uppercase text-gold backdrop-blur-md"
              style={index === 0 ? { top: '40%', right: '14%' } : { bottom: '34%', left: '10%' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {tag}
            </span>
          ))}

          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-ink/70 to-transparent p-3">
            <button
              type="button"
              onClick={() => navigate('/fitting/photo', { state: { bodyInfo } })}
              className="flex-1 rounded-full bg-gold px-3 py-2 text-xs font-medium text-ivory shadow-lg"
            >
              내 사진으로 피팅하기
            </button>
            <button
              type="button"
              className="flex-1 rounded-full bg-ivory/70 px-3 py-2 text-xs font-medium text-ink backdrop-blur-md"
            >
              사이즈 비교
            </button>
          </div>
        </div>

        <section className="mt-6 border-b border-taupe/30 pb-6">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-ink">헤어 스타일링</h2>
          <div className="flex gap-3 overflow-x-auto">
            {coordi.hairstyles.map((style) => {
              const isSelected = selectedHairstyle === style.id
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedHairstyle(style.id)}
                  className="flex shrink-0 flex-col items-center gap-2"
                >
                  <span
                    className={`relative block h-20 w-20 rounded-xl border-2 bg-card p-1 transition ${
                      isSelected ? 'border-gold' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img
                      src={style.image}
                      alt={style.label}
                      className={`h-full w-full rounded-lg object-cover transition ${
                        isSelected ? '' : 'grayscale-[30%]'
                      }`}
                    />
                    {isSelected && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-ivory">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-[11px] uppercase tracking-wide ${isSelected ? 'font-bold text-gold' : 'text-ink/50'}`}
                  >
                    {style.label}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-ink">착용 중인 아이템</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {coordi.wornItems.map((item) => (
              <WornItemCard key={item.name} item={item} />
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink/60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
            </svg>
            비슷한 스타일 추천
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {coordi.recommendations.map((item) => (
              <Link
                key={item.id}
                to={`/coordi/${item.id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-card"
              >
                <img
                  src={item.image}
                  alt={item.label}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/85 py-1 text-center text-[10px] font-medium tracking-wide text-ivory">
                  VIEW
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <BottomNav tabs={NAV_TABS} activeKey="avatar" />
    </div>
  )
}
