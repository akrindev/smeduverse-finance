import { useQuery } from '@tanstack/react-query'
import { apiGet, unwrapPaginated, unwrapResource } from '@/lib/api-client'
import type {
  PaginatedResponse,
  RefRombelsFilters,
  RefStudentsFilters,
  Rombel,
  SingleResponse,
  Student,
} from '@/types/finance'

const REFERENCE_KEYS = {
  all: ['references'] as const,
  students: (filters?: RefStudentsFilters) =>
    [...REFERENCE_KEYS.all, 'students', filters] as const,
  studentDetail: (studentId: string) =>
    [...REFERENCE_KEYS.all, 'students', 'detail', studentId] as const,
  rombels: (filters?: RefRombelsFilters) =>
    [...REFERENCE_KEYS.all, 'rombels', filters] as const,
  rombelDetail: (rombelId: string) =>
    [...REFERENCE_KEYS.all, 'rombels', 'detail', rombelId] as const,
}

interface QueryOptions {
  enabled?: boolean
}

export function useRefStudents(filters?: RefStudentsFilters, options?: QueryOptions) {
  return useQuery({
    queryKey: REFERENCE_KEYS.students(filters),
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<Student> | { data: PaginatedResponse<Student> }>(
        '/ref/students',
        filters as Record<string, unknown>,
      )
      return unwrapPaginated(response)
    },
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
  })
}

export function useRefStudent(studentId: string, options?: QueryOptions) {
  return useQuery({
    queryKey: REFERENCE_KEYS.studentDetail(studentId),
    queryFn: async () => {
      const response = await apiGet<Student | SingleResponse<Student>>(`/ref/students/${studentId}`)
      return unwrapResource(response)
    },
    enabled: (options?.enabled ?? true) && !!studentId,
  })
}

export function useRefRombels(filters?: RefRombelsFilters, options?: QueryOptions) {
  return useQuery({
    queryKey: REFERENCE_KEYS.rombels(filters),
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<Rombel> | { data: PaginatedResponse<Rombel> }>(
        '/ref/rombels',
        filters as Record<string, unknown>,
      )
      return unwrapPaginated(response)
    },
    enabled: options?.enabled ?? true,
    placeholderData: (previousData) => previousData,
  })
}

export function useRefRombel(rombelId: string, options?: QueryOptions) {
  return useQuery({
    queryKey: REFERENCE_KEYS.rombelDetail(rombelId),
    queryFn: async () => {
      const response = await apiGet<Rombel | SingleResponse<Rombel>>(`/ref/rombels/${rombelId}`)
      return unwrapResource(response)
    },
    enabled: (options?.enabled ?? true) && !!rombelId,
  })
}
