import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, ErrorState, Loading, Screen, Thumb } from "@/components";
import * as api from "@/api";
import { toast, toastError, useData, won } from "@/store";

/**
 * 명세 11 + 12. 주문은 선택한 cartItemIds 만 결제하므로 항목 선택이 필요하다.
 * 금액은 서버가 DB 현재가로 재계산 → 화면 합계는 어디까지나 예상 금액.
 */
export default function Cart() {
  const nav = useNavigate();
  const { cart, errors, load, setQuantity, removeCartItem } = useData();
  const [picked, setPicked] = useState(null); // null = 아직 초기화 전
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load("cart");
  }, [load]);

  useEffect(() => {
    if (cart && picked === null) setPicked(cart.items.map((i) => i.cartItemId));
  }, [cart, picked]);

  if (errors.cart)
    return (
      <Screen title="장바구니" back="/mypage" right={false}>
        <ErrorState error={errors.cart} onRetry={() => load("cart", true)} />
      </Screen>
    );
  if (!cart) return <Screen title="장바구니" back="/mypage" right={false}><Loading /></Screen>;

  const selected = cart.items.filter((i) => picked?.includes(i.cartItemId));
  const expected = selected.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const order = async () => {
    setBusy(true);
    try {
      const res = await api.createOrder(selected.map((i) => i.cartItemId));
      load("cart", true);
      load("orders", true);
      load("products", true); // 구매 제품이 사후관리에 자동 등록됨 (명세 12-8)
      nav(`/orders/${res.orderId}`, { replace: true });
    } catch (e) {
      toastError(e); // 재고/가격 변동은 CONFLICT(409)
      load("cart", true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="장바구니" back="/mypage" right={false}>
      {cart.items.length === 0 ? (
        <Empty
          icon="🛍"
          text="장바구니가 비어 있습니다."
          action={
            <button className="btn border border-ink bg-white" onClick={() => nav("/saved")}>
              저장한 코디 보기
            </button>
          }
        />
      ) : (
        <>
          {cart.items.map((p) => (
            <div key={p.cartItemId} className="flex gap-3 border-b border-line py-4">
              <input
                type="checkbox"
                aria-label={`${p.productName} 선택`}
                className="mt-1 h-4 w-4 shrink-0 accent-ink"
                checked={picked?.includes(p.cartItemId) ?? false}
                onChange={() => toggle(p.cartItemId)}
              />
              <Thumb
                fileId={p.thumbnailFileId}
                label={p.productName[0]}
                className="h-24 w-[72px] shrink-0 rounded-2xl text-base"
              />
              <div className="min-w-0 flex-1">
                <b className="block text-[13px] font-semibold">{p.productName}</b>
                <span className="text-[11px] text-muted">{p.optionName}</span>
                {p.inStock === false && (
                  <span className="pill mt-1 block w-fit bg-card text-[10px] text-muted">품절</span>
                )}
                <b className="mt-1.5 block text-sm font-bold">{won(p.unitPrice * p.quantity)}</b>
                <div className="mt-2 inline-flex items-center rounded-full border border-line">
                  <button className="h-7 w-[30px] text-sm" onClick={() => setQuantity(p.cartItemId, p.quantity - 1)}>
                    −
                  </button>
                  <span className="min-w-5 text-center text-xs">{p.quantity}</span>
                  <button className="h-7 w-[30px] text-sm" onClick={() => setQuantity(p.cartItemId, p.quantity + 1)}>
                    +
                  </button>
                </div>
              </div>
              <button
                aria-label="삭제"
                className="self-start text-greige"
                onClick={async () => {
                  await removeCartItem(p.cartItemId);
                  setPicked((s) => s.filter((x) => x !== p.cartItemId));
                  toast("장바구니에서 삭제했습니다");
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <div className="card mt-6">
            <div className="mb-2 flex justify-between text-[13px] text-muted">
              <span>선택 {selected.length}건</span>
              <span>{won(expected)}</span>
            </div>
            <div className="mb-2 flex justify-between text-[13px] text-muted">
              <span>장바구니 전체</span>
              <span>{won(cart.totalAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
              <span>결제 예정</span>
              <span>{won(expected)}</span>
            </div>
            <p className="mt-2 text-[11px] text-muted">최종 금액은 결제 시 서버가 현재가로 재계산합니다.</p>
          </div>

          <button
            className="btn mt-4 bg-ink text-white disabled:opacity-40"
            disabled={busy || selected.length === 0}
            onClick={order}
          >
            {busy ? "결제 중…" : `${selected.length}건 결제하기`}
          </button>
        </>
      )}
    </Screen>
  );
}
