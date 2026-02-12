import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, LoginRequest, LoginResponse } from '@/types/finance'
import {
  apiPost,
  apiGet,
  setToken,
  removeToken,
  getToken,
  unwrapResource,
  ensureCsrfCookie,
} from '@/lib/api-client'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  setUser: (user: User | null) => void
  hydrateToken: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials) => {
        removeToken()
        set({
          isLoading: true,
          user: null,
          token: null,
          isAuthenticated: false,
        })

        try {
          await ensureCsrfCookie()

          const response = await apiPost<
            Omit<LoginResponse, 'user'> & { user: User | { data: User } }
          >('/auth/login', credentials)
          const user = unwrapResource(response.user)

          setToken(response.token)
          set({
            user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await apiPost('/auth/logout')
        } catch {
        } finally {
          removeToken()
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      refreshUser: async () => {
        const state = get()
        const activeToken = state.token || getToken()

        if (!activeToken) {
          return
        }

        if (state.token !== activeToken || !state.isAuthenticated) {
          set({
            token: activeToken,
            isAuthenticated: true,
          })
        }

        setToken(activeToken)

        set({ isLoading: true })
        try {
          const response = await apiGet<User | { data: User }>('/auth/me')
          const user = unwrapResource(response)

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch {
          removeToken()
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      setUser: (user) => set({ user }),

      hydrateToken: () => {
        const state = get()
        const activeToken = state.token || getToken()

        if (!activeToken) {
          return
        }

        if (state.token !== activeToken) {
          set({
            token: activeToken,
            isAuthenticated: true,
          })
        }

        setToken(activeToken)
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          return persistedState as AuthState
        }
        return persistedState as AuthState
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
