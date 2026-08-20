import { useNavigate, useParams } from "react-router-dom";
import * as api from "@/api";
import { ErrorState, Loading, Screen, Thumb } from "@/components";
import { fmtDate, fmtDateTime } from "@/store";
import { useResource } from "@/hooks";

/** 명세 13. GET /me/products/{registrationId} + /care-guide */
export default function CareDetail() {
  const { registrationId } = useParams();
  const nav = useNavigate();
  const { data: product, error, reload } = useResource(
    () => api.getMyProduct(registrationId),
    [registrationId]
  );
  // 케어가이드는 없어도 화면이 성립하므로 실패를 무시한다
  const { data: guide } = useResource(
    () => api.getCareGuide(registrationId).catch(() => null),
    [registrationId]
  );

  if (error)
    return (
      <Screen title="제품 상세" back="/care" right={false}>
        <ErrorState error={error} onRetry={reload} />
      </Screen>
    );
  if (!product) return <Screen title="제품 상세" back="/care" right={false}><Loading /></Screen>;

  return (
    <Screen title="제품 상세" back="/care" right={false}>
      <div className="mt-4 flex items-center gap-3.5 rounded-card bg-card p-[18px]">
        <Thumb fileId={product.thumbnailFileId} label={product.name[0]} className="h-20 w-20 rounded-2xl text-xl" />
        <div className="min-w-0">
          <b className="block text-sm font-semibold">{product.nickname || product.name}</b>
          <p className="text-[11px] text-muted">{product.name}</p>
          <p className="mt-1 text-[11px] text-muted">{product.serialNumber}</p>
          <div className="mt-2 flex gap-1.5">
            <span className="pill bg-white text-[10px] font-medium text-muted">
              {product.source === "purchase" ? "구매 등록" : "직접 등록"}
            </span>
            <span className="pill bg-white text-[10px] font-medium text-muted">
              구매 {fmtDate(product.purchaseDate)}
            </span>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <p className="lbl mb-2.5">최근 진단</p>
        {product.lastDiagnosis ? (
          <button
            className="card flex w-full items-center gap-3 text-left"
            onClick={() => nav(`/diagnoses/${product.lastDiagnosis.diagnosisId}`)}
          >
            <span
              className={`pill ${product.lastDiagnosis.repairNeeded ? "bg-gold text-white" : "bg-card text-muted"}`}
            >
              {product.lastDiagnosis.repairNeeded ? "수리 권장" : "양호"}
            </span>
            <span className="flex-1 text-[12px] text-muted">
              {fmtDateTime(product.lastDiagnosis.createdAt)}
            </span>
            <span className="text-greige">›</span>
          </button>
        ) : (
          <div className="card text-[13px] text-muted">아직 진단 이력이 없습니다.</div>
        )}
      </section>

      {guide && (
        <section className="mt-8">
          <p className="lbl mb-2.5">CARE GUIDE</p>
          <div className="card">
            <p className="text-[12px] text-muted">{guide.material}</p>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed">
              {guide.basics.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-gold">·</span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-3">
              <p className="lbl mb-1.5">주의</p>
              <ul className="space-y-1 text-[12px] text-muted">
                {guide.cautions.map((c) => (
                  <li key={c}>· {c}</li>
                ))}
              </ul>
            </div>
            <p className="mt-4 text-[12px] text-muted">{guide.asInfo}</p>
          </div>
        </section>
      )}

      <button
        className="btn mt-8 bg-ink text-white"
        onClick={() => nav(`/care/${registrationId}/diagnose`)}
      >
        AI 손상 진단 받기
      </button>
      <button
        className="btn mt-2.5 border border-ink bg-white"
        onClick={() => nav(`/repair-reservations/new?registrationId=${registrationId}`)}
      >
        수리 예약하기
      </button>
    </Screen>
  );
}
