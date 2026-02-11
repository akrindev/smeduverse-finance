import { useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Button,
  Card,
  Chip,
  Spinner,
  Tabs,
  useOverlayState,
} from '@heroui/react'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Receipt,
  User,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BillDetailModal } from '@/components/student-bills/bill-detail-modal'
import { PaymentModal } from '@/components/student-bills/payment-modal'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { useStudentBills } from '@/hooks/use-bills'
import { useRefRombels, useRefStudents } from '@/hooks/use-references'
import { apiGet, unwrapPaginated } from '@/lib/api-client'
import { formatCurrency } from '@/lib/format'
import {
  billStatusConfig,
  MONTH_NAMES,
} from '@/lib/student-bills'
import {
  buildClassMetricsMap,
  getRombelLabel,
  sortRombelsByJenjang,
  type ClassMetrics,
} from '@/lib/tagihan-siswa'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import type { Bill, PaginatedResponse, ReceivablesReport, Rombel, Student } from '@/types/finance'

interface SearchParams {
  class_id?: string
  student_id?: string
}

interface StudentSummary {
  totalBills: number
  totalOutstanding: number
}

export const Route = createFileRoute('/dashboard/student-bills')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    class_id: typeof search.class_id === 'string' ? search.class_id : undefined,
    student_id: typeof search.student_id === 'string' ? search.student_id : undefined,
  }),
  component: StudentBillsPage,
})

