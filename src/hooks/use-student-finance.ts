import { useQuery } from '@tanstack/react-query'
import { apiGet, unwrapResource } from '@/lib/api-client'
import type { SingleResponse, StudentLedger } from '@/types/finance'

const STUDENT_FINANCE_KEYS = {
  all: ['student-finance'] as const,
  ledger: (studentId: string) => [...STUDENT_FINANCE_KEYS.all, 'ledger', studentId] as const,
}

export function useStudentLedger(studentId: string) {
  return useQuery({
    queryKey: STUDENT_FINANCE_KEYS.ledger(studentId),
    queryFn: async () => {
      const response = await apiGet<StudentLedger | SingleResponse<StudentLedger>>(
        `/students/${studentId}/ledger`,
      )
      return unwrapResource(response)
    },
    enabled: !!studentId,
  })
}
