import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/guest/Header'
import BottomNav from '../../components/guest/BottomNav'
import { NAV_TABS } from '../../components/guest/navTabs'
import boutiqueBg from '../../assets/guest/scan/boutique-bg.jpg'
import { getRandomProduct } from '../../data/products'

export default function Scan() {
  const [mode, setMode] = useState('photo')
  const [productNumber, setProductNumber] = useState('')
  const navigate = useNavigate()

  const handleCapture = () => {
    // OCR 미연동 — 실제 카탈로그에서 임의 상품을 인식 결과로 사용
    navigate(`/scan/confirm/${getRandomProduct().id}`)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!productNumber.trim()) return
    navigate(`/scan/confirm/${encodeURIComponent(productNumber.trim())}`)
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-ink">
      <Header transparent />

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-8 text-center text-bg">
        <img src={boutiqueBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/70 to-ink" />

        {mode === 'photo' ? (
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div>
              <h1 className="font-serif text-2xl font-semibold">품번 스캐너</h1>
              <p className="mt-2 text-sm text-bg/70">제품 태그를 사진으로 촬영해주세요</p>
            </div>

            <div className="relative h-56 w-56 overflow-hidden rounded-2xl border-2 border-gold/90 bg-bg/5 backdrop-blur-sm">
              <div className="absolute left-0 top-0 h-0.5 w-full animate-[scan-line_2s_linear_infinite] bg-gold shadow-[0_0_8px_rgba(136,82,0,0.8)]" />
            </div>

            <button
              type="button"
              onClick={handleCapture}
              className="flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg transition hover:brightness-95"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
                <circle cx="12" cy="13" r="3.2" />
              </svg>
              사진으로 촬영하기
            </button>

            <button
              type="button"
              onClick={() => setMode('manual')}
              className="text-xs tracking-wide text-bg/60 underline underline-offset-4"
            >
              품번을 직접 입력할래요
            </button>
          </div>
        ) : (
          <div className="relative z-10 flex w-full flex-col items-center gap-6">
            <div>
              <h1 className="font-serif text-2xl font-semibold">품번 직접 입력</h1>
              <p className="mt-2 text-sm text-bg/70">제품 태그에 적힌 품번을 입력해주세요</p>
            </div>

            <form onSubmit={handleManualSubmit} className="flex w-full flex-col gap-4">
              <input
                type="text"
                required
                placeholder="예: MMXXXXXXXXX"
                value={productNumber}
                onChange={(e) => setProductNumber(e.target.value)}
                className="w-full rounded-lg border border-greige/40 bg-bg/10 px-4 py-2.5 text-sm text-bg placeholder:text-bg/40 outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-bg transition hover:brightness-95"
              >
                확인
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode('photo')}
              className="text-xs tracking-wide text-bg/60 underline underline-offset-4"
            >
              사진으로 촬영할래요
            </button>
          </div>
        )}
      </div>

      <BottomNav tabs={NAV_TABS} />
    </div>
  )
}
