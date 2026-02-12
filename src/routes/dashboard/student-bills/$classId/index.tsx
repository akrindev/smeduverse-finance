import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { useRefRombel, useRefStudents } from '@/hooks/use-references'
import { apiGet, unwrapPaginated } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import { cardHeaderClass, surfaceCardClass } from '@/lib/page-styles'
import { getRombelLabel } from '@/lib/tagihan-siswa'
import type { Bill, PaginatedResponse, Student } from '@/types/finance'
import { Button, Card } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, User } from 'lucide-react'
import { useMemo } from 'react'

interface StudentSummary {
  totalBills: number
  totalOutstanding: number
}

export const Route = createFileRoute('/dashboard/student-bills/$classId/')({
  component: ClassDetailPage,
})

function ClassDetailPage() {
  const { classId } = Route.useParams()
  const navigate = useNavigate()

  const { data: selectedClass, isLoading: classLoading } = useRefRombel(classId)

  const studentsParams = useMemo(
    () => ({ rombongan_belajar_id: classId, per_page: 100 }),
    [classId],
  )
  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
  } = useRefStudents(studentsParams)

  const {
    data: classBillsData,
    isLoading: classBillsLoading,
  } = useQuery({
    queryKey: ['bills', 'class', classId],
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<Bill> | { data: PaginatedResponse<Bill> }>('/bills', {
        rombongan_belajar_id: classId,
        per_page: 500,
      })
      return unwrapPaginated(response)
    },
  })

  const students = studentsData?.data ?? []
  const classBills = classBillsData?.data ?? []

  const studentSummaryMap = useMemo(() => {
    const map = new Map<string, StudentSummary>()
    if (!classBills.length && !students.length) return map

    for (const bill of classBills) {
      const current = map.get(bill.student_id) ?? { totalBills: 0, totalOutstanding: 0 }
      map.set(bill.student_id, {
        totalBills: current.totalBills + 1,
        totalOutstanding: current.totalOutstanding + bill.amount_outstanding,
      })
    }

    for (const student of students) {
      if (!map.has(student.student_id)) {
        map.set(student.student_id, { totalBills: 0, totalOutstanding: 0 })
      }
    }

    return map
  }, [classBills, students])

  function selectStudent(student: Student): void {
    navigate({
      to: '/dashboard/student-bills/$classId/$studentId',
      params: { classId, studentId: student.student_id },
    })
  }

  function backToClasses(): void {
    navigate({ to: '/dashboard/student-bills', search: {}, replace: true })
  }

  return (
    <div className="space-y-6">
      <Card className={surfaceCardClass}>
        <Card.Header className={cardHeaderClass}>
          <div className="flex flex-wrap justify-between items-center gap-2 w-full">
            <div>
              <p className="text-default-500 text-sm">Kelas Terpilih</p>
              <p data-testid="selected-class-name" className="font-semibold text-lg">
                {selectedClass ? getRombelLabel(selectedClass) : (classLoading ? 'Memuat...' : '-')}
              </p>
            </div>
            <Button
              variant="secondary"
              onPress={backToClasses}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Kembali ke Daftar Kelas
            </Button>
          </div>
        </Card.Header>
      </Card>

      <Card className={surfaceCardClass}>
        <Card.Content>
          {studentsLoading || classBillsLoading ? (
            <LoadingState minHeight="260px" />
          ) : studentsError ? (
            <ErrorState message="Gagal memuat daftar siswa pada kelas ini." detail="Silakan coba lagi." />
          ) : students.length === 0 ? (
            <EmptyState icon={User} message="Belum ada siswa aktif pada kelas ini." />
          ) : (
            <div data-testid="student-list-view" className="space-y-2">
              {students.map((student) => {
                const studentSummary = studentSummaryMap.get(student.student_id) ?? {
                  totalBills: 0,
                  totalOutstanding: 0,
                }

                return (
                  <div
                    key={student.student_id}
                    data-testid="student-list-item"
                    role="button"
                    tabIndex={0}
                    className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 w-full text-left border border-border/50 hover:border-accent/40 transition-colors rounded-[24px] bg-surface/90 backdrop-blur-xl cursor-pointer"
                    onClick={() => selectStudent(student)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectStudent(student)
                      }
                    }}
                  >
                    <div>
                      <p className="font-medium text-foreground">{student.fullname}</p>
                      <p className="text-default-500 text-xs">{student.nipd || student.nisn || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-default/10 px-2 py-0.5 rounded-full text-[10px] text-default-600">
                        {studentSummary.totalBills} tagihan
                      </div>
                      <div className={`px-2 py-0.5 rounded-full text-[10px] ${studentSummary.totalOutstanding > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                        {formatCurrency(studentSummary.totalOutstanding)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

