import { useEffect } from 'react'
import { useAuthStore } from './auth-store'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isLoading = useAuthStore((state) => state.isLoading)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const refreshUser = useAuthStore((state) => state.refreshUser)
  const setUser = useAuthStore((state) => state.setUser)
  const hydrateToken = useAuthStore((state) => state.hydrateToken)

  useEffect(() => {
    hydrateToken()
  }, [hydrateToken])

  useEffect(() => {
    if (token && !user && !isLoading) {
      refreshUser()
    }
  }, [token, user, isLoading, refreshUser])

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    setUser,
    hydrateToken,
  }
}

export { useAuthStore }
