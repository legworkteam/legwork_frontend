import { useState } from 'react'

const COLOR_SWATCH = {
  black: '#1a1c1c',
  cognac: '#a9642f',
  white: '#f5f1ea',
}

export default function WornItemCard({ item }) {
  const [color, setColor] = useState(item.defaultColor)
  const [size, setSize] = useState(item.defaultSize)
  const hasOptions = item.colors?.length > 0 || item.sizes?.length > 0
  const sizeLabel = item.sizes?.length ? `SIZE ${size}` : item.fixedSizeLabel
  const variantLabel = [color?.toUpperCase(), sizeLabel].filter(Boolean).join(' / ')

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-3">
      <div className="flex items-center gap-3">
        <img src={item.image} alt={item.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
        <div className="text-left">
          <p className="text-sm font-medium text-ink">{item.name}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink/50">{variantLabel || item.variant}</p>
        </div>
      </div>

      {hasOptions && (
        <div className="flex items-center justify-between gap-3 border-t border-taupe/30 pt-3">
          {item.colors?.length > 0 && (
            <div className="flex items-center gap-2">
              {item.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={`h-5 w-5 rounded-full border transition ${
                    color === c ? 'border-gold ring-2 ring-gold/40' : 'border-taupe/60'
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
                    size === s ? 'bg-gold text-ivory' : 'bg-ivory text-ink/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  )
}
