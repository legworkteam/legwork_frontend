import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "@/components";
import { cartCount, useAuth, useData } from "@/store";

/** 로그인 게이트를 통과해 저장/담기가 반영된 직후 화면 (플로우차트 "완료") */
export default function Complete() {
  const nav = useNavigate();
  const cart = useData((s) => s.cart);
  const { pending: current, setPending } = useAuth();
  // 첫 렌더에서 잡아두고 바로 비운다 — 뒤로 돌아와도 다시 뜨지 않게
  const [pending] = useState(current);
  const isCart = pending?.type === "cart";
  useEffect(() => {
    setPending(null);
  }, [setPending]);

  return (
    <Screen right={false}>
      <div className="flex min-h-[calc(100vh-9rem)] flex-col justify-center px-1 text-center">
        <div className="mx-auto mb-7 grid h-20 w-20 place-items-center rounded-full border border-gold text-3xl text-gold">
          ✓
        </div>
        <p className="lbl">COMPLETE</p>
        <h2 className="mt-2 font-serif text-[28px] font-bold">{isCart ? "담았습니다" : "저장되었습니다"}</h2>
        <p className="mb-9 mt-3.5 text-[13px] leading-relaxed text-muted">
          {pending?.name ? (
            <>
              <b className="text-ink">{pending.name}</b>
              <br />
              {isCart ? "장바구니에 담겼습니다." : "코디가 저장한 코디에 반영되었습니다."}
            </>
          ) : (
            <>
              게스트로 보던 코디와 아바타 정보가
              <br />
              계정으로 이관되었습니다.
            </>
          )}
        </p>

        {isCart ? (
          <>
            <button className="btn bg-ink text-white" onClick={() => nav("/cart")}>
              장바구니 ({cartCount(cart)})
            </button>
            <button className="btn mt-2.5 border border-ink bg-white" onClick={() => nav("/saved")}>
              저장한 코디 보기
            </button>
          </>
        ) : (
          <>
            <button className="btn bg-ink text-white" onClick={() => nav("/saved")}>
              저장한 코디 보기
            </button>
            <button className="btn mt-2.5 border border-ink bg-white" onClick={() => nav("/cart")}>
              장바구니 ({cartCount(cart)})
            </button>
          </>
        )}
        <button className="mt-4 text-[13px] text-muted" onClick={() => nav("/mypage")}>
          마이페이지로 이동
        </button>
      </div>
    </Screen>
  );
}
