import { Link, useNavigate, useParams } from 'react-router-dom'
import { getMockProduct } from '../data/mockProducts'
import boutiqueBg from '../assets/scan/boutique-bg.png'

export default function ProductConfirm() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const product = getMockProduct(productId)

  return (
    <div className="relative mx-auto flex min-h-svh max-w-sm flex-col justify-end overflow-hidden bg-ink">
      <img src={boutiqueBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />

      <div className="relative z-10 flex flex-col gap-6 px-6 pb-10 pt-24 text-ivory">
        <div>
          <p className="text-xs tracking-[0.2em] text-gold">품번 {productId}</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold">이 제품이 맞나요?</h1>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-ivory/10 p-3 backdrop-blur">
          <span className="h-14 w-14 shrink-0 rounded-lg bg-ivory/15" />
          <div>
            <p className="text-sm font-medium">{product.name}</p>
            <p className="text-[11px] tracking-wide text-ivory/60">{product.variant}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/fitting/avatar', { state: { productId } })}
            className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ivory transition hover:brightness-95"
          >
            네, 맞아요
          </button>
          <Link
            to="/scan"
            className="rounded-full border border-ivory/30 px-6 py-3 text-center text-sm font-medium text-ivory transition hover:bg-ivory/10"
          >
            다시 스캔할게요
          </Link>
        </div>
      </div>
    </div>
  )
}
