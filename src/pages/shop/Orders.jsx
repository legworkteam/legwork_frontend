import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, ErrorState, Loading, Screen } from "@/components";
import { fmtDateTime, useData, won } from "@/store";

const ORDER_STATUS = {
  pending: ["결제 대기", "bg-card text-muted"],
  paid: ["결제 완료", "bg-gold text-white"],
  failed: ["결제 실패", "bg-card text-muted"],
  cancelled: ["주문 취소", "bg-card text-muted"],
};

/** 명세 12. GET /me/orders */
export default function Orders() {
  const nav = useNavigate();
  const { orders, errors, load } = useData();

  useEffect(() => {
    load("orders");
  }, [load]);

  return (
    <Screen title="결제 내역" back="/mypage" right={false}>
      {errors.orders ? (
        <ErrorState error={errors.orders} onRetry={() => load("orders", true)} />
      ) : !orders ? (
        <Loading />
      ) : orders.length === 0 ? (
        <Empty icon="▤" text="결제 내역이 없습니다." />
      ) : (
        <div className="mt-3">
          {orders.map((o) => {
            const [label, cls] = ORDER_STATUS[o.orderStatus] ?? ORDER_STATUS.pending;
            return (
              <button
                key={o.orderId}
                onClick={() => nav(`/orders/${o.orderId}`)}
                className="card mb-3 w-full text-left"
              >
                <div className="flex items-center justify-between">
                  <span className={`pill ${cls}`}>{label}</span>
                  <span className="text-[11px] text-muted">{fmtDateTime(o.paidAt)}</span>
                </div>
                <p className="mt-3 text-sm font-semibold">
                  {o.items[0]?.productName}
                  {o.items.length > 1 && ` 외 ${o.items.length - 1}건`}
                </p>
                <b className="mt-1 block text-base">{won(o.paidAmount)}</b>
              </button>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
