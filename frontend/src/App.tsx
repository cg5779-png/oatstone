import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPortfolioList from './pages/admin/AdminPortfolioList'
import AdminPortfolioEditor from './pages/admin/AdminPortfolioEditor'
import { useAuth } from './hooks/useAuth'

function ProtectedAdmin() {
  const { token, checking } = useAuth()

  if (checking) {
    return <div className="admin-boot">관리자 페이지를 불러오는 중…</div>
  }
  if (!token) {
    return <Navigate to="/admin/login" replace />
  }
  return <AdminLayout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<ProtectedAdmin />}>
        <Route index element={<Navigate to="portfolio" replace />} />
        <Route path="portfolio" element={<AdminPortfolioList />} />
        <Route path="portfolio/new" element={<AdminPortfolioEditor />} />
        <Route path="portfolio/:id" element={<AdminPortfolioEditor />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