function StudentBillsPage() {
  const navigate = useNavigate()
  const { class_id: paramClassId, student_id: paramStudentId } = Route.useSearch()
  const [activeClassId, setActiveClassId] = useState(paramClassId ?? '')
  const [activeStudentId, setActiveStudentId] = useState(paramStudentId ?? '')
  const [activeTab, setActiveTab] = useState<'spp' | 'other'>('spp')
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [billToPay, setBillToPay] = useState<Bill | null>(null)
  const [otherPagination, setOtherPagination] = useState({ pageIndex: 0, pageSize: 8 })
  const detailModalState = useOverlayState()
  const paymentModalState = useOverlayState()

  useEffect(() => {
    setActiveClassId(paramClassId ?? '')
  }, [paramClassId])

  useEffect(() => {
    if (!paramClassId && paramStudentId) {
      navigate({
        to: '/dashboard/student-bills',
        search: {},
        replace: true,
      })
    }
  }, [navigate, paramClassId, paramStudentId])

  useEffect(() => {
    setActiveStudentId(paramStudentId ?? '')
  }, [paramStudentId])

  const {
    data: rombelsData,
    isLoading: rombelsLoading,
    error: rombelsError,
  } = useRefRombels({ per_page: 100, active_only: true })

  const rombels = useMemo(() => sortRombelsByJenjang(rombelsData?.data ?? []), [rombelsData?.data])

  const classReceivablesQueries = useQueries({
    queries: rombels.map((rombel) => ({
      queryKey: ['reports', 'receivables', { rombongan_belajar_id: rombel.id }] as const,
      queryFn: () =>
        apiGet<ReceivablesReport>('/reports/receivables', {
          rombongan_belajar_id: rombel.id,
        }),
      staleTime: 60_000,
    })),
  })

  const classMetricsMap = useMemo(() => {
    const metrics = new Map<string, ClassMetrics>()
    rombels.forEach((rombel, index) => {
      const queryResult = classReceivablesQueries[index]
      const summary = queryResult?.data?.summary
      metrics.set(rombel.id, {
        totalBills: summary?.total_bills ?? 0,
        totalNet: summary?.total_net ?? 0,
        totalPaid: summary?.total_paid ?? 0,
        totalOutstanding: summary?.total_outstanding ?? 0,
      })
    })
    return metrics
  }, [classReceivablesQueries, rombels])

  const classMetricsLoading = classReceivablesQueries.some((query) => query.isLoading)

  const {
    data: studentsData,
    isLoading: studentsLoading,
    error: studentsError,
  } = useRefStudents(
    { rombongan_belajar_id: activeClassId, per_page: 100 },
    { enabled: !!activeClassId },
  )

  const {
    data: classBillsData,
    isLoading: classBillsLoading,
  } = useQuery({
    queryKey: ['bills', 'class', activeClassId],
    queryFn: async () => {
      const response = await apiGet<PaginatedResponse<Bill> | { data: PaginatedResponse<Bill> }>('/bills', {
        rombongan_belajar_id: activeClassId,
        per_page: 500,
      })
      return unwrapPaginated(response)
    },
    enabled: !!activeClassId,
  })

  const students = studentsData?.data ?? []
  const classBills = classBillsData?.data ?? []

  const studentSummaryMap = useMemo(() => {
    const map = new Map<string, StudentSummary>()
    const metrics = buildClassMetricsMap(classBills)

    for (const bill of classBills) {
      const current = map.get(bill.student_id) ?? { totalBills: 0, totalOutstanding: 0 }
      map.set(bill.student_id, {
        totalBills: current.totalBills + 1,
        totalOutstanding: current.totalOutstanding + bill.amount_outstanding,
      })
    }

    for (const student of students) {
      map.set(student.student_id, map.get(student.student_id) ?? { totalBills: 0, totalOutstanding: 0 })
    }

    if (metrics.size === 0) {
      return map
    }

    return map
  }, [classBills, students])

  const selectedClass = useMemo(() => rombels.find((rombel) => rombel.id === activeClassId) ?? null, [activeClassId, rombels])
  const selectedStudent = useMemo(
    () => students.find((student) => student.student_id === activeStudentId) ?? null,
    [activeStudentId, students],
  )

  const {
    data: billsData,
    isLoading: billsLoading,
    error: billsError,
  } = useStudentBills(activeStudentId, { per_page: 100 })

  const bills = billsData?.data ?? []

  const summary = useMemo(() => {
    const totalBills = bills.length
    const totalNet = bills.reduce((sum, bill) => sum + bill.amount_net, 0)
    const totalPaid = bills.reduce((sum, bill) => sum + bill.amount_paid, 0)
    const totalOutstanding = bills.reduce((sum, bill) => sum + bill.amount_outstanding, 0)
    return { totalBills, totalNet, totalPaid, totalOutstanding }
  }, [bills])

  const sppBills = useMemo(() => bills.filter((bill) => bill.fee_type?.billing_cycle === 'monthly'), [bills])
  const otherBills = useMemo(() => bills.filter((bill) => bill.fee_type?.billing_cycle !== 'monthly'), [bills])

  const sppByYear = useMemo(() => {
    const grouped = new Map<number, Map<number, Bill>>()

    for (const bill of sppBills) {
      if (!bill.period_year || !bill.period_month) {
        continue
      }

      let yearMap = grouped.get(bill.period_year)
      if (!yearMap) {
        yearMap = new Map<number, Bill>()
        grouped.set(bill.period_year, yearMap)
      }

      yearMap.set(bill.period_month, bill)
    }

    return [...grouped.entries()].sort(([a], [b]) => b - a)
  }, [sppBills])

  useEffect(() => {
    setOtherPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [otherBills.length, activeStudentId])

  const otherTableColumns = useMemo(() => [{ accessorKey: 'id' }], [])

  const otherTable = useReactTable({
    data: otherBills,
    columns: otherTableColumns,
    state: { pagination: otherPagination },
    onPaginationChange: setOtherPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const paginatedOtherBills = otherTable.getRowModel().rows.map((row) => row.original)

  const canPaySelectedBill = Boolean(selectedBill && selectedBill.status !== 'void' && selectedBill.amount_outstanding > 0)

  function selectClass(rombel: Rombel): void {
    if ((rombel.anggota_count ?? 0) === 0) {
      return
    }

    setActiveClassId(rombel.id)
    setActiveStudentId('')
    setSelectedBill(null)
    setBillToPay(null)
    navigate({
      to: '/dashboard/student-bills',
      search: { class_id: rombel.id },
      replace: true,
    })
  }

  function selectStudent(student: Student): void {
    if (!activeClassId) {
      return
    }

    setActiveStudentId(student.student_id)
    navigate({
      to: '/dashboard/student-bills',
      search: {
        class_id: activeClassId,
        student_id: student.student_id,
      },
      replace: true,
    })
  }

  function backToClasses(): void {
    setActiveClassId('')
    setActiveStudentId('')
    setSelectedBill(null)
    setBillToPay(null)
    navigate({ to: '/dashboard/student-bills', search: {}, replace: true })
  }

  function backToStudents(): void {
    if (!activeClassId) {
      backToClasses()
      return
    }

    setActiveStudentId('')
    setSelectedBill(null)
    setBillToPay(null)
    navigate({ to: '/dashboard/student-bills', search: { class_id: activeClassId }, replace: true })
  }

  function openBillDetail(bill: Bill): void {
    setSelectedBill(bill)
    detailModalState.open()
  }

  function openPaymentModalForBill(bill: Bill): void {
    setBillToPay({ ...bill })
    detailModalState.close()
    paymentModalState.open()
  }

  const showClassLayer = !activeClassId
  const showStudentLayer = Boolean(activeClassId) && !activeStudentId
  const showBillingLayer = Boolean(activeClassId) && Boolean(activeStudentId)

  return (
    <div className={pageShellClass}>
      <PageHeader title="Tagihan Siswa" description="Alur kelas ke siswa untuk melihat dan membayar tagihan." />

      {showClassLayer && (
        <>
          {rombelsLoading ? (
            <LoadingState minHeight="300px" />
          ) : rombelsError ? (
            <ErrorState message="Gagal memuat daftar kelas." detail="Silakan coba lagi dalam beberapa saat." />
          ) : (
            <div data-testid="class-cards-grid" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rombels.map((rombel) => {
                const metrics = classMetricsMap.get(rombel.id)
                const activeStudents = rombel.anggota_count ?? 0
                const isDisabled = activeStudents === 0
                const label = getRombelLabel(rombel)

                return (
                  <Button
                    key={rombel.id}
                    data-testid="class-card"
                    data-active-students={String(activeStudents)}
                    variant="secondary"
                    fullWidth
                    isDisabled={isDisabled}
                    className="h-auto p-0"
                    onPress={() => selectClass(rombel)}
                  >
                    <Card className={`${surfaceCardClass} w-full ${isDisabled ? 'opacity-60' : ''}`}>
                      <Card.Header className={cardHeaderClass}>
                        <div className="flex w-full items-start justify-between gap-3 text-left">
                          <div>
                            <p className="text-lg font-semibold text-foreground">{label}</p>
                            <p data-testid="class-card-level" className="text-xs text-default-500">
                              Jenjang {rombel.tingkat_kelas ?? '-'}
                            </p>
                          </div>
                          <Chip size="sm" variant="soft" color={isDisabled ? 'default' : 'accent'}>
                            <Chip.Label data-testid="metric-active-students">{activeStudents} siswa</Chip.Label>
                          </Chip>
                        </div>
                      </Card.Header>
                      <Card.Content className="space-y-2 px-4 pb-4 text-left sm:px-5 sm:pb-5">
                        <MetricRow label="Total Tagihan Netto" value={formatCurrency(metrics?.totalNet ?? 0)} testId="metric-total-net" />
                        <MetricRow label="Total Terbayar" value={formatCurrency(metrics?.totalPaid ?? 0)} testId="metric-total-paid" />
                        <MetricRow
                          label="Total Outstanding"
                          value={formatCurrency(metrics?.totalOutstanding ?? 0)}
                          valueClass={(metrics?.totalOutstanding ?? 0) > 0 ? 'text-danger' : 'text-success'}
                          testId="metric-total-outstanding"
                        />
                        {classMetricsLoading && (
                          <div className="flex items-center gap-2 text-xs text-default-500">
                            <Spinner size="sm" />
                            Menyegarkan nominal kelas...
                          </div>
                        )}
                      </Card.Content>
                    </Card>
                  </Button>
                )
              })}
            </div>
          )}
        </>
      )}

      {showStudentLayer && (
        <>
          <Card className={surfaceCardClass}>
            <Card.Header className={cardHeaderClass}>
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-default-500">Kelas Terpilih</p>
                  <p data-testid="selected-class-name" className="text-lg font-semibold">
                    {selectedClass ? getRombelLabel(selectedClass) : '-'}
                  </p>
                </div>
                <Button data-testid="back-to-classes" variant="secondary" onPress={backToClasses}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
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
                      <Button
                        key={student.student_id}
                        data-testid="student-list-item"
                        variant="secondary"
                        fullWidth
                        className="h-auto justify-start px-4 py-3 text-left sm:px-5"
                        onPress={() => selectStudent(student)}
                      >
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-foreground">{student.fullname}</p>
                            <p className="text-xs text-default-500">{student.nipd || student.nisn || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="soft" color="default">
                              <Chip.Label>{studentSummary.totalBills} tagihan</Chip.Label>
                            </Chip>
                            <Chip size="sm" variant="soft" color={studentSummary.totalOutstanding > 0 ? 'danger' : 'success'}>
                              <Chip.Label>{formatCurrency(studentSummary.totalOutstanding)}</Chip.Label>
                            </Chip>
                          </div>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              )}
            </Card.Content>
          </Card>
        </>
      )}

      {showBillingLayer && (
        <>
          <Card className={surfaceCardClass}>
            <Card.Header className={cardHeaderClass}>
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-default-500">Siswa Terpilih</p>
                  <p data-testid="selected-student-name" className="text-lg font-semibold">
                    {selectedStudent?.fullname ?? '-'}
                  </p>
                  <p className="text-xs text-default-500">{selectedStudent?.nipd || selectedStudent?.nisn || '-'}</p>
                </div>
                <Button data-testid="back-to-students" variant="secondary" onPress={backToStudents}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Daftar Siswa
                </Button>
              </div>
            </Card.Header>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard icon={Receipt} iconBgClass="bg-accent-soft" iconColorClass="text-accent" label="Total Tagihan" value={String(summary.totalBills)} />
            <SummaryCard icon={Wallet} iconBgClass="bg-success/15" iconColorClass="text-success" label="Total Netto" value={formatCurrency(summary.totalNet)} />
            <SummaryCard icon={CheckCircle2} iconBgClass="bg-accent/15" iconColorClass="text-accent" label="Sudah Dibayar" value={formatCurrency(summary.totalPaid)} />
            <SummaryCard icon={BookOpen} iconBgClass="bg-danger/15" iconColorClass="text-danger" label="Sisa Piutang" value={formatCurrency(summary.totalOutstanding)} />
          </div>

          {billsLoading ? (
            <LoadingState minHeight="320px" />
          ) : billsError ? (
            <ErrorState message="Gagal memuat tagihan siswa." detail="Silakan kembali ke daftar siswa lalu coba lagi." />
          ) : (
            <div data-testid="billing-detail-view" className="space-y-4">
              <Card className={surfaceCardClass}>
                <Card.Header className={cardHeaderClass}>
                  <div className="flex w-full items-center justify-between gap-2">
                    <p className="font-medium">Tagihan Utama SPP</p>
                    <Chip size="sm" variant="soft" color="accent">
                      <Chip.Label>{sppBills.length} tagihan</Chip.Label>
                    </Chip>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div data-testid="section-spp-primary" className="space-y-4">
                    {sppByYear.length === 0 ? (
                      <div data-testid="section-spp-primary-empty">
                        <EmptyState icon={Calendar} message="Belum ada tagihan SPP untuk siswa ini." />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {sppByYear.map(([year, monthMap]) => (
                          <div key={year} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-accent" />
                              <h2 className="text-base font-semibold">Tahun {year}</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
                              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                                const bill = monthMap.get(month)
                                if (!bill) {
                                  return (
                                    <div
                                      key={month}
                                      className="rounded-2xl border border-border/40 bg-surface/30 p-3 text-center opacity-40"
                                    >
                                      <p className="text-xs font-medium text-default-500">{MONTH_NAMES[month - 1]}</p>
                                      <p className="mt-1 text-[10px] text-default-500">-</p>
                                    </div>
                                  )
                                }

                                const isPaid = bill.status === 'paid'
                                const isPartial = bill.status === 'partial'
                                const statusClasses = isPaid
                                  ? 'border-success/40 bg-success/10'
                                  : isPartial
                                    ? 'border-warning/40 bg-warning/10'
                                    : bill.status === 'void'
                                      ? 'border-border/40 bg-surface/30 opacity-70'
                                      : 'border-danger/40 bg-danger/5'

                                const statusTextClass = isPaid
                                  ? 'text-success'
                                  : isPartial
                                    ? 'text-warning'
                                    : bill.status === 'void'
                                      ? 'text-default-500'
                                      : 'text-danger'

                                return (
                                  <Button
                                    key={month}
                                    data-testid="spp-bill-item"
                                    variant="secondary"
                                    className={`h-auto min-h-[84px] w-full border ${statusClasses} px-2 py-3`}
                                    onPress={() => openBillDetail(bill)}
                                  >
                                    <div className="flex flex-col items-center gap-1.5">
                                      <span className={`text-xs font-semibold ${statusTextClass}`}>{MONTH_NAMES[month - 1]}</span>
                                      {isPaid ? (
                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                      ) : (
                                        <span className={`text-[10px] font-medium ${statusTextClass}`}>
                                          {billStatusConfig[bill.status].label}
                                        </span>
                                      )}
                                    </div>
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card.Content>
              </Card>

              <Card className={surfaceCardClass}>
                <Card.Header className={cardHeaderClass}>
                  <div className="flex w-full items-center justify-between gap-2">
                    <p className="font-medium">Tagihan Lainnya</p>
                    <Chip size="sm" variant="soft" color="default">
                      <Chip.Label>{otherBills.length} tagihan</Chip.Label>
                    </Chip>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div data-testid="section-other-bills" className="space-y-2">
                    {otherBills.length === 0 ? (
                      <EmptyState icon={Receipt} message="Tidak ada tagihan selain SPP untuk siswa ini." />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-t border-border/70">
                              <th className={tableHeadCellClass}>No. Tagihan</th>
                              <th className={tableHeadCellClass}>Judul</th>
                              <th className={tableHeadCellClass}>Jenis</th>
                              <th className={tableHeadCellClass}>Netto</th>
                              <th className={`${tableHeadCellClass} hidden md:table-cell`}>Sisa</th>
                              <th className={tableHeadCellClass}>Status</th>
                              <th className={tableHeadCellClass}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedOtherBills.map((bill) => (
                              <tr key={bill.id} className="border-t border-border/50 transition-colors hover:bg-surface/60">
                                <td className={tableBodyCellClass}>
                                  <p className="font-mono text-xs">{bill.bill_number}</p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <p className="max-w-[220px] truncate font-medium text-default-700">{bill.title}</p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Chip size="sm" variant="soft" color="default">
                                    <Chip.Label>{bill.fee_type?.name ?? '-'}</Chip.Label>
                                  </Chip>
                                </td>
                                <td className={`${tableBodyCellClass} font-semibold`}>{formatCurrency(bill.amount_net)}</td>
                                <td className={`${tableBodyCellClass} hidden text-danger md:table-cell`}>
                                  {formatCurrency(bill.amount_outstanding)}
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Chip size="sm" variant="soft" color={billStatusConfig[bill.status].color}>
                                    <Chip.Label>{billStatusConfig[bill.status].label}</Chip.Label>
                                  </Chip>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    isIconOnly
                                    aria-label="Lihat detail tagihan"
                                    onPress={() => openBillDetail(bill)}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <TablePagination
                          pageIndex={otherPagination.pageIndex}
                          pageCount={otherTable.getPageCount()}
                          pageSize={otherPagination.pageSize}
                          totalRows={otherBills.length}
                          visibleRows={paginatedOtherBills.length}
                          canPreviousPage={otherTable.getCanPreviousPage()}
                          canNextPage={otherTable.getCanNextPage()}
                          onPreviousPage={() => otherTable.previousPage()}
                          onNextPage={() => otherTable.nextPage()}
                        />
                      </div>
                    )}
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}
        </>
      )}

      <BillDetailModal
        bill={selectedBill}
        state={detailModalState}
        canPay={canPaySelectedBill}
        onPay={openPaymentModalForBill}
      />

      <PaymentModal state={paymentModalState} bill={billToPay} onSuccess={() => setBillToPay(null)} />
    </div>
  )
}

function MetricRow({
  label,
  value,
  valueClass,
  testId,
}: {
  label: string
  value: string
  valueClass?: string
  testId?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-default-500">{label}</p>
      <p data-testid={testId} className={`text-sm font-semibold ${valueClass ?? 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  label,
  value,
}: {
  icon: typeof Receipt
  iconBgClass: string
  iconColorClass: string
  label: string
  value: string
}) {
  return (
    <Card className={surfaceCardClass}>
      <Card.Content className="flex items-center gap-3 p-4 sm:p-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconBgClass}`}>
          <Icon className={`h-5 w-5 ${iconColorClass}`} />
        </div>
        <div>
          <p className="text-sm text-default-500">{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </Card.Content>
    </Card>
  )
}
