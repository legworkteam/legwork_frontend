import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "@/api";
import { Field, Screen } from "@/components";
import { toast, toastError, todayKst, useData } from "@/store";

/**
 * 명세 13. POST /me/products — 기존 보유 제품을 시리얼로 등록 (source=manual).
 * 구매 제품은 결제 시 서버가 자동 등록하므로 이 화면은 시리얼 등록 전용.
 * 시리얼 포맷은 데이터 확보 후 확정 → 지금은 형식 검증 없이 서버 판정(SERIAL_NOT_FOUND / ALREADY_REGISTERED)에 맡긴다.
 */
export default function RegisterProduct() {
  const nav = useNavigate();
  const load = useData((s) => s.load);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const body = Object.fromEntries(new FormData(e.target));
    try {
      await api.registerProduct(body);
      await load("products", true);
      toast("제품이 등록되었습니다");
      nav("/care", { replace: true });
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title="제품 등록" back="/care" right={false}>
      <div className="mt-5 rounded-card bg-card p-[18px] text-center">
        <div className="text-3xl">▣</div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          제품 내부 택의 시리얼 번호를 입력하시면
          <br />
          보유 제품으로 등록됩니다.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6">
        <Field label="시리얼 번호">
          <input name="serialNumber" required placeholder="MCM-2024-XXXX" autoComplete="off" />
        </Field>
        <Field label="구매일">
          <input name="purchaseDate" type="date" required max={todayKst()} />
        </Field>
        <Field label="애칭 (선택)">
          <input name="nickname" placeholder="예) 출근용 백팩" />
        </Field>
        <button className="btn bg-ink text-white" disabled={busy}>
          {busy ? "등록 중…" : "등록 완료"}
        </button>
        <p className="mt-3.5 text-center text-[11px] leading-relaxed text-muted">
          등록되지 않은 시리얼이거나 이미 등록된 제품이면 안내 메시지가 표시됩니다.
        </p>
      </form>
    </Screen>
  );
}
