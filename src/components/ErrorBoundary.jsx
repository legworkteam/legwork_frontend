import { Component } from "react";

/** 렌더 중 예외가 나도 빈 화면 대신 복구 UI 를 보여준다 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[MCM] render error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col items-center justify-center bg-bg px-8 text-center">
        <p className="lbl">SOMETHING WENT WRONG</p>
        <h2 className="mt-2 font-serif text-[22px] font-bold">화면을 표시하지 못했습니다</h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          잠시 후 다시 시도해 주세요. 문제가 계속되면 팀에 알려주세요.
        </p>
        <button
          className="btn mt-8 max-w-[240px] bg-ink text-white"
          onClick={() => {
            this.setState({ error: null });
            location.href = "/";
          }}
        >
          처음으로 돌아가기
        </button>
        {import.meta.env.DEV && (
          <pre className="mt-6 max-w-full overflow-x-auto rounded-2xl bg-card p-3 text-left text-[10px] text-muted">
            {String(this.state.error?.stack ?? this.state.error)}
          </pre>
        )}
      </div>
    );
  }
}
