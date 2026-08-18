import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as api from "@/api";
import { Emblem, Field } from "@/components";
import { toastError, toast, useAuth } from "@/store";

/**
 * 명세 19: LG-00 로그인 / LG-01 회원가입 / LG-02 소셜로그인.
 * 소셜은 Google, Kakao (백엔드 확정). SDK 로 authorizationCode 를 받아 POST /auth/social 로 넘긴다.
 */
export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { signIn, pending } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [busy, setBusy] = useState(null);
  const from = loc.state?.from ?? "/mypage";

  const done = () => nav(pending ? "/complete" : from, { replace: true });

  const submit = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    setBusy("form");
    try {
      if (mode === "signup") {
        await api.signup(f);
        toast("가입이 완료되었습니다. 로그인해 주세요.");
        setMode("login");
      } else {
        await signIn(() => api.login(f.email, f.password));
        done();
      }
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(null);
    }
  };

  /**
   * 클라이언트 ID 가 있으면 실제 카카오/구글 인가 페이지로 이동한다.
   * (더미 모드여도 마찬가지 — 코드 교환만 mock 이 받으므로 동의 화면까지 실물로 확인 가능)
   * 키가 아직 없을 때만 인가 페이지를 건너뛰고 더미 토큰을 발급한다.
   */
  const social = async (provider) => {
    setBusy(provider);
    try {
      if (api.isConfigured(provider)) {
        return api.startSocialLogin(provider, pending ? "/complete" : from); // 페이지 이동
      }
      if (!api.USE_MOCK) throw new Error(`${provider} 클라이언트 ID가 설정되지 않았습니다.`);
      await signIn(() => api.socialLogin(provider, "mock-authorization-code"));
      done();
    } catch (e) {
      toastError(e);
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col justify-center bg-bg px-6 py-10">
      <div className="text-center">
        <Emblem className="mx-auto mb-3.5 h-14 w-14 text-gold" />
        <div className="font-serif text-2xl font-bold tracking-[0.3em] text-gold">MCM</div>
        <p className="lbl mt-6">{mode === "login" ? "MEMBERS ONLY" : "CREATE ACCOUNT"}</p>
        <h2 className="mt-2 font-serif text-[26px] font-bold leading-tight">디지털 럭셔리의 완성</h2>
        <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-muted">
          {pending
            ? "저장하려면 로그인이 필요합니다.\n로그인하면 보던 코디가 그대로 이어집니다."
            : "저장한 코디와 장바구니는\n로그인 후 이용하실 수 있습니다."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-9">
        {mode === "signup" && (
          <>
            <Field label="이름">
              <input name="name" required placeholder="홍길동" />
            </Field>
            <Field label="휴대폰 (선택)">
              <input name="phone" placeholder="010-1234-5678" />
            </Field>
          </>
        )}
        <Field label="이메일">
          <input name="email" type="email" required placeholder="user@example.com" />
        </Field>
        <Field label="비밀번호">
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder={mode === "signup" ? "8자 이상, 대문자·숫자·특수문자 포함" : "••••••••"}
          />
        </Field>
        <button className="btn bg-ink text-white" disabled={busy}>
          {busy === "form" ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>

      <button
        className="mt-3 text-center text-[13px] text-muted underline underline-offset-4"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "이메일로 회원가입" : "이미 계정이 있어요"}
      </button>

      <div className="my-6 flex items-center gap-3 text-[11px] text-muted">
        <span className="h-px flex-1 bg-line" />
        간편 로그인
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-2.5">
        <SocialButton
          icon={<KakaoIcon />}
          className="bg-[#FEE500] text-[#191600]"
          disabled={busy}
          onClick={() => social("kakao")}
        >
          {busy === "kakao" ? "연결 중…" : "카카오로 계속하기"}
        </SocialButton>
        <SocialButton
          icon={<GoogleIcon />}
          className="border border-line bg-white text-[#3C4043]"
          disabled={busy}
          onClick={() => social("google")}
        >
          {busy === "google" ? "연결 중…" : "Google로 계속하기"}
        </SocialButton>
      </div>

      <button className="mt-8 text-center text-[13px] text-muted" onClick={() => nav("/", { replace: true })}>
        게스트로 계속 둘러보기
      </button>
    </div>
  );
}

/** 로고는 왼쪽 고정, 라벨은 버튼 정중앙 — 소셜 로그인 버튼의 일반적인 배치 */
function SocialButton({ icon, className, children, ...props }) {
  return (
    <button type="button" className={`btn relative ${className}`} {...props}>
      <span className="absolute left-5 grid h-[18px] w-[18px] place-items-center">{icon}</span>
      {children}
    </button>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        fill="#191600"
        d="M12 3C6.9 3 3 6.24 3 10.14c0 2.5 1.68 4.7 4.2 5.95-.18.63-.68 2.4-.78 2.78-.12.47.17.46.36.34.15-.1 2.4-1.63 3.38-2.3.6.09 1.21.13 1.84.13 5.1 0 9-3.24 9-7.14S17.1 3 12 3z"
      />
    </svg>
  );
}

/** Google 브랜드 가이드의 4색 G 마크 */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-[18px] w-[18px]" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
