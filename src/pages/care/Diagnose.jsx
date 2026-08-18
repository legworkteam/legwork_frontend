import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as api from "@/api";
import { Screen } from "@/components";
import { toastError } from "@/store";
import { useJob } from "@/hooks";

const MAX_FILES = 5;

/**
 * 명세 14. POST /diagnoses (multipart, 최대 5개) → 202 jobId → GET /jobs/{jobId} 폴링 → 결과 화면.
 * 사진 20MB(JPEG/PNG/WEBP), 영상 100MB(MP4/MOV).
 */
export default function Diagnose() {
  const { registrationId } = useParams();
  const nav = useNavigate();
  const [files, setFiles] = useState([]);
  const [jobId, setJobId] = useState(null);
  const job = useJob(jobId);

  useEffect(() => {
    if (job?.status === "succeeded" && job.result?.diagnosisId) {
      nav(`/diagnoses/${job.result.diagnosisId}`, { replace: true });
    }
  }, [job, nav]);

  const pick = (e) => {
    const chosen = [...e.target.files];
    const errors = chosen.map(api.validateUpload).filter(Boolean);
    if (errors.length) return toastError({ message: errors[0] });
    if (chosen.length > MAX_FILES) return toastError({ message: `최대 ${MAX_FILES}개까지 첨부할 수 있습니다.` });
    setFiles(chosen);
  };

  const submit = async () => {
    try {
      const { jobId } = await api.createDiagnosis(registrationId, files);
      setJobId(jobId);
    } catch (e) {
      toastError(e);
    }
  };

  if (jobId) {
    const failed = job?.status === "failed";
    return (
      <Screen title="AI 손상 진단" back={`/care/${registrationId}`} right={false}>
        <div className="py-20 text-center">
          <div
            className="mx-auto grid h-[132px] w-[132px] place-items-center rounded-full"
            style={{
              background: `conic-gradient(var(--color-gold) ${job?.progress ?? 0}%, var(--color-card) 0)`,
            }}
          >
            <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-bg">
              <b className="font-serif text-[26px]">{job?.progress ?? 0}%</b>
            </div>
          </div>
          <p className="mt-7 text-[13px] text-muted">
            {failed
              ? (job.error?.message ?? "진단에 실패했습니다.")
              : "손상 부위를 분석하고 있습니다.\n최대 1분 정도 걸릴 수 있습니다."}
          </p>
          {failed && (
            <button className="btn mt-6 border border-ink bg-white" onClick={() => setJobId(null)}>
              다시 시도
            </button>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="AI 손상 진단" back={`/care/${registrationId}`} right={false}>
      <p className="lbl mt-4">STEP 1</p>
      <h2 className="font-serif text-[22px] font-bold">손상 부위를 촬영해 주세요</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        밝은 곳에서 손상 부위가 잘 보이도록 최대 {MAX_FILES}개까지 첨부해 주세요. 사진 20MB,
        영상 100MB까지 가능합니다.
      </p>

      <label className="mt-6 block cursor-pointer rounded-card bg-card p-8 text-center">
        <div className="text-3xl">＋</div>
        <p className="mt-2 text-[13px] text-muted">사진 · 영상 선택</p>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          className="hidden"
          onChange={pick}
        />
      </label>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-2 rounded-2xl bg-white p-3 text-[12px]">
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-muted">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
            </li>
          ))}
        </ul>
      )}

      <button
        className="btn mt-8 bg-ink text-white disabled:opacity-40"
        disabled={files.length === 0}
        onClick={submit}
      >
        진단 요청하기
      </button>
    </Screen>
  );
}
