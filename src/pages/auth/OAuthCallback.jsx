import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as api from "@/api";
import { Emblem } from "@/components";
import { useAuth } from "@/store";

/**
 * 카카오/구글 인가 페이지에서 되돌아오는 지점 (redirect_uri = /oauth/callback).
 * code 를 백엔드(POST /auth/social)로 넘겨 서비스 JWT 로 교환한다.
 */
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const signIn = useAuth((s) => s.signIn);
  const [error, setError] = useState(null);
  const once = useRef(false); // code 는 1회용 — StrictMode 중복 실행 방지

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    const code = params.get("code");
    const saved = api.consumeOAuthState(params.get("state"));

    // 카카오/구글이 거절·취소 시 error, error_description 을 붙여 돌려보낸다
    if (params.get("error")) {
      return setError(params.get("error_description") ?? "로그인이 취소되었습니다.");
    }
    if (!code || !saved) return setError("로그인 요청이 유효하지 않습니다. 다시 시도해 주세요.");

    signIn(() => api.socialLogin(saved.provider, code))
      .then(() => nav(saved.from ?? "/mypage", { replace: true }))
      .catch((e) => setError(e.message));
  }, [params, signIn, nav]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col items-center justify-center bg-bg px-8 text-center">
      <Emblem className="h-14 w-14 text-gold" />
      {error ? (
        <>
          <p className="mt-6 text-[13px] leading-relaxed text-muted">{error}</p>
          <button
            className="btn mt-8 max-w-[240px] bg-ink text-white"
            onClick={() => nav("/login", { replace: true })}
          >
            로그인으로 돌아가기
          </button>
        </>
      ) : (
        <p className="mt-6 text-[13px] text-muted">로그인 중입니다…</p>
      )}
    </div>
  );
}
