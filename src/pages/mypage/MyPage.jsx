import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Screen, Thumb } from "@/components";
import { cartCount, fmtDate, useAuth, useData } from "@/store";

export default function MyPage() {
  const nav = useNavigate();
  const { user, avatar, signOut } = useAuth();
  const { coordis, cart, products, load } = useData();

  useEffect(() => {
    load("coordis");
    load("products");
  }, [load]);

  const menu = [
    ["bookmark", "저장한 코디", `찜한 스타일 ${coordis?.length ?? 0}개`, "/saved"],
    ["bag", "장바구니", `담은 상품 ${cartCount(cart)}개`, "/cart"],
    ["receipt", "결제 내역", "주문·결제 확인", "/orders"],
    ["care", "제품 사후관리", `보유 제품 ${products?.length ?? 0}개 · 진단 · 수리`, "/care"],
    ["clock", "수리 예약", "예약 확인 · 취소", "/repair-reservations"],
  ];

  return (
    <Screen>
      <p className="lbl mb-2.5">MY PAGE</p>

      <section className="rounded-card bg-card p-6">
        <div className="flex items-center gap-3">
          <Thumb label={user?.name?.[0] ?? "M"} className="h-[60px] w-[60px] rounded-full text-xl" />
          <div className="flex-1">
            <div className="font-serif text-lg font-bold">{user?.name ?? "—"}</div>
            <p className="mt-0.5 text-[11px] text-muted">{user?.email}</p>
          </div>
          <span className="pill bg-gold text-white">{user?.provider ?? "LOCAL"}</span>
        </div>

        <div className="mt-5 flex">
          {[
            ["키", avatar?.heightCm ? `${avatar.heightCm}cm` : "—"],
            ["몸무게", avatar?.weightKg ? `${avatar.weightKg}kg` : "—"],
            ["성별", { female: "여성", male: "남성", neutral: "중립" }[avatar?.gender] ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex-1 text-center">
              <p className="lbl mb-1">{k}</p>
              <b className="text-sm">{v}</b>
            </div>
          ))}
        </div>
        <button
          className="mt-4 w-full rounded-full border border-ink bg-white py-2.5 text-xs font-semibold"
          onClick={() => nav("/mypage/account")}
        >
          프로필 · 아바타 정보 수정
        </button>
      </section>

      <section className="mt-9">
        <p className="lbl mb-2.5">MENU</p>
        <div className="overflow-hidden rounded-card bg-white">
          {menu.map(([icon, title, sub, path]) => (
            <button
              key={path}
              onClick={() => nav(path)}
              className="flex w-full items-center gap-3.5 border-b border-line p-[18px] text-left last:border-0"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-card text-ink">
                <Icon name={icon} size={18} />
              </span>
              <span className="flex-1">
                <b className="block text-sm font-semibold">{title}</b>
                <span className="text-[11px] text-muted">{sub}</span>
              </span>
              <span className="text-greige">›</span>
            </button>
          ))}
        </div>
      </section>

      <button
        className="btn mt-6 border border-line bg-white text-muted"
        onClick={async () => {
          await signOut();
          nav("/login", { replace: true });
        }}
      >
        로그아웃
      </button>
      <p className="mt-5 text-center text-[11px] text-muted">
        가입일 {fmtDate(user?.createdAt)} · Atelier Lens MVP v3
      </p>
    </Screen>
  );
}
