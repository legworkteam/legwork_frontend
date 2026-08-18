import { useNavigate, useParams } from "react-router-dom";
import * as api from "@/api";
import { Empty, ErrorState, Loading, Screen } from "@/components";
import { fmtDate, toast, toastError, useData } from "@/store";
import { useResource } from "@/hooks";

/** 명세 10. GET /me/coordis/{savedCoordiId} */
export default function SavedDetail() {
  const { savedCoordiId } = useParams();
  const nav = useNavigate();
  const { removeCoordi } = useData();
  const { data: coordi, error, reload } = useResource(() => api.getCoordi(savedCoordiId), [savedCoordiId]);

  if (error)
    return (
      <Screen title="저장한 코디" back="/saved">
        <ErrorState error={error} onRetry={reload} />
      </Screen>
    );
  if (!coordi) return <Screen title="저장한 코디" back="/saved"><Loading /></Screen>;

  const remove = async () => {
    try {
      await removeCoordi(coordi.savedCoordiId);
      toast("저장한 코디에서 삭제했습니다");
      nav("/saved", { replace: true });
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <Screen title={coordi.name} back="/saved">
      <p className="mb-4 text-[12px] text-muted">
        {coordi.itemCount}개 아이템 · {fmtDate(coordi.createdAt)}
      </p>

      {!coordi.items?.length ? (
        <Empty icon="◈" text={"이 코디에 담긴 아이템 정보가 없습니다."} />
      ) : (
        <div className="flex flex-col gap-3">
          {coordi.items.map((item, i) => (
            <div key={item.productId ?? i} className="flex items-center gap-3 rounded-2xl bg-card p-3">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-xl bg-greige/40" />
              )}
              <div className="flex-1">
                <b className="block text-[13px] font-semibold">{item.name ?? "상품"}</b>
                {item.price != null && <span className="text-[12px] text-muted">{item.price.toLocaleString("ko-KR")}원</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn mt-7 border border-ink bg-white" onClick={() => nav("/")}>
        다른 제품 이어보기
      </button>
      <button className="btn mt-2.5 text-[13px] text-muted" onClick={remove}>
        이 코디 삭제
      </button>
    </Screen>
  );
}
