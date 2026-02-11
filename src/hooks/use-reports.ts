import { useQuery } from '@tanstack/react-query'
import { apiGet, unwrapCollection } from '@/lib/api-client'
import type {
  Bill,
  ReceivablesFilters,
  ReceivablesReport,
  CollectionsFilters,
  CollectionsReport,
  Payment,
  StudentLedger,
} from '@/types/finance'

const REPORT_KEYS = {
  receivables: (filters?: ReceivablesFilters) => ['reports', 'receivables', filters] as const,
  collections: (filters?: CollectionsFilters) => ['reports', 'collections', filters] as const,
  ledger: (studentId: string) => ['reports', 'ledger', studentId] as const,
}

export function useReceivablesReport(filters?: ReceivablesFilters) {
  return useQuery({
    queryKey: REPORT_KEYS.receivables(filters),
    queryFn: () =>
      apiGet<ReceivablesReport>('/reports/receivables', filters as Record<string, unknown>),
  })
}

export function useCollectionsReport(filters?: CollectionsFilters) {
  return useQuery({
    queryKey: REPORT_KEYS.collections(filters),
    queryFn: () =>
      apiGet<CollectionsReport>('/reports/collections', filters as Record<string, unknown>),
  })
}

export function useStudentLedger(studentId: string) {
  return useQuery({
    queryKey: REPORT_KEYS.ledger(studentId),
    queryFn: async () => {
      const response = await apiGet<
        Omit<StudentLedger, 'bills' | 'payments'> & {
          bills: Bill[] | { data: Bill[] }
          payments: Payment[] | { data: Payment[] }
        }
      >(`/students/${studentId}/ledger`)

      return {
        ...response,
        bills: unwrapCollection(response.bills),
        payments: unwrapCollection(response.payments),
      }
    },
    enabled: !!studentId,
  })
}
