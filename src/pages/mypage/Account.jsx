import { useState } from "react";
import * as api from "@/api";
import { Field, Screen } from "@/components";
import { toast, toastError, useAuth } from "@/store";

/** 명세 4. PATCH /me · PATCH /me/password · PUT /me/avatar */
export default function Account() {
  const { user, avatar } = useAuth();
  const [busy, setBusy] = useState(null);

  const run = async (key, fn, msg) => {
    setBusy(key);
    try {
      await fn();
      toast(msg);
    } catch (e) {
      toastError(e); // 소셜 전용 계정 비밀번호 변경: PASSWORD_AUTH_NOT_AVAILABLE(409)
    } finally {
      setBusy(null);
    }
  };

  const saveProfile = (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    run("profile", async () => useAuth.setState({ user: await api.patchMe(body) }), "프로필을 저장했습니다");
  };

  const savePassword = (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    e.target.reset();
    run("password", () => api.patchPassword(f.currentPassword, f.newPassword), "비밀번호를 변경했습니다");
  };

  const saveAvatar = (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const body = { heightCm: +f.heightCm, weightKg: +f.weightKg, gender: f.gender };
    run("avatar", async () => useAuth.setState({ avatar: await api.putAvatar(body) }), "아바타 정보를 저장했습니다");
  };

  return (
    <Screen title="계정 설정" back="/mypage" right={false}>
      <section className="mt-5">
        <p className="lbl mb-2.5">PROFILE</p>
        <form onSubmit={saveProfile} className="card">
          <Field label="이메일">
            <input value={user?.email ?? ""} disabled className="text-muted" />
          </Field>
          <Field label="이름">
            <input name="name" defaultValue={user?.name ?? ""} required />
          </Field>
          <Field label="휴대폰">
            <input name="phone" defaultValue={user?.phone ?? ""} placeholder="010-0000-0000" />
          </Field>
          <button className="btn bg-ink text-white" disabled={busy === "profile"}>
            {busy === "profile" ? "저장 중…" : "프로필 저장"}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <p className="lbl mb-2.5">AVATAR — 명세 100~230cm / 30~200kg</p>
        <form onSubmit={saveAvatar} className="card">
          <Field label="키 (cm)">
            <input
              name="heightCm"
              type="number"
              min={api.AVATAR_LIMITS.heightCm[0]}
              max={api.AVATAR_LIMITS.heightCm[1]}
              defaultValue={avatar?.heightCm ?? 170}
              required
            />
          </Field>
          <Field label="몸무게 (kg)">
            <input
              name="weightKg"
              type="number"
              min={api.AVATAR_LIMITS.weightKg[0]}
              max={api.AVATAR_LIMITS.weightKg[1]}
              defaultValue={avatar?.weightKg ?? 60}
              required
            />
          </Field>
          <Field label="성별">
            <select name="gender" defaultValue={avatar?.gender ?? "neutral"}>
              <option value="female">여성</option>
              <option value="male">남성</option>
              <option value="neutral">중립</option>
            </select>
          </Field>
          <button className="btn bg-ink text-white" disabled={busy === "avatar"}>
            {busy === "avatar" ? "저장 중…" : "아바타 정보 저장"}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <p className="lbl mb-2.5">PASSWORD</p>
        <form onSubmit={savePassword} className="card">
          <Field label="현재 비밀번호">
            <input name="currentPassword" type="password" required />
          </Field>
          <Field label="새 비밀번호">
            <input
              name="newPassword"
              type="password"
              minLength={8}
              required
              {...api.passwordFieldProps()}
              placeholder="8자 이상, 대문자·숫자·특수문자"
            />
          </Field>
          <button className="btn border border-ink bg-white" disabled={busy === "password"}>
            {busy === "password" ? "변경 중…" : "비밀번호 변경"}
          </button>
          <p className="mt-3 text-center text-[11px] text-muted">
            소셜 로그인 전용 계정은 비밀번호를 변경할 수 없습니다.
          </p>
        </form>
      </section>
    </Screen>
  );
}
