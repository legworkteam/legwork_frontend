import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, ErrorState, Loading, Screen, Thumb } from "@/components";
import { fmtDate, useData } from "@/store";

/** 명세 13. GET /me/products — 구매(purchase) + 직접 등록(manual) 통합 */
export default function Care() {
  const nav = useNavigate();
  const { products, errors, load } = useData();

  useEffect(() => {
    load("products");
  }, [load]);

  return (
    <Screen title="제품 사후관리">
      <p className="lbl mt-3">SMART CARE</p>
      <h2 className="font-serif text-[28px] font-bold leading-tight">보유 제품 관리</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        구매하신 제품과 직접 등록한 제품을 함께 관리합니다. 사진·영상으로 손상을 진단하고 수리를
        예약할 수 있습니다.
      </p>

      {errors.products ? (
        <ErrorState error={errors.products} onRetry={() => load("products", true)} />
      ) : !products ? (
        <Loading />
      ) : products.length === 0 ? (
        <Empty
          icon="✧"
          text={"등록된 제품이 없습니다.\n시리얼 번호로 보유 제품을 등록해보세요."}
          action={
            <button className="btn border border-ink bg-white" onClick={() => nav("/care/register")}>
              ＋ 제품 등록하기
            </button>
          }
        />
      ) : (
        <section className="mt-8">
          <p className="lbl mb-2.5">MY PRODUCTS · {products.length}</p>
          {products.map((p) => (
            <button
              key={p.registrationId}
              onClick={() => nav(`/care/${p.registrationId}`)}
              className="card mb-3 flex w-full items-center gap-3 text-left"
            >
              <Thumb fileId={p.thumbnailFileId} label={p.name[0]} className="h-16 w-16 rounded-2xl text-lg" />
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm font-semibold">{p.nickname || p.name}</b>
                <div className="text-[11px] text-muted">{p.serialNumber}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="pill bg-card text-[10px] font-medium text-muted">
                    {p.source === "purchase" ? "구매 등록" : "직접 등록"}
                  </span>
                  {p.lastDiagnosis ? (
                    <span
                      className={`pill text-[10px] ${
                        p.lastDiagnosis.repairNeeded ? "bg-gold text-white" : "bg-card text-muted"
                      }`}
                    >
                      {p.lastDiagnosis.repairNeeded ? "수리 권장" : "진단 양호"} ·{" "}
                      {fmtDate(p.lastDiagnosis.createdAt)}
                    </span>
                  ) : (
                    <span className="pill border border-greige text-[10px] font-medium text-muted">
                      진단 이력 없음
                    </span>
                  )}
                </div>
              </div>
              <span className="text-greige">›</span>
            </button>
          ))}
          <button className="btn mt-2 border border-ink bg-white" onClick={() => nav("/care/register")}>
            ＋ 제품 등록하기
          </button>
        </section>
      )}
    </Screen>
  );
}
