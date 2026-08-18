import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COLOR_SWATCH, formatPrice } from '../../data/products'
import { useAddToCart } from './useAddToCart'

export default function WornItemCard({ item }) {
  const navigate = useNavigate()
  const [color, setColor] = useState(item.defaultColor)
  const [size, setSize] = useState(item.defaultSize)
  const hasOptions = item.colors?.length > 0 || item.sizes?.length > 0
  const sizeLabel = item.sizes?.length ? `SIZE ${size}` : item.fixedSizeLabel
  const variantLabel = [color?.toUpperCase(), sizeLabel].filter(Boolean).join(' / ')

  const { adding, handleAddToCart } = useAddToCart({
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    price: item.price,
    optionName: [color, size].filter(Boolean).join(' / '),
  })

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => item.productId != null && navigate(`/products/${item.productId}`)}
          className="shrink-0"
        >
          <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
        </button>
        <div className="text-left">
          <p className="text-sm font-medium text-ink">{item.name}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink/50">{variantLabel || item.variant}</p>
          {item.price != null && <p className="mt-0.5 text-xs text-ink/70">{formatPrice(item.price)}</p>}
        </div>
      </div>

      {hasOptions && (
        <div className="flex items-center justify-between gap-3 border-t border-greige/30 pt-3">
          {item.colors?.length > 0 && (
            <div className="flex items-center gap-2">
              {item.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={`h-5 w-5 rounded-full border transition ${
                    color === c ? 'border-gold ring-2 ring-gold/40' : 'border-greige/60'
                  }`}
                  style={{ backgroundColor: COLOR_SWATCH[c] ?? '#cccccc' }}
                />
              ))}
            </div>
          )}
          {item.sizes?.length > 0 && (
            <div className="flex items-center gap-1.5">
              {item.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium transition ${
                    size === s ? 'bg-gold text-bg' : 'bg-bg text-ink/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {item.variantId && (
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full rounded-full bg-ink py-2 text-xs font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {adding ? '담는 중…' : '장바구니 담기'}
        </button>
      )}
    </li>
  )
}
