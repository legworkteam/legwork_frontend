import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')

  const from = location.state?.from?.pathname ?? '/mypage'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    login({ email })
    navigate(from, { replace: true })
  }

  return (
    <section className="mx-auto flex min-h-svh max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold text-ink">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-taupe bg-card px-4 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ivory transition hover:opacity-90"
        >
          로그인
        </button>
      </form>
    </section>
  )
}
