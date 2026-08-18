import { useEffect, useRef, useState } from "react";
import * as api from "@/api";

/**
 * 명세 16: 개인 파일은 GET /files/{fileId} 에 토큰이 필요해서 <img src> 로 직접 못 건다.
 * blob 으로 받아 objectURL 로 바꿔 쓴다. fileId 가 없으면 null (자리표시자 노출).
 */
export function useFileUrl(fileId) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!fileId || api.USE_MOCK) return;
    let objectUrl;
    api
      .getFileBlob(fileId)
      .then((blob) => setUrl((objectUrl = URL.createObjectURL(blob))))
      .catch(() => setUrl(null));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [fileId]);
  return url;
}

/**
 * 명세 7: Background Job 폴링. 202 로 받은 jobId 를 넘기면
 * { status, progress, result, error } 를 갱신한다.
 * 명세상 AI 처리 상한이 60초라 90초까지 기다린 뒤 실패로 끊는다.
 */
export function useJob(jobId, { interval = 1500, timeout = 90000 } = {}) {
  const [job, setJob] = useState(null);
  const timer = useRef();

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    const startedAt = Date.now();

    const tick = async () => {
      try {
        const next = await api.getJob(jobId);
        if (!alive) return;
        setJob(next);
        if (next.status !== "pending" && next.status !== "processing") return;
        if (Date.now() - startedAt > timeout) {
          return setJob({
            ...next,
            status: "failed",
            error: { message: "진단이 지연되고 있습니다. 잠시 후 다시 시도해 주세요." },
          });
        }
        timer.current = setTimeout(tick, interval);
      } catch (e) {
        if (alive) setJob({ status: "failed", error: { message: e.message } });
      }
    };
    tick();

    return () => {
      alive = false;
      clearTimeout(timer.current);
    };
  }, [jobId, interval, timeout]);

  return job;
}

/** 단건 조회용 — 실패하면 error 를 돌려주고 reload() 로 재시도 */
export function useResource(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ data: null, error: null });
    fetcher().then(
      (data) => alive && setState({ data, error: null }),
      (error) => alive && setState({ data: null, error })
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, reload: () => setNonce((n) => n + 1) };
}
