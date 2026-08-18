import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/store'
import Header from '../../components/guest/Header'
import BottomNav from '../../components/guest/BottomNav'
import { NAV_TABS } from '../../components/guest/navTabs'

export default function AvatarCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const incomingProductId = location.state?.productId
  const authed = useAuth((s) => s.authed)
  const avatar = useAuth((s) => s.avatar)
  const loadMe = useAuth((s) => s.loadMe)
  const saveAvatar = useAuth((s) => s.saveAvatar)
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('female')

  // /fitting/avatar 는 PrivateRoute 를 안 거치는 GUEST 라우트라 로그인 상태여도
  // avatar 가 아직 안 불러와졌을 수 있음 — 여기서 직접 한 번 더 보장한다
  useEffect(() => {
    if (authed) loadMe()
  }, [authed, loadMe])

  // 로그인 회원이 이전에 저장해둔 키/몸무게/성별이 있으면 그대로 채워서 다시 입력하지 않게 한다
  useEffect(() => {
    if (!avatar) return
    setHeight(String(avatar.heightCm ?? ''))
    setWeight(String(avatar.weightKg ?? ''))
    if (avatar.gender) setGender(avatar.gender)
  }, [avatar])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!height || !weight) return
    const heightCm = Number(height)
    const weightKg = Number(weight)
    if (authed) {
      await saveAvatar({ heightCm, weightKg, gender }).catch(() => null)
    }
    navigate(`/coordi/${incomingProductId ?? 'avatar-demo'}`, { state: { height: heightCm, weight: weightKg, gender } })
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-[430px] flex-col bg-bg">
      <Header />

      <section className="flex flex-1 flex-col justify-center gap-8 px-6 py-10">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">나만의 아바타 만들기</h1>
        <p className="mt-2 text-sm text-ink/60">체형에 맞춰 코디를 제안해드릴게요</p>
      </div>

      <div className="flex h-56 items-center justify-center rounded-2xl bg-card">
        <svg width="72" height="96" viewBox="0 0 72 96" fill="none" stroke="currentColor" className="text-greige">
          <circle cx="36" cy="20" r="16" strokeWidth="2" />
          <path d="M8 92c2-28 14-42 28-42s26 14 28 42" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className="block">
          <span className="text-sm text-ink/70">키 (cm)</span>
          <input
            type="number"
            required
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="mt-2 w-full border-b border-greige bg-transparent pb-2 text-base text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="block">
          <span className="text-sm text-ink/70">몸무게 (kg)</span>
          <input
            type="number"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-2 w-full border-b border-greige bg-transparent pb-2 text-base text-ink outline-none focus:border-ink"
          />
        </label>

        <div>
          <span className="text-sm text-ink/70">성별</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                gender === 'female' ? 'border-ink bg-ink text-bg' : 'border-greige text-ink/70'
              }`}
            >
              여성
            </button>
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                gender === 'male' ? 'border-ink bg-ink text-bg' : 'border-greige text-ink/70'
              }`}
            >
              남성
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg transition hover:opacity-90"
        >
          아바타 생성하기
        </button>
      </form>
      </section>

      <BottomNav tabs={NAV_TABS} activeKey="avatar" />
    </div>
  )
}
