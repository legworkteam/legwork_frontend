/**
 * 브랜드 엠블럼 (원형 테두리 + 다이아 + M).
 * ⚠️ 플레이스홀더입니다. MCM 공식 로고 SVG 를 받으면 이 파일 내용만 교체하세요.
 */
export default function Emblem({ className = "h-12 w-12" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="0.9" opacity="0.4" />
      <path d="M24 7.5 40.5 24 24 40.5 7.5 24z" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
      <path
        d="M16.5 30V18.5l7.5 7.5 7.5-7.5V30"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
