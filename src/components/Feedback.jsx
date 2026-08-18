import { useToast } from "@/store";

/** 로딩 자리표시자 */
export function Loading({ label = "불러오는 중…" }) {
  return <p className="py-24 text-center text-[13px] text-muted">{label}</p>;
}

/** 데이터가 0건일 때 */
export function Empty({ icon, text, action }) {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl opacity-35">{icon}</div>
      <p className="my-4 whitespace-pre-line text-[13px] leading-relaxed text-muted">{text}</p>
      {action}
    </div>
  );
}

/** 로드 실패 — 서버 message 를 그대로 보여주고 재시도만 제공 (명세 1.4) */
export function ErrorState({ error, onRetry }) {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl opacity-35">!</div>
      <p className="my-4 text-[13px] leading-relaxed text-muted">
        {error?.message ?? "불러오지 못했습니다."}
      </p>
      <button className="btn mx-auto max-w-[200px] border border-ink bg-white" onClick={onRetry}>
        다시 시도
      </button>
    </div>
  );
}

/** 앱에 한 번만 마운트. 호출은 store 의 toast() */
export function Toast() {
  const msg = useToast((s) => s.msg);
  return (
    <div
      className={`fixed bottom-24 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full bg-ink px-4 py-3 text-center text-xs text-white transition ${
        msg ? "opacity-100" : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      {msg}
    </div>
  );
}
