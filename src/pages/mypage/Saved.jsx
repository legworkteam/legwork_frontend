import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Empty, ErrorState, Loading, Screen, Thumb } from "@/components";
import { fmtDate, toast, toastError, useData } from "@/store";

/** 명세 10. GET /me/coordis · DELETE /me/coordis/{savedCoordiId} (soft delete) */
export default function Saved() {
  const nav = useNavigate();
  const { coordis, errors, load, removeCoordi } = useData();

  useEffect(() => {
    load("coordis");
  }, [load]);

  return (
    <Screen title="저장한 코디" back="/mypage">
      {errors.coordis ? (
        <ErrorState error={errors.coordis} onRetry={() => load("coordis", true)} />
      ) : !coordis ? (
        <Loading />
      ) : coordis.length === 0 ? (
        <Empty
          icon="♡"
          text={"저장한 코디가 없습니다.\n품번을 찍어 아바타 코디를 만들어보세요."}
          action={
            <button className="btn border border-ink bg-white" onClick={() => nav("/")}>
              품번 찍으러 가기
            </button>
          }
        />
      ) : (
        <>
          <div className="my-4 flex items-center justify-between">
            <span className="text-[13px] text-muted">총 {coordis.length}개</span>
            <span className="pill border border-greige font-normal text-muted">최신순</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {coordis.map((c) => (
              <Link key={c.savedCoordiId} to={`/saved/${c.savedCoordiId}`}>
                <Thumb
                  fileId={c.thumbnailFileId}
                  label={c.name.split(" ")[0]}
                  tone={c.tone}
                  className="mb-2 aspect-3/4 rounded-2xl text-[22px]"
                >
                  <button
                    aria-label="삭제"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/85 text-[13px] text-ink"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        await removeCoordi(c.savedCoordiId);
                        toast("저장한 코디에서 삭제했습니다");
                      } catch (e2) {
                        toastError(e2);
                      }
                    }}
                  >
                    ✕
                  </button>
                </Thumb>
                <b className="block text-[13px] font-semibold">{c.name}</b>
                <span className="text-[11px] text-muted">
                  {c.itemCount}개 아이템 · {fmtDate(c.createdAt)}
                </span>
              </Link>
            ))}
          </div>

          <button className="btn mt-7 border border-ink bg-white" onClick={() => nav("/")}>
            다른 제품 이어보기
          </button>
        </>
      )}
    </Screen>
  );
}
