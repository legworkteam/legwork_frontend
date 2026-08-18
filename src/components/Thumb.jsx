import { useFileUrl } from "@/hooks";

/**
 * 제품/코디 이미지.
 * 명세 16 — 개인 파일은 GET /files/{fileId} 에 토큰이 필요해 <img src> 직결이 안 되므로
 * useFileUrl 이 blob 으로 받아 objectURL 을 만든다. fileId 가 없으면 이니셜 자리표시자.
 */
export default function Thumb({ fileId, label, tone = "#D8D3CC", className = "", children }) {
  const url = useFileUrl(fileId);
  return (
    <div
      className={`relative grid place-items-center overflow-hidden font-serif text-white [text-shadow:0_1px_6px_rgba(0,0,0,.25)] ${className}`}
      style={{ background: `linear-gradient(140deg, ${tone}, #8E8579)` }}
    >
      {url ? <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" /> : label}
      {children}
    </div>
  );
}
