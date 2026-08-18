import { Route, Routes } from 'react-router-dom'
import PrivateRoute from './routes/PrivateRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import MyPage from './pages/MyPage'
import Scan from './pages/Scan'
import CoordiDetail from './pages/CoordiDetail'
import AvatarCreate from './pages/AvatarCreate'
import ProductConfirm from './pages/ProductConfirm'
import PhotoFitting from './pages/PhotoFitting'
import PhotoFittingResult from './pages/PhotoFittingResult'
import UploadLimitReached from './pages/UploadLimitReached'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/scan/confirm/:productId" element={<ProductConfirm />} />
      <Route path="/fitting/avatar" element={<AvatarCreate />} />
      <Route path="/fitting/photo" element={<PhotoFitting />} />
      <Route path="/fitting/photo/limit" element={<UploadLimitReached />} />
      <Route path="/fitting/photo/result" element={<PhotoFittingResult />} />
      <Route path="/coordi/:productId" element={<CoordiDetail />} />

      <Route element={<PrivateRoute />}>
        <Route path="/mypage" element={<MyPage />} />
      </Route>
    </Routes>
  )
}

export default App
