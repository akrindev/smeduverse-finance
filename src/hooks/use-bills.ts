import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiGet,
  apiPost,
  apiPatch,
  unwrapCollection,
  unwrapPaginated,
  unwrapResource,
} from '@/lib/api-client'
import type {
  Bill,
  BillFilters,
  GenerateSppRequest,
  GenerateFeeRequest,
  PaginatedResponse,
  SingleResponse,
  RecalculateBillsRequest,
  RecalculateBillsResponse,
} from '@/types/finance'

const BILL_KEYS = {
  all: ['bills'] as const,
  list: (filters?: BillFilters) => [...BILL_KEYS.all, 'list', filters] as const,
  detail: (id: number) => [...BILL_KEYS.all, 'detail', id] as const,
  student: (studentId: string, params?: Record<string, unknown>) =>
    [...BILL_KEYS.all, 'student', studentId, params] as const,
}

export function useBills(filters?: BillFilters) {
  return useQuery({
    queryKey: BILL_KEYS.list(filters),
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<Bill> | { data: PaginatedResponse<Bill> }>(
        '/bills',
        filters as Record<string, unknown>,
      )
      return unwrapPaginated(response)
    },
    placeholderData: (previousData) => previousData,
  })
}

export function useBill(id: number) {
  return useQuery({
    queryKey: BILL_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiGet<Bill | SingleResponse<Bill>>(`/bills/${id}`)
      return unwrapResource(response)
    },
    enabled: !!id,
  })
}

export function useStudentBills(studentId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: BILL_KEYS.student(studentId, params),
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<Bill> | { data: PaginatedResponse<Bill> }>(
        `/students/${studentId}/bills`,
        params,
      )
      return unwrapPaginated(response)
    },
    enabled: !!studentId,
    placeholderData: (previousData) => previousData,
  })
}

export function useGenerateSpp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: GenerateSppRequest) => {
      const response = await apiPost<{
        targeted: number
        created_count: number
        skipped_count: number
        created_bills: Bill[] | { data: Bill[] }
      }>('/bills/generate/spp', data)

      return {
        ...response,
        created_bills: unwrapCollection(response.created_bills),
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BILL_KEYS.all }),
  })
}

export function useGenerateFee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: GenerateFeeRequest) => {
      const response = await apiPost<{
        created_count: number
        created_bills: Bill[] | { data: Bill[] }
      }>('/bills/generate/fee', data)

      return {
        ...response,
        created_bills: unwrapCollection(response.created_bills),
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BILL_KEYS.all }),
  })
}

export function useVoidBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiPatch<Bill | SingleResponse<Bill>>(`/bills/${id}/void`).then(unwrapResource),
    onSuccess: () => qc.invalidateQueries({ queryKey: BILL_KEYS.all }),
  })
}

export function useUnvoidBill() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      apiPatch<Bill | SingleResponse<Bill>>(`/bills/${id}/unvoid`).then(unwrapResource),
    onSuccess: () => qc.invalidateQueries({ queryKey: BILL_KEYS.all }),
  })
}

export function useRecalculateBills() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RecalculateBillsRequest) =>
      apiPost<RecalculateBillsResponse | { data: RecalculateBillsResponse }>(
        '/bills/recalculate',
        data,
      ).then(unwrapResource),
    onSuccess: () => qc.invalidateQueries({ queryKey: BILL_KEYS.all }),
  })
}
