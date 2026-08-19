import { FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { adminLogin } from '../../services/adminApi'

export default function AdminLogin() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = '관리자 로그인 — OATSTONE'
  }, [])

  if (token) {
    return <Navigate to="/admin/portfolio" replace />
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await adminLogin(username, password)
      login(result.access_token)
      navigate('/admin/portfolio', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={onSubmit}>
        <img src="/assets/oatstone-logo.png" alt="OATSTONE" className="admin-login__logo" />
        <h1>관리자 로그인</h1>
        <p>포트폴리오 프로젝트를 등록·수정합니다.</p>

        <label>
          아이디
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="admin-login__error">{error}</p>}

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>
    </div>
  )
}
