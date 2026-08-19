import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchAdminMe, setUnauthorizedHandler } from '../services/adminApi'

const TOKEN_KEY = 'oatstone_admin_token'

interface AuthContextValue {
  token: string | null
  checking: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [checking, setChecking] = useState(Boolean(token))

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  const login = useCallback((nextToken: string) => {
    localStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    if (!token) {
      setChecking(false)
      return
    }

    let cancelled = false
    setChecking(true)
    fetchAdminMe(token)
      .then(() => {
        if (!cancelled) setChecking(false)
      })
      .catch(() => {
        if (!cancelled) {
          logout()
          setChecking(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, logout])

  const value = useMemo(
    () => ({ token, checking, login, logout }),
    [token, checking, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  }
  return context
}
