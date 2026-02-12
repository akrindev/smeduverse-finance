import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { BillDetailModal } from '@/components/student-bills/bill-detail-modal'
import { PaymentModal } from '@/components/student-bills/payment-modal'
import { useStudentBills } from '@/hooks/use-bills'
import { useRefStudent } from '@/hooks/use-references'
import { formatCurrency } from '@/lib/format'
import { cardHeaderClass, surfaceCardClass, tableBodyCellClass, tableHeadCellClass } from '@/lib/page-styles'
import { billStatusConfig, MONTH_NAMES } from '@/lib/student-bills'
import { TablePagination } from '@/lib/table-pagination'
import type { Bill } from '@/types/finance'
import { Button, Card, Spinner, useOverlayState } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ExternalLink, Receipt, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/dashboard/student-bills/$classId/$studentId')({
  component: StudentDetailPage,
})

function StudentDetailPage() {
  const { classId, studentId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [billToPay, setBillToPay] = useState<Bill | null>(null)
  const [otherPagination, setOtherPagination] = useState({ pageIndex: 0, pageSize: 15 })
  const detailModalState = useOverlayState()
  const paymentModalState = useOverlayState()

  const { data: selectedStudent, isLoading: studentLoading } = useRefStudent(studentId)

  const {
    data: allBillsData,
    isLoading: allBillsLoading,
    isFetching: allBillsFetching,
  } = useStudentBills(studentId, { per_page: 500 })

  const {
    data: paginatedBillsData,
    isLoading: paginatedBillsLoading,
    isPlaceholderData,
    isFetching: paginatedBillsFetching,
    error: billsError,
  } = useStudentBills(studentId, {
    page: otherPagination.pageIndex + 1,
    per_page: otherPagination.pageSize,
  })

  const allBills = allBillsData?.data ?? []
  const paginatedBills = paginatedBillsData?.data ?? []
  const meta = paginatedBillsData?.meta

  const summary = useMemo(() => {
    const totalBills = allBills.length
    const totalNet = allBills.reduce((sum, bill) => sum + bill.amount_net, 0)
    const totalPaid = allBills.reduce((sum, bill) => sum + bill.amount_paid, 0)
    const totalOutstanding = allBills.reduce((sum, bill) => sum + bill.amount_outstanding, 0)
    return { totalBills, totalNet, totalPaid, totalOutstanding }
  }, [allBills])

  const sppBills = useMemo(() => allBills.filter((bill) => bill.fee_type?.billing_cycle === 'monthly'), [allBills])
  const otherBills = useMemo(() => paginatedBills.filter((bill) => bill.fee_type?.billing_cycle !== 'monthly'), [paginatedBills])

  const sppByYear = useMemo(() => {
    const grouped = new Map<number, Map<number, Bill>>()
    for (const bill of sppBills) {
      if (!bill.period_year || !bill.period_month) continue
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
  }, [studentId])

  const otherTableColumns = useMemo(() => [{ accessorKey: 'id' }], [])

  const otherTable = useReactTable({
    data: otherBills,
    columns: otherTableColumns,
    pageCount: meta?.last_page ?? -1,
    state: { pagination: otherPagination },
    onPaginationChange: setOtherPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  const billsLoading = allBillsLoading || (paginatedBillsLoading && !isPlaceholderData)

  const paginatedOtherBills = otherBills

  const canPaySelectedBill = Boolean(selectedBill && selectedBill.status !== 'void' && selectedBill.amount_outstanding > 0)

  function backToStudents(): void {
    navigate({
      to: '/dashboard/student-bills/$classId',
      params: { classId },
      replace: true,
    })
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

  return (
    <div className="space-y-6">
      <Card className={surfaceCardClass}>
        <Card.Header className={cardHeaderClass}>
          <div className="flex flex-wrap justify-between items-center gap-2 w-full">
            <div>
              <p className="text-default-500 text-sm">Siswa Terpilih</p>
              <p data-testid="selected-student-name" className="font-semibold text-lg">
                {selectedStudent?.fullname ?? (studentLoading ? 'Memuat...' : '-')}
              </p>
              <p className="text-default-500 text-xs">{selectedStudent?.nipd || selectedStudent?.nisn || '-'}</p>
            </div>
            <Button
              variant="secondary"
              onPress={backToStudents}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Kembali ke Daftar Siswa
            </Button>
          </div>
        </Card.Header>
      </Card>

      <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
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
              <div className="flex justify-between items-center gap-2 w-full">
                <p className="font-medium">Tagihan Utama SPP</p>
                <div className="bg-accent/10 px-2 py-0.5 rounded-full text-accent text-xs">
                  {sppBills.length} tagihan
                </div>
              </div>
            </Card.Header>
            <Card.Content className="relative">
              {allBillsFetching && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px] transition-opacity">
                  <Spinner size="lg" />
                </div>
              )}
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
                          <Calendar className="w-4 h-4 text-accent" />
                          <h2 className="font-semibold text-base">Tahun {year}</h2>
                        </div>
                        <div className="gap-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
                          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                            const bill = monthMap.get(month)
                            if (!bill) {
                              return (
                                <div
                                  key={month}
                                  className="bg-surface/30 opacity-40 p-3 border border-border/40 rounded-2xl text-center"
                                >
                                  <p className="font-medium text-default-500 text-xs">{MONTH_NAMES[month - 1]}</p>
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
                                    <CheckCircle2 className="w-4 h-4 text-success" />
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
              <div className="flex justify-between items-center gap-2 w-full">
                <p className="font-medium">Tagihan Lainnya</p>
                <div className="bg-default/10 px-2 py-0.5 rounded-full text-default-600 text-xs">
                  {otherBills.length} tagihan
                </div>
              </div>
            </Card.Header>
            <Card.Content className="relative min-h-[200px]">
              {paginatedBillsFetching && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px] transition-opacity">
                  <Spinner size="lg" />
                </div>
              )}
              <div data-testid="section-other-bills" className="space-y-2">
                {otherBills.length === 0 ? (
                  <EmptyState icon={Receipt} message="Tidak ada tagihan selain SPP untuk siswa ini." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-border/70 border-t">
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
                          <tr key={bill.id} className="hover:bg-surface/60 border-border/50 border-t transition-colors">
                            <td className={tableBodyCellClass}>
                              <p className="font-mono text-xs">{bill.bill_number}</p>
                            </td>
                            <td className={tableBodyCellClass}>
                              <p className="max-w-[220px] font-medium text-default-700 truncate">{bill.title}</p>
                            </td>
                            <td className={tableBodyCellClass}>
                              <div className="bg-default/10 px-2 py-0.5 rounded-full text-default-600 text-[10px] inline-block">
                                {bill.fee_type?.name ?? '-'}
                              </div>
                            </td>
                            <td className={`${tableBodyCellClass} font-semibold`}>{formatCurrency(bill.amount_net)}</td>
                            <td className={`${tableBodyCellClass} hidden text-danger md:table-cell`}>
                              {formatCurrency(bill.amount_outstanding)}
                            </td>
                            <td className={tableBodyCellClass}>
                              {(() => {
                                const config = billStatusConfig[bill.status]
                                const colorMap = {
                                  success: 'bg-success/10 text-success',
                                  warning: 'bg-warning/10 text-warning',
                                  danger: 'bg-danger/10 text-danger',
                                  default: 'bg-default/10 text-default-600',
                                }
                                return (
                                  <div className={`px-2 py-0.5 rounded-full text-[10px] inline-block ${colorMap[config.color]}`}>
                                    {config.label}
                                  </div>
                                )
                              })()}
                            </td>
                            <td className={tableBodyCellClass}>
                              <Button
                                size="sm"
                                variant="ghost"
                                isIconOnly
                                aria-label="Lihat detail tagihan"
                                onPress={() => openBillDetail(bill)}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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
                      totalRows={meta?.total ?? 0}
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

      <BillDetailModal
        bill={selectedBill}
        state={detailModalState}
        canPay={canPaySelectedBill}
        onPay={openPaymentModalForBill}
      />

      <PaymentModal state={paymentModalState} bill={billToPay} onSuccess={() => {
        setBillToPay(null)
        queryClient.invalidateQueries({ queryKey: ['bills'] })
      }} />
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
    <Card className="border border-border/50 shadow-sm bg-surface/50 backdrop-blur-sm">
      <Card.Content className="flex items-center gap-4">
        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBgClass} ${iconColorClass} shadow-inner`}>
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-xs font-medium text-default-500 uppercase tracking-wider truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold tracking-tight truncate text-foreground">{value}</p>
        </div>
      </Card.Content>
    </Card>
  )
}

