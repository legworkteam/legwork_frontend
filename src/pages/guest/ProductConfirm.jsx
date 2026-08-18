import { Link, useNavigate, useParams } from 'react-router-dom'
import { findProduct, formatPrice } from '../../data/products'
import Header from '../../components/guest/Header'
import BottomNav from '../../components/guest/BottomNav'
import { NAV_TABS } from '../../components/guest/navTabs'
import boutiqueBg from '../../assets/guest/scan/boutique-bg.jpg'

export default function ProductConfirm() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const product = findProduct(productId)

  return (
    <div className="relative mx-auto flex min-h-svh max-w-[430px] flex-col overflow-hidden bg-ink">
      <img src={boutiqueBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />

      <div className="relative z-10">
        <Header transparent />
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-end gap-6 px-6 pb-10 text-bg">
        <div>
          <p className="text-xs tracking-[0.2em] text-gold">품번 {product?.productCode ?? productId}</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold">이 제품이 맞나요?</h1>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-bg/10 p-3 backdrop-blur">
          {product ? (
            <img src={product.image} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          ) : (
            <span className="h-14 w-14 shrink-0 rounded-lg bg-bg/15" />
          )}
          <div>
            <p className="text-sm font-medium">{product?.name ?? '인식된 제품'}</p>
            <p className="text-[11px] tracking-wide text-bg/60">
              {product ? `${product.category} · ${formatPrice(product.price)}` : productId}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/fitting/avatar', { state: { productId: product?.id ?? productId } })}
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg transition hover:brightness-95"
          >
            네, 맞아요
          </button>
          <Link
            to="/scan"
            className="rounded-full border border-bg/30 px-6 py-3 text-center text-sm font-medium text-bg transition hover:bg-bg/10"
          >
            다시 스캔할게요
          </Link>
        </div>
      </div>

      <div className="relative z-10">
        <BottomNav tabs={NAV_TABS} activeKey="scan" />
      </div>
    </div>
  )
}
