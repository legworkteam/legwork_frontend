/** 표시용 포맷 헬퍼. 명세 1.1 — 금액 KRW, 시간 KST(ISO 8601 +09:00) */

export const won = (n) => (n ?? 0).toLocaleString("ko-KR") + "원";

/** "2026-08-13T23:30:00+09:00" → "2026.08.13" */
export const fmtDate = (iso) => (iso ? iso.slice(0, 10).replaceAll("-", ".") : "");

/** "2026-08-13T23:30:00+09:00" → "2026.08.13 23:30" */
export const fmtDateTime = (iso) => (iso ? `${fmtDate(iso)} ${iso.slice(11, 16)}` : "");

/** date input 기본값도 KST 기준으로 (브라우저 로캘과 무관하게) */
export const todayKst = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
