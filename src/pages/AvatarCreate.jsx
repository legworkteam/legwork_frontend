import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function AvatarCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const incomingProductId = location.state?.productId
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [gender, setGender] = useState('female')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!height || !weight) return
    navigate(`/coordi/${incomingProductId ?? 'avatar-demo'}`, { state: { height, weight, gender } })
  }

  return (
    <section className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-8 bg-ivory px-6 py-10">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">나만의 아바타 만들기</h1>
        <p className="mt-2 text-sm text-ink/60">체형에 맞춰 코디를 제안해드릴게요</p>
      </div>

      <div className="flex h-56 items-center justify-center rounded-2xl bg-card">
        <svg width="72" height="96" viewBox="0 0 72 96" fill="none" stroke="currentColor" className="text-taupe">
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
            className="mt-2 w-full border-b border-taupe bg-transparent pb-2 text-base text-ink outline-none focus:border-ink"
          />
        </label>

        <label className="block">
          <span className="text-sm text-ink/70">몸무게 (kg)</span>
          <input
            type="number"
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-2 w-full border-b border-taupe bg-transparent pb-2 text-base text-ink outline-none focus:border-ink"
          />
        </label>

        <div>
          <span className="text-sm text-ink/70">성별</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                gender === 'female' ? 'border-ink bg-ink text-ivory' : 'border-taupe text-ink/70'
              }`}
            >
              여성
            </button>
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                gender === 'male' ? 'border-ink bg-ink text-ivory' : 'border-taupe text-ink/70'
              }`}
            >
              남성
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-ivory transition hover:opacity-90"
        >
          아바타 생성하기
        </button>
      </form>
    </section>
  )
}
