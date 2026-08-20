import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as api from "@/api";
import { Field, Loading, Screen } from "@/components";
import { toast, toastError, todayKst as today, useData } from "@/store";

/** 명세 15. GET /stores?date= → POST /repair-reservations (슬롯 충돌 시 SLOT_UNAVAILABLE 409) */
export default function RepairReserve() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const diagnosisId = params.get("diagnosisId");
  const load = useData((s) => s.load);

  const [date, setDate] = useState(today());
  const [stores, setStores] = useState(null);
  const [picked, setPicked] = useState(null); // { store, slot }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStores(null);
    setPicked(null);
    api.getStores(date).then((r) => setStores(r.stores)).catch(toastError);
  }, [date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!picked) return toastError({ message: "매장과 시간을 선택해 주세요." });
    setBusy(true);
    const { memo } = Object.fromEntries(new FormData(e.target));
    if (!diagnosisId) return toastError({ message: "AI 진단을 먼저 받아야 예약할 수 있습니다." });
    try {
      await api.createReservation({
        storeId: picked.store.storeId,
        diagnosisId,
        slot: picked.slot,
        note: memo,
      });
      await load("reservations", true);
      toast("수리 예약이 접수되었습니다");
      nav("/repair-reservations", { replace: true });
    } catch (e) {
      toastError(e); // SLOT_UNAVAILABLE(409) → 다른 슬롯 선택 유도
      api.getStores(date).then((r) => setStores(r.stores));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="수리 예약" back={true} right={false}>
      <form onSubmit={submit} className="mt-4">
        {!diagnosisId && (
          <p className="mb-4 rounded-2xl bg-card p-3.5 text-[12px] leading-relaxed text-muted">
            수리 예약에는 AI 진단 결과가 필요합니다. 보유 제품에서 진단을 먼저 받아 주세요.
          </p>
        )}

        <Field label="방문 날짜">
          <input type="date" value={date} min={today()} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <p className="lbl mb-2.5 mt-6">매장 · 시간</p>
        {!stores ? (
          <Loading label="예약 가능 시간을 확인하는 중…" />
        ) : (
          stores.map((s) => (
            <div key={s.storeId} className="card mb-3">
              <b className="text-sm">{s.name}</b>
              <p className="mt-0.5 text-[11px] text-muted">{s.address}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.availableSlots.length === 0 && <span className="text-[12px] text-muted">예약 가능한 시간이 없습니다.</span>}
                {s.availableSlots.map((slot) => {
                  const on = picked?.slot === slot && picked.store.storeId === s.storeId;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPicked({ store: s, slot })}
                      className={`rounded-full border px-3.5 py-2 text-xs ${
                        on ? "border-ink bg-ink text-white" : "border-line bg-white"
                      }`}
                    >
                      {slot.slice(11, 16)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <div className="mt-6">
          <Field label="요청 사항 (선택)">
            <textarea name="memo" placeholder="예) 지퍼 상태도 함께 확인 부탁드립니다." />
          </Field>
        </div>

        <button className="btn bg-ink text-white disabled:opacity-40" disabled={busy || !picked}>
          {busy ? "예약 중…" : "예약하기"}
        </button>
      </form>
    </Screen>
  );
}
