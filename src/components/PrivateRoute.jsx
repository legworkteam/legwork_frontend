import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store";

/**
 * 명세 1.2 MEMBER 구간 게이트.
 * 미로그인이면 /login 으로 보내고, 로그인 후 원래 가려던 경로로 돌려보낸다.
 */
export default function PrivateRoute({ children }) {
  const authed = useAuth((s) => s.authed);
  const loadMe = useAuth((s) => s.loadMe);
  const loc = useLocation();

  useEffect(() => {
    if (authed) loadMe();
  }, [authed, loadMe]);

  if (!authed) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}
