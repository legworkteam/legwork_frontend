import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function MyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <section className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-ink">마이페이지</h1>
      <p className="text-sm text-ink/70">{user?.email}님, 환영합니다.</p>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-full border border-ink px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-card"
      >
        로그아웃
      </button>
    </section>
  )
}
