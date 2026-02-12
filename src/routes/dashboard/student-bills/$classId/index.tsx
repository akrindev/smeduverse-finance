import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { useRefRombel, useRefStudents } from '@/hooks/use-references'
import { apiGet, unwrapPaginated } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import {
  cardHeaderClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { getRombelLabel } from '@/lib/tagihan-siswa'
import { TablePagination } from '@/lib/table-pagination'
import type { Bill, PaginatedResponse, Student } from '@/types/finance'
import { Button, Card, Chip, Spinner, useOverlayState } from '@heroui/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowLeft, User as UserIcon, Calculator } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { GenerateBillModal } from '@/components/student-bills/generate-bill-modal'

interface StudentSummary {
  totalBills: number
  totalOutstanding: number
}

export const Route = createFileRoute('/dashboard/student-bills/$classId/')({
  component: ClassDetailPage,
})

const genderLabels: Record<string, string> = {
  l: 'Laki-laki',
  p: 'Perempuan',
}

function ClassDetailPage() {
  const { classId } = Route.useParams()
  const navigate = useNavigate()
  const search = useSearch({ from: '/dashboard/student-bills' })

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })
  const generateModalState = useOverlayState()

  const { data: selectedClass, isLoading: classLoading } = useRefRombel(classId)

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isPlaceholderData: studentsPlaceholder,
    isFetching: studentsFetching,
    error: studentsError,
  } = useRefStudents({
    rombongan_belajar_id: classId,
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    search: search.search,
  })

  const {
    data: classBillsData,
    isLoading: classBillsLoading,
    refetch: refetchBills,
  } = useQuery({
    queryKey: ['bills', 'class', classId, search.tahun_ajaran_id, search.semester_id],
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<Bill> | { data: PaginatedResponse<Bill> }>('/bills', {
        rombongan_belajar_id: classId,
        tahun_ajaran_id: search.tahun_ajaran_id,
        semester_id: search.semester_id,
        per_page: 500,
      })
      return unwrapPaginated(response)
    },
  })

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [search.search])

  const students = studentsData?.data ?? []
  const meta = studentsData?.meta
  const classBills = classBillsData?.data ?? []
  
  const studentIds = useMemo(() => students.map(s => s.student_id), [students])

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

    return map
  }, [classBills])

  const table = useReactTable({
    data: students,
    columns: useMemo(() => [{ accessorKey: 'student_id' }], []),
    pageCount: meta?.last_page ?? -1,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  function selectStudent(student: Student): void {
    navigate({
      to: '/dashboard/student-bills/$classId/$studentId',
      params: { classId, studentId: student.student_id },
    })
  }

  function backToClasses(): void {
    navigate({ to: '/dashboard/student-bills', search: {}, replace: true })
  }

  const isLoading = classLoading || classBillsLoading || (studentsLoading && !studentsPlaceholder)

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
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                className="bg-accent text-accent-foreground"
                onPress={generateModalState.open}
              >
                <Calculator className="mr-2 w-4 h-4" />
                Generate Tagihan
              </Button>
              <Button
                variant="secondary"
                onPress={backToClasses}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Kembali ke Daftar Kelas
              </Button>
            </div>
          </div>
        </Card.Header>
      </Card>

      {selectedClass && (
        <GenerateBillModal
          state={generateModalState}
          selectedClass={selectedClass}
          studentIds={studentIds}
          onSuccess={() => {
            refetchBills()
          }}
        />
      )}

      <Card className={surfaceCardClass}>
        <Card.Content className="relative min-h-[300px]">
          {studentsFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px] transition-opacity">
              <Spinner size="lg" />
            </div>
          )}
          {isLoading ? (
            <LoadingState minHeight="260px" />
          ) : studentsError ? (
            <ErrorState message="Gagal memuat daftar siswa pada kelas ini." detail="Silakan coba lagi." />
          ) : students.length === 0 ? (
            <EmptyState icon={UserIcon} message="Belum ada siswa aktif pada kelas ini." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-border/70">
                      <th className={tableHeadCellClass}>Siswa</th>
                      <th className={tableHeadCellClass}>NIPD / NISN</th>
                      <th className={tableHeadCellClass}>Jenis Kelamin</th>
                      <th className={tableHeadCellClass}>Status</th>
                      <th className={tableHeadCellClass}>Tagihan</th>
                      <th className={tableHeadCellClass}>Sisa</th>
                      <th className={tableHeadCellClass}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const studentSummary = studentSummaryMap.get(student.student_id) ?? {
                        totalBills: 0,
                        totalOutstanding: 0,
                      }

                      return (
                        <tr key={student.student_id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                          <td className={`${tableBodyCellClass} font-medium text-default-700`}>{student.fullname}</td>
                          <td className={tableBodyCellClass}>{student.nipd || student.nisn || '-'}</td>
                          <td className={tableBodyCellClass}>
                            {student.jenis_kelamin ? genderLabels[student.jenis_kelamin.toLowerCase()] || student.jenis_kelamin : '-'}
                          </td>
                          <td className={tableBodyCellClass}>
                            <Chip size="sm" variant="soft" color="success">
                              <Chip.Label>Aktif</Chip.Label>
                            </Chip>
                          </td>
                          <td className={tableBodyCellClass}>
                            <div className="flex flex-col">
                              <span className="text-xs font-medium">{studentSummary.totalBills} tagihan</span>
                            </div>
                          </td>
                          <td className={`${tableBodyCellClass} font-semibold ${studentSummary.totalOutstanding > 0 ? 'text-danger' : 'text-success'}`}>
                            {formatCurrency(studentSummary.totalOutstanding)}
                          </td>
                          <td className={tableBodyCellClass}>
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => selectStudent(student)}
                            >
                              Pilih
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <TablePagination
                pageIndex={pagination.pageIndex}
                pageCount={table.getPageCount()}
                pageSize={pagination.pageSize}
                totalRows={meta?.total ?? 0}
                visibleRows={students.length}
                canPreviousPage={table.getCanPreviousPage()}
                canNextPage={table.getCanNextPage()}
                onPreviousPage={() => table.previousPage()}
                onNextPage={() => table.nextPage()}
              />
            </>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
