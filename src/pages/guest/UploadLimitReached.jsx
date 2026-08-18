import { useNavigate } from 'react-router-dom'
import { Icon } from '@/components'
import BottomNav from '../../components/guest/BottomNav'
import { NAV_TABS } from '../../components/guest/navTabs'

export default function UploadLimitReached() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-bg">
      <header className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          aria-label="뒤로 가기"
          onClick={() => navigate(-1)}
          className="-ml-2 p-2 text-gold transition hover:opacity-70"
        >
          <Icon name="chevronLeft" size={22} />
        </button>
        <span className="font-serif text-lg font-semibold tracking-tighter text-gold">MCM</span>
        <span className="w-9" />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-card">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 2.5" />
            <path d="M9 2h6M5 5l1.5 1.5M19 5l-1.5 1.5" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="font-serif text-2xl font-semibold text-ink">업로드 횟수 초과</h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-ink/60">
            게스트는 하루 최대 3회까지만 사진 피팅을 체험할 수 있어요. 로그인하시면 업로드 횟수 제한 없이 자유롭게 이용하실 수 있습니다.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/scan')}
            className="w-full rounded-full bg-ink px-6 py-3.5 text-sm font-medium uppercase tracking-wider text-bg transition hover:opacity-90"
          >
            확인
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full rounded-full border border-gold/30 px-6 py-3.5 text-sm font-medium uppercase tracking-wider text-gold transition hover:bg-gold/5"
          >
            로그인 / 회원가입하기
          </button>
        </div>
      </main>

      <BottomNav tabs={NAV_TABS} activeKey="avatar" />
    </div>
  )
}
