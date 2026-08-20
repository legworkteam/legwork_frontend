import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import * as api from '@/api'
import { Thumb } from '@/components'
import { useFileUrl, useJob } from '@/hooks'
import { toast, toastError, useAuth } from '@/store'
import Header from '../../components/guest/Header'
import BottomNav from '../../components/guest/BottomNav'
import { NAV_TABS } from '../../components/guest/navTabs'
import WornItemCard from '../../components/guest/WornItemCard'
import { findProduct, getRecommendations, PRODUCTS } from '../../data/products'
import fallbackHero from '../../assets/guest/coordi/photo-fitting-fallback.jpg'

export default function PhotoFittingResult() {
  const location = useLocation()
  const navigate = useNavigate()
  const authed = useAuth((s) => s.authed)
  const bodyInfo = location.state?.bodyInfo ?? { height: 175, weight: 68 }

  // 실제 합성을 요청했으면 Job 이 끝나는 대로 결과 이미지로 갈아끼운다 (없으면 올린 사진 그대로)
  const job = useJob(location.state?.jobId)
  const resultUrl = useFileUrl(job?.result?.resultFileId)
  const heroImage = resultUrl ?? location.state?.photoUrl ?? fallbackHero
  const pending = location.state?.jobId && !resultUrl && job?.status !== 'failed'

  /** 합성 결과는 TTL 3시간 — 회원이 명시적으로 저장해야 영구화된다 (명세 9) */
  const handleSave = async () => {
    const tryOnId = job?.result?.tryOnId
    if (!tryOnId) return toast('저장할 합성 결과가 없습니다')
    if (!authed) return navigate('/login', { state: { from: location.pathname } })
    try {
      await api.saveTryOn(tryOnId)
      toast('저장했습니다')
    } catch (e) {
      toastError(e)
    }
  }
  const product = findProduct(location.state?.productId) ?? PRODUCTS[0]
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

  // 서버 카탈로그 상품이면 rule-based 추천(명세 6)을 쓰고, 없으면 로컬 규칙 추천으로 떨어진다
  const [serverRecs, setServerRecs] = useState(null)
  useEffect(() => {
    if (!api.isServerProduct(location.state?.productId)) return
    api
      .getProductRecommendations(location.state?.productId)
      .then((r) => setServerRecs(r?.items ?? r))
      .catch(() => null)
  }, [location.state?.productId])

  const recoCards = serverRecs?.length
    ? serverRecs.map((r) => ({ key: r.productId, to: `/products/${r.productId}`, fileId: r.thumbnailFileId, name: r.name }))
    : recommendations.map((r) => ({ key: r.id, to: `/products/${r.id}`, image: r.image, name: r.name }))


  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-bg">
      <Header />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <p className="mb-3 text-xs uppercase tracking-widest text-ink/50">나의 사진 피팅 결과</p>

        <div className="relative overflow-hidden rounded-2xl bg-card">
          <img src={heroImage} alt="내 사진 피팅 결과" className="h-80 w-full object-cover" />
          {pending && (
            <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-3 py-1.5 text-[11px] text-bg backdrop-blur-md">
              합성 중…
            </span>
          )}

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
            style={{ top: '55%', left: '35%' }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {product.name}
          </span>

          <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-ink/70 to-transparent p-3">
            <button
              type="button"
              className="flex-1 rounded-full bg-gold px-3 py-2 text-xs font-medium text-bg shadow-lg"
            >
              공유하기
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-full bg-bg/70 px-3 py-2 text-xs font-medium text-ink backdrop-blur-md"
            >
              저장하기
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

        <section className="mt-6">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink/60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
            </svg>
            비슷한 스타일 추천
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {recoCards.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-card"
              >
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <Thumb fileId={item.fileId} label={item.name?.[0] ?? 'M'} className="h-full w-full" />
                )}
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
