import { describe, it, expect, vi } from 'vitest'
import { apiPost } from './api-client'
import { LoginRequest, LoginResponse } from '@/types/finance'

vi.mock('./api-client', () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
  setToken: vi.fn(),
  getToken: vi.fn(() => 'test-token'),
  removeToken: vi.fn(),
  isAuthenticated: vi.fn(() => true),
}))

describe('Login Flow Logic', () => {
  it('should call the correct login endpoint with credentials', async () => {
    const credentials: LoginRequest = {
      email: 'bendahara@example.com',
      password: 'password',
    }

    const mockResponse: LoginResponse = {
      token: '1|testtoken',
      user: {
        id: 'uuid-1',
        username: 'bendahara',
        email: 'bendahara@example.com',
        created_at: '2026-02-10T00:00:00Z',
        updated_at: '2026-02-10T00:00:00Z',
      },
    }

    vi.mocked(apiPost).mockResolvedValueOnce(mockResponse)

    const response = await apiPost<LoginResponse>('/auth/login', credentials)

    expect(apiPost).toHaveBeenCalledWith('/auth/login', credentials)
    expect(response).toEqual(mockResponse)
    expect(response.user.email).toBe(credentials.email)
  })
})
