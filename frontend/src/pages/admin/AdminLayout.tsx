import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '관리자 — OATSTONE'
  }, [])

  const onLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <img src="/assets/oatstone-logo.png" alt="OATSTONE" />
          <span>Admin</span>
        </div>
        <nav className="admin-sidebar__nav">
          <NavLink to="/admin/portfolio" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            포트폴리오
          </NavLink>
        </nav>
        <div className="admin-sidebar__footer">
          <a href="/" target="_blank" rel="noreferrer">
            사이트 보기
          </a>
          <button type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
