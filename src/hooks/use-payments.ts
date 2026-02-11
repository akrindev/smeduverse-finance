import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, unwrapPaginated, unwrapResource } from '@/lib/api-client'
import type {
  Payment,
  PaymentFilters,
  StorePaymentRequest,
  PaginatedResponse,
  SingleResponse,
} from '@/types/finance'

const PAYMENT_KEYS = {
  all: ['payments'] as const,
  list: (filters?: PaymentFilters) => [...PAYMENT_KEYS.all, 'list', filters] as const,
  detail: (id: number) => [...PAYMENT_KEYS.all, 'detail', id] as const,
}

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: PAYMENT_KEYS.list(filters),
    queryFn: async () => {
      const response = await apiGet<
        PaginatedResponse<Payment> | { data: PaginatedResponse<Payment> }
      >('/payments', filters as Record<string, unknown>)
      return unwrapPaginated(response)
    },
  })
}

export function usePayment(id: number) {
  return useQuery({
    queryKey: PAYMENT_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiGet<Payment | SingleResponse<Payment>>(`/payments/${id}`)
      return unwrapResource(response)
    },
    enabled: !!id,
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StorePaymentRequest) =>
      apiPost<Payment | SingleResponse<Payment>>('/payments', data).then(unwrapResource),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYMENT_KEYS.all })
      qc.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}
