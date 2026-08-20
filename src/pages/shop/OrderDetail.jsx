import { useNavigate, useParams } from "react-router-dom";
import * as api from "@/api";
import { ErrorState, Loading, Screen, Thumb } from "@/components";
import { fmtDateTime, won } from "@/store";
import { useResource } from "@/hooks";

/** 명세 12. GET /me/orders/{orderId} — 주문 당시 상품/가격 snapshot */
export default function OrderDetail() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const { data: order, error, reload } = useResource(() => api.getOrder(orderId), [orderId]);

  if (error)
    return (
      <Screen title="주문 상세" back="/orders" right={false}>
        <ErrorState error={error} onRetry={reload} />
      </Screen>
    );
  if (!order) return <Screen title="주문 상세" back="/orders" right={false}><Loading /></Screen>;

  const paid = order.paymentStatus === "success";

  return (
    <Screen title="주문 상세" back="/orders" right={false}>
      <div className="py-8 text-center">
        <div
          className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border text-2xl ${
            paid ? "border-gold text-gold" : "border-greige text-greige"
          }`}
        >
          {paid ? "✓" : "!"}
        </div>
        <p className="lbl">{paid ? "PAYMENT COMPLETE" : "PAYMENT " + order.paymentStatus?.toUpperCase()}</p>
        <h2 className="mt-2 font-serif text-[26px] font-bold">{won(order.paidAmount)}</h2>
        <p className="mt-2 text-[12px] text-muted">{fmtDateTime(order.paidAt)} · 모의결제</p>
      </div>

      <p className="lbl mb-2.5">ORDER ITEMS</p>
      {order.items.map((it, i) => (
        <div key={i} className="flex gap-3 border-b border-line py-4">
          <Thumb fileId={it.thumbnailFileId} label={it.productName[0]} className="h-20 w-16 shrink-0 rounded-2xl text-base" />
          <div className="flex-1">
            <b className="block text-[13px] font-semibold">{it.productName}</b>
            <span className="text-[11px] text-muted">{[it.variant?.color, it.variant?.size].filter(Boolean).join(" / ")}</span>
            <span className="mt-1 block text-[11px] text-muted">수량 {it.quantity}</span>
          </div>
          <b className="text-sm">{won(it.unitPrice * it.quantity)}</b>
        </div>
      ))}

      <div className="card mt-6 text-[13px]">
        <div className="mb-2 flex justify-between text-muted">
          <span>주문 상태</span>
          <span className="text-ink">{order.orderStatus}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>결제 상태</span>
          <span className="text-ink">{order.paymentStatus}</span>
        </div>
      </div>

      <button className="btn mt-6 border border-ink bg-white" onClick={() => nav("/care")}>
        구매 제품 사후관리 등록 확인
      </button>
      <button className="btn mt-2.5 bg-ink text-white" onClick={() => nav("/mypage")}>
        마이페이지로
      </button>
    </Screen>
  );
}
