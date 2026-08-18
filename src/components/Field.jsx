/** 폼 라벨 + 입력 한 쌍. input/select/textarea 스타일은 index.css 의 @layer base 가 담당 */
export default function Field({ label, children }) {
  return (
    <label className="mb-4 block">
      <span className="lbl mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
