import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, ErrorState, Loading, Screen } from "@/components";
import { fmtDateTime, toast, toastError, useData } from "@/store";

const STATUS = {
  confirmed: ["예약 확정", "bg-gold text-white"],
  cancelled: ["취소됨", "bg-card text-muted"],
  completed: ["수리 완료", "bg-card text-muted"],
};

/** 명세 15. GET /me/repair-reservations · PATCH(취소만 지원) */
export default function Reservations() {
  const nav = useNavigate();
  const { reservations, errors, load, cancelReservation } = useData();

  useEffect(() => {
    load("reservations");
  }, [load]);

  return (
    <Screen title="수리 예약" back="/mypage" right={false}>
      {errors.reservations ? (
        <ErrorState error={errors.reservations} onRetry={() => load("reservations", true)} />
      ) : !reservations ? (
        <Loading />
      ) : reservations.length === 0 ? (
        <Empty
          icon="◷"
          text="예약 내역이 없습니다."
          action={
            <button className="btn border border-ink bg-white" onClick={() => nav("/care")}>
              보유 제품 보기
            </button>
          }
        />
      ) : (
        <div className="mt-3">
          {reservations.map((r) => {
            const [label, cls] = STATUS[r.status] ?? STATUS.confirmed;
            return (
              <div key={r.reservationId} className="card mb-3">
                <div className="flex items-center justify-between">
                  <span className={`pill ${cls}`}>{label}</span>
                  <span className="text-[11px] text-muted">{fmtDateTime(r.slot)}</span>
                </div>
                <b className="mt-3 block text-sm">{r.storeName}</b>
                {r.memo && <p className="mt-1 text-[12px] text-muted">{r.memo}</p>}
                {r.status === "confirmed" && (
                  <button
                    className="mt-4 w-full rounded-full border border-line py-2.5 text-xs text-muted"
                    onClick={async () => {
                      try {
                        await cancelReservation(r.reservationId);
                        toast("예약이 취소되었습니다");
                      } catch (e) {
                        toastError(e);
                      }
                    }}
                  >
                    예약 취소
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Screen>
  );
}
