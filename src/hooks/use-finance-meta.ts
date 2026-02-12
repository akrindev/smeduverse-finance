import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api-client'
import type { FinanceHealthResponse } from '@/types/finance'

const FINANCE_META_KEYS = {
  all: ['finance-meta'] as const,
  health: () => [...FINANCE_META_KEYS.all, 'health'] as const,
}

export function useFinanceHealth() {
  return useQuery({
    queryKey: FINANCE_META_KEYS.health(),
    queryFn: () => apiGet<FinanceHealthResponse>('/meta/health'),
    staleTime: 60_000,
  })
}
