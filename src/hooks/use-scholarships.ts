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
  Scholarship,
  StoreScholarshipRequest,
  UpdateScholarshipRequest,
  AssignStudentScholarshipRequest,
  StudentScholarship,
  PaginatedResponse,
  SingleResponse,
} from '@/types/finance'

const SCHOLARSHIP_KEYS = {
  all: ['scholarships'] as const,
  list: (params?: Record<string, unknown>) => [...SCHOLARSHIP_KEYS.all, 'list', params] as const,
  detail: (id: number) => [...SCHOLARSHIP_KEYS.all, 'detail', id] as const,
}

export function useScholarships(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: SCHOLARSHIP_KEYS.list(params),
    queryFn: async () => {
      const response = await apiGet<
        PaginatedResponse<Scholarship> | { data: PaginatedResponse<Scholarship> }
      >('/scholarships', params)
      return unwrapPaginated(response)
    },
  })
}

export function useScholarship(id: number) {
  return useQuery({
    queryKey: SCHOLARSHIP_KEYS.detail(id),
    queryFn: async () => {
      const response = await apiGet<Scholarship | SingleResponse<Scholarship>>(
        `/scholarships/${id}`,
      )
      return unwrapResource(response)
    },
    enabled: !!id,
  })
}

export function useCreateScholarship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: StoreScholarshipRequest) =>
      apiPost<Scholarship | SingleResponse<Scholarship>>('/scholarships', data).then(
        unwrapResource,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHOLARSHIP_KEYS.all }),
  })
}

export function useUpdateScholarship(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateScholarshipRequest) =>
      apiPatch<Scholarship | SingleResponse<Scholarship>>(
        `/scholarships/${id}`,
        data,
      ).then(unwrapResource),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHOLARSHIP_KEYS.all }),
  })
}

export function useDeleteScholarship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiDelete(`/scholarships/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHOLARSHIP_KEYS.all }),
  })
}

export function useAssignScholarship() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssignStudentScholarshipRequest) =>
      apiPost<StudentScholarship | SingleResponse<StudentScholarship>>(
        '/scholarships/assign',
        data,
      ).then(unwrapResource),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCHOLARSHIP_KEYS.all }),
  })
}
