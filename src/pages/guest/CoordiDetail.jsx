import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth, useData } from '@/store'
import Header from '../../components/guest/Header'
import BottomNav from '../../components/guest/BottomNav'
import { NAV_TABS } from '../../components/guest/navTabs'
import WornItemCard from '../../components/guest/WornItemCard'
import { findProduct, formatPrice, getRandomProduct, getRecommendations, PRODUCTS } from '../../data/products'
import avatarHero from '../../assets/guest/coordi/avatar-hero.jpg'

const DEFAULT_BODY_INFO = { height: 175, weight: 68 }
const MATCHING_LABELS = [
  ['tops', '상의'],
  ['bottoms', '하의'],
  ['outers', '아우터'],
  ['shoes', '신발'],
]

export default function CoordiDetail() {
  const { productId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const authed = useAuth((s) => s.authed)
  const avatar = useAuth((s) => s.avatar)
  const loadMe = useAuth((s) => s.loadMe)
  const setPending = useAuth((s) => s.setPending)
  const saveCoordi = useData((s) => s.saveCoordi)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // /coordi 는 PrivateRoute를 안 거치는 GUEST 라우트라 로그인 상태여도 avatar가 아직 안 불러와졌을 수 있음
    if (authed) loadMe()
  }, [authed, loadMe])

  const product = findProduct(productId) ?? PRODUCTS[0]
  const wornItems = [
    {
      productId: product.id,
      variantId: product.variantId,
      name: product.name,
      price: product.price,
      image: product.image,
      colors: product.matchingItems.colors,
      defaultColor: product.matchingItems.colors[0],
    },
  ]
  const recommendations = getRecommendations(product.id, 2)
  // 라우트 state(스캔→아바타생성 플로우로 들어온 경우)가 없으면, 로그인 회원은 저장해둔 아바타 정보를 그대로 쓴다
  const bodyInfo =
    location.state ?? (avatar ? { height: avatar.heightCm, weight: avatar.weightKg } : DEFAULT_BODY_INFO)

  const coordiName = `${product.name} 스타일링`
  const coordiItems = wornItems.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    price: item.price,
    image: item.image,
  }))

  const handleSaveCoordi = async () => {
    if (!authed) {
      setPending({ type: 'coordi', name: coordiName, run: () => saveCoordi(coordiName, coordiItems) })
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setSaving(true)
    try {
      await saveCoordi(coordiName, coordiItems)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-bg">
      <Header />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="relative overflow-hidden rounded-2xl bg-card">
          <img src={avatarHero} alt="아바타 스타일링" className="h-80 w-full object-cover" />

          <div className="absolute left-3 top-3 flex items-start gap-2 rounded-xl bg-bg/70 p-3 backdrop-blur-md">
            <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-gold" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink/60">체형 데이터 적용됨</p>
              <p className="text-sm font-semibold text-ink">
                {bodyInfo.height}cm / {bodyInfo.weight}kg
              </p>
            </div>
          </div>

          <span
            className="absolute flex items-center gap-1.5 rounded-full bg-bg/70 px-3 py-1.5 text-[11px] font-medium uppercase text-gold backdrop-blur-md"
            style={{ top: '40%', right: '14%' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {product.name}
          </span>

          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-ink/70 to-transparent p-3">
            <button
              type="button"
              onClick={() => navigate('/fitting/photo', { state: { bodyInfo, productId: product.id } })}
              className="flex-1 rounded-full bg-gold px-3 py-2 text-xs font-medium text-bg shadow-lg"
            >
              내 사진으로 피팅하기
            </button>
            <button
              type="button"
              onClick={handleSaveCoordi}
              disabled={saving}
              className="flex-1 rounded-full bg-bg/70 px-3 py-2 text-xs font-medium text-ink backdrop-blur-md disabled:opacity-50"
            >
              {saving ? '저장 중…' : '코디 저장'}
            </button>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-semibold tracking-wide text-ink">착용 중인 아이템</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {wornItems.map((item) => (
              <WornItemCard key={item.name} item={item} />
            ))}
          </ul>
        </section>

        <section className="mt-6 border-b border-greige/30 pb-6">
          <h2 className="text-sm font-semibold tracking-wide text-ink">코디 정보</h2>
          {MATCHING_LABELS.map(([key, label]) => {
            const items = product.matchingItems[key]
            if (!items?.length) return null
            return (
              <div key={key} className="mt-4">
                <p className="text-[10px] uppercase tracking-wider text-ink/50">{label}</p>
                <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
                  {items.map((raw) => {
                    // 지금은 문자열 태그뿐이지만, 나중에 실제 MCM 상품({name, image, price, productId})으로 교체돼도
                    // 그대로 카드에 이미지/가격이 채워지도록 둘 다 받는다
                    const entry = typeof raw === 'string' ? { name: raw } : raw
                    const card = (
                      <div className="w-24 shrink-0 text-left">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-card">
                          {entry.image ? (
                            <img src={entry.image} alt={entry.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-serif text-lg text-ink/25">{entry.name[0]}</span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[11px] leading-tight text-ink">{entry.name}</p>
                        {entry.price != null && (
                          <p className="text-[10px] text-ink/50">{formatPrice(entry.price)}</p>
                        )}
                      </div>
                    )
                    return entry.productId != null ? (
                      <Link key={entry.name} to={`/products/${entry.productId}`}>
                        {card}
                      </Link>
                    ) : (
                      <div key={entry.name}>{card}</div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => navigate(`/coordi/${getRandomProduct().id}`)}
            className="mt-4 w-full rounded-full border border-ink px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-card"
          >
            다른 코디 추천
          </button>
        </section>

        <section className="mt-6">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink/60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
            </svg>
            비슷한 스타일 추천
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {recommendations.map((item) => (
              <Link
                key={item.id}
                to={`/coordi/${item.id}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-card"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-x-2 bottom-2 rounded-full bg-ink/85 py-1 text-center text-[10px] font-medium tracking-wide text-bg">
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
