import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <section className="mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-semibold tracking-tight text-ink">Legwork</h1>
      <p className="text-neutral-600">
        React + Vite + Tailwind CSS + React Router 기본 세팅입니다.
      </p>
      <Link
        to="/mypage"
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-ivory transition hover:opacity-90"
      >
        마이페이지로 이동
      </Link>
    </section>
  )
}
