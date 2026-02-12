import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  unwrapPaginated,
  unwrapResource,
} from '@/lib/api-client'
import type {
  FeeType,
  StoreFeeTypeRequest,
  UpdateFeeTypeRequest,
  PaginatedResponse,
  SingleResponse,
} from '@/types/finance'

const FEE_TYPE_KEYS = {
  all: ['fee-types'] as const,
  list: (params?: Record<string, unknown>) => [...FEE_TYPE_KEYS.all, 'list', params] as const,
  detail: (id: number) => [...FEE_TYPE_KEYS.all, 'detail', id] as const,
}

export function useFeeTypes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: FEE_TYPE_KEYS.list(params),
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<FeeType> | { data: PaginatedResponse<FeeType> }>(
        '/fee-types',
        params,
      )

      return unwrapPaginated(response)
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useFeeType(id: number) {
  return useQuery({
    queryKey: FEE_TYPE_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiGet<FeeType | SingleResponse<FeeType>>(`/fee-types/${id}`)
      return unwrapResource(response)
    },
    enabled: !!id,
  })
}

export function useCreateFeeType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreFeeTypeRequest) =>
      apiPost<FeeType | SingleResponse<FeeType>>('/fee-types', data).then(unwrapResource),
    onSuccess: () => qc.invalidateQueries({ queryKey: FEE_TYPE_KEYS.all }),
  })
}

export function useUpdateFeeType(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateFeeTypeRequest) =>
      apiPatch<FeeType | SingleResponse<FeeType>>(`/fee-types/${id}`, data).then(unwrapResource),
    onSuccess: () => qc.invalidateQueries({ queryKey: FEE_TYPE_KEYS.all }),
  })
}

export function useDeleteFeeType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/fee-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: FEE_TYPE_KEYS.all }),
  })
}
