import { useParams } from 'react-router-dom'
import Header from '../../components/guest/Header'
import BottomNav from '../../components/guest/BottomNav'
import { NAV_TABS } from '../../components/guest/navTabs'
import { useAddToCart } from '../../components/guest/useAddToCart'
import { findProduct, formatPrice, PRODUCTS } from '../../data/products'

export default function ProductDetail() {
  const { productId } = useParams()
  const product = findProduct(productId) ?? PRODUCTS[0]
  const { adding, handleAddToCart } = useAddToCart({
    productId: product.id,
    variantId: product.variantId,
    name: product.name,
    price: product.price,
  })

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-bg">
      <Header />

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="relative overflow-hidden rounded-2xl bg-card">
          <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
          <div className="absolute left-3 top-3 flex gap-1.5">
            {product.isNew && (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-bg">
                New
              </span>
            )}
            {product.isBestSeller && (
              <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-bg">
                Best
              </span>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-ink/50">{product.category}</p>
          <h1 className="mt-1 font-serif text-xl font-semibold text-ink">{product.name}</h1>
          <p className="mt-1.5 text-lg font-semibold text-ink">{formatPrice(product.price)}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-ink/60">
            <span>★ {product.rating} ({product.reviewCount})</span>
            <span>좋아요 {product.likes.toLocaleString('ko-KR')}</span>
            <span>누적 판매 {product.sales.toLocaleString('ko-KR')}</span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-ink/70">{product.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.hashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-card px-2.5 py-1 text-[11px] text-ink/60">
              {tag}
            </span>
          ))}
        </div>

        <section className="mt-6 border-t border-greige/30 pt-4">
          <h2 className="text-sm font-semibold tracking-wide text-ink">이런 스타일과 잘 어울려요</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...product.styleTags, ...product.matchingItems.colors].map((tag) => (
              <span key={tag} className="rounded-full border border-greige/60 px-2.5 py-1 text-[11px] text-ink/70">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl bg-card p-3 text-xs text-ink/60">
          <div className="flex justify-between py-1">
            <span>품번</span>
            <span className="text-ink">{product.productCode}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>바코드</span>
            <span className="text-ink">{product.barcode}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>제조년월</span>
            <span className="text-ink">{product.manufacturedAt}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>재고</span>
            <span className="text-ink">{product.stock}개</span>
          </div>
        </section>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding}
          className="mt-6 w-full rounded-full bg-ink py-3 text-sm font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {adding ? '담는 중…' : '장바구니 담기'}
        </button>
      </div>

      <BottomNav tabs={NAV_TABS} activeKey="avatar" />
    </div>
  )
}
