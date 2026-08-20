import { useNavigate, useParams } from "react-router-dom";
import * as api from "@/api";
import { ErrorState, Loading, Screen } from "@/components";
import { fmtDateTime } from "@/store";
import { useResource } from "@/hooks";

/** severity 범위는 명세에 없음 → 1~3 가정 (백엔드 확인 필요) */

/** 명세 14. GET /diagnoses/{diagnosisId} + /care-guide */
export default function DiagnosisResult() {
  const { diagnosisId } = useParams();
  const nav = useNavigate();
  const { data: d, error, reload } = useResource(() => api.getDiagnosis(diagnosisId), [diagnosisId]);
  const { data: guide } = useResource(
    () => api.getDiagnosisCareGuide(diagnosisId).catch(() => null),
    [diagnosisId]
  );

  if (error)
    return (
      <Screen title="진단 결과" back={true} right={false}>
        <ErrorState error={error} onRetry={reload} />
      </Screen>
    );
  if (!d) return <Screen title="진단 결과" back={true} right={false}><Loading /></Screen>;

  return (
    <Screen title="진단 결과" back={`/care/${d.registrationId}`} right={false}>
      <div className="py-8 text-center">
        <div
          className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full border text-2xl ${
            d.repairNeeded ? "border-gold text-gold" : "border-greige text-greige"
          }`}
        >
          {d.repairNeeded ? "!" : "✓"}
        </div>
        <p className="lbl">AI DIAGNOSIS</p>
        <h2 className="mt-2 font-serif text-[22px] font-bold">
          {d.repairNeeded ? "수리를 권장합니다" : "상태가 양호합니다"}
        </h2>
        <p className="mx-auto mt-3 max-w-[300px] text-[13px] leading-relaxed text-muted">{d.summary}</p>
        <p className="mt-2 text-[11px] text-muted">{fmtDateTime(d.createdAt)}</p>
      </div>

      <section>
        <p className="lbl mb-2.5">DETECTED · {d.damages.length}</p>
        {d.damages.map((dm, i) => (
          <div key={i} className="card mb-3">
            <div className="flex items-center justify-between">
              <b className="text-sm">{api.DAMAGE_LABEL[dm.damageType] ?? dm.damageType}</b>
              <span className="pill bg-card text-[10px] font-medium text-muted">
                {api.SEVERITY_LABEL[dm.severity] ?? dm.severity}
              </span>
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-muted">
              <span>{dm.location ? `위치 · ${dm.location}` : "위치 정보 없음"}</span>
              <span>신뢰도 {Math.round((dm.confidence ?? 0) * 100)}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card">
              <i className="block h-full bg-gold" style={{ width: `${(dm.confidence ?? 0) * 100}%` }} />
            </div>
          </div>
        ))}
      </section>

      {guide && (
        <section className="mt-8">
          <p className="lbl mb-2.5">홈케어 가이드</p>
          <div className="card">
            <p className="text-[13px] leading-relaxed">{guide.summary}</p>
            <ol className="mt-3 space-y-2 text-[13px] text-muted">
              {guide.steps.map((s, i) => (
                <li key={s} className="flex gap-2">
                  <span className="text-gold">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <button
        className="btn mt-8 bg-ink text-white"
        onClick={() => nav(`/repair-reservations/new?diagnosisId=${d.diagnosisId}&registrationId=${d.registrationId}`)}
      >
        수리 예약하기
      </button>
      <button className="btn mt-2.5 border border-ink bg-white" onClick={() => nav(`/care/${d.registrationId}`)}>
        제품 상세로
      </button>
    </Screen>
  );
}
