import { Navigate, Route, Routes } from "react-router-dom";
import { PrivateRoute, Toast } from "@/components";

// 게스트 구간 (품번 촬영 → 피팅 → 추천 → 코디 확인) — 로그인 여부와 무관하게 접근 가능 [GUEST]
import Home from "./pages/guest/Home";
import Scan from "./pages/guest/Scan";
import ProductConfirm from "./pages/guest/ProductConfirm";
import AvatarCreate from "./pages/guest/AvatarCreate";
import CoordiDetail from "./pages/guest/CoordiDetail";
import PhotoFitting from "./pages/guest/PhotoFitting";
import PhotoFittingResult from "./pages/guest/PhotoFittingResult";
import UploadLimitReached from "./pages/guest/UploadLimitReached";
import ProductDetail from "./pages/guest/ProductDetail";

// 인증 (명세 §3)
import Login from "./pages/auth/Login";
import OAuthCallback from "./pages/auth/OAuthCallback";
import Complete from "./pages/auth/Complete";

// 마이페이지 (명세 §4, §10)
import MyPage from "./pages/mypage/MyPage";
import Account from "./pages/mypage/Account";
import Saved from "./pages/mypage/Saved";
import SavedDetail from "./pages/mypage/SavedDetail";

// 장바구니 · 주문 (명세 §11, §12)
import Cart from "./pages/shop/Cart";
import Orders from "./pages/shop/Orders";
import OrderDetail from "./pages/shop/OrderDetail";

// 사후관리 · 진단 · 수리 (명세 §13, §14, §15)
import Care from "./pages/care/Care";
import CareDetail from "./pages/care/CareDetail";
import RegisterProduct from "./pages/care/RegisterProduct";
import Diagnose from "./pages/care/Diagnose";
import DiagnosisResult from "./pages/care/DiagnosisResult";
import RepairReserve from "./pages/care/RepairReserve";
import Reservations from "./pages/care/Reservations";

/** 명세 1.2 MEMBER 구간은 전부 PrivateRoute 뒤에 둔다 */
const guard = (el) => <PrivateRoute>{el}</PrivateRoute>;

export default function App() {
  return (
    <>
      <Routes>
        {/* GUEST — 로그인 여부와 무관하게 접근 가능 */}
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/scan/confirm/:productId" element={<ProductConfirm />} />
        <Route path="/fitting/avatar" element={<AvatarCreate />} />
        <Route path="/fitting/photo" element={<PhotoFitting />} />
        <Route path="/fitting/photo/limit" element={<UploadLimitReached />} />
        <Route path="/fitting/photo/result" element={<PhotoFittingResult />} />
        <Route path="/coordi/:productId" element={<CoordiDetail />} />
        <Route path="/products/:productId" element={<ProductDetail />} />

        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* MEMBER */}
        <Route path="/complete" element={guard(<Complete />)} />
        <Route path="/mypage" element={guard(<MyPage />)} />
        <Route path="/mypage/account" element={guard(<Account />)} />
        <Route path="/saved" element={guard(<Saved />)} />
        <Route path="/saved/:savedCoordiId" element={guard(<SavedDetail />)} />

        <Route path="/cart" element={guard(<Cart />)} />
        <Route path="/orders" element={guard(<Orders />)} />
        <Route path="/orders/:orderId" element={guard(<OrderDetail />)} />

        <Route path="/care" element={guard(<Care />)} />
        <Route path="/care/register" element={guard(<RegisterProduct />)} />
        <Route path="/care/:registrationId" element={guard(<CareDetail />)} />
        <Route path="/care/:registrationId/diagnose" element={guard(<Diagnose />)} />
        <Route path="/diagnoses/:diagnosisId" element={guard(<DiagnosisResult />)} />

        <Route path="/repair-reservations" element={guard(<Reservations />)} />
        <Route path="/repair-reservations/new" element={guard(<RepairReserve />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
