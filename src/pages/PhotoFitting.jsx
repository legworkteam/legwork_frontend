import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import BottomNav from '../components/BottomNav'
import { NAV_TABS } from '../components/navTabs'

const GUEST_UPLOAD_LIMIT = 3
const STORAGE_KEY = 'guest_photo_upload_count'

export default function PhotoFitting() {
  const navigate = useNavigate()
  const location = useLocation()
  const bodyInfo = location.state?.bodyInfo
  const fileInputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploadCount, setUploadCount] = useState(() => Number(localStorage.getItem(STORAGE_KEY) ?? 0))

  const remaining = GUEST_UPLOAD_LIMIT - uploadCount
  const limitReached = remaining <= 0

  useEffect(() => {
    if (limitReached) {
      navigate('/fitting/photo/limit', { replace: true })
    }
  }, [limitReached, navigate])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = () => {
    if (!previewUrl || limitReached) return
    const nextCount = uploadCount + 1
    setUploadCount(nextCount)
    localStorage.setItem(STORAGE_KEY, String(nextCount))
    navigate('/fitting/photo/result', { state: { photoUrl: previewUrl, bodyInfo } })
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-sm flex-col bg-ink text-ivory">
      <Header transparent />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold">내 사진으로 보기</h1>
          <p className="mt-2 text-sm text-ivory/70">사진을 올리면 AI가 제품을 합성해드려요</p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gold/60 bg-ivory/5"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="업로드한 사진 미리보기" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-ivory/60">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="10" r="1.5" />
                <path d="m4 18 5-5 3 3 4-4 4 4" />
              </svg>
              <span className="text-sm">갤러리에서 사진 선택</span>
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <p className="text-xs text-ivory/50">
          게스트는 최대 {GUEST_UPLOAD_LIMIT}회까지 업로드할 수 있어요 ({Math.max(remaining, 0)}회 남음)
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!previewUrl}
          className="w-full rounded-full bg-gold px-6 py-3 text-sm font-medium text-ivory transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          합성하기
        </button>
      </div>

      <BottomNav tabs={NAV_TABS} />
    </div>
  )
}
