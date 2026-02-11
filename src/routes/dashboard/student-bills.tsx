import {
  Button,
  Card,
  Chip,
  Input,
  Spinner,
  Tabs,
  TextField,
  useOverlayState,
} from '@heroui/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { BookOpen, Calendar, CheckCircle2, CreditCard, ExternalLink, Receipt, Search, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BillDetailModal } from '@/components/student-bills/bill-detail-modal'
import { PaymentModal } from '@/components/student-bills/payment-modal'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { useBills, useStudentBills } from '@/hooks/use-bills'
import { formatCurrency } from '@/lib/format'
import {
  billStatusConfig,
  MONTH_NAMES,
} from '@/lib/student-bills'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import type { Bill } from '@/types/finance'

interface SearchParams {
  student_id?: string
}

interface StudentLookupItem {
  student_id: string
  fullname: string
  nipd: string | null
  nisn: string | null
}

export const Route = createFileRoute('/dashboard/student-bills')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    student_id: typeof search.student_id === 'string' ? search.student_id : undefined,
  }),
  component: StudentBillsPage,
})

function StudentBillsPage() {
  const { student_id: paramStudentId } = Route.useSearch()
  const navigate = useNavigate()

  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeStudentId, setActiveStudentId] = useState(paramStudentId ?? '')
  const [activeTab, setActiveTab] = useState<'spp' | 'other'>('spp')
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [billToPay, setBillToPay] = useState<Bill | null>(null)
  const [otherPagination, setOtherPagination] = useState({ pageIndex: 0, pageSize: 8 })
  const detailModalState = useOverlayState()
  const paymentModalState = useOverlayState()

  useEffect(() => {
    setActiveStudentId(paramStudentId ?? '')
  }, [paramStudentId])

  const { data: billsLookupData, isLoading: studentLookupLoading } = useBills({ per_page: 100 })
  const { data: billsData, isLoading: billsLoading, error: billsError } = useStudentBills(activeStudentId, { per_page: 100 })

  const allBills = billsLookupData?.data ?? []
  const bills = billsData?.data ?? []

  const lookupStudents = useMemo<StudentLookupItem[]>(() => {
    const byId = new Map<string, StudentLookupItem>()
    for (const bill of allBills) {
      if (!bill.student || byId.has(bill.student_id)) {
        continue
      }

      byId.set(bill.student_id, {
        student_id: bill.student_id,
        fullname: bill.student.fullname,
        nipd: bill.student.nipd,
        nisn: bill.student.nisn,
      })
    }

    return [...byId.values()]
  }, [allBills])

  const matchedStudents = useMemo(() => {
    const query = searchKeyword.trim().toLowerCase()
    if (query.length < 2) {
      return []
    }

    return lookupStudents
      .filter((student) =>
        student.fullname.toLowerCase().includes(query) ||
        student.nipd?.toLowerCase().includes(query) ||
        student.nisn?.toLowerCase().includes(query),
      )
      .slice(0, 10)
  }, [lookupStudents, searchKeyword])

  const selectedStudentFromLookup = useMemo(
    () => lookupStudents.find((student) => student.student_id === activeStudentId) ?? null,
    [activeStudentId, lookupStudents],
  )

  const studentName = useMemo(() => {
    const bill = bills.find((item) => item.student)
    if (bill?.student) {
      return bill.student.fullname
    }

    return selectedStudentFromLookup?.fullname ?? null
  }, [bills, selectedStudentFromLookup])

  const sppBills = useMemo(() => bills.filter((bill) => bill.fee_type?.billing_cycle === 'monthly'), [bills])
  const otherBills = useMemo(() => bills.filter((bill) => bill.fee_type?.billing_cycle !== 'monthly'), [bills])

  const summary = useMemo(() => {
    const totalBills = bills.length
    const totalNet = bills.reduce((sum, bill) => sum + bill.amount_net, 0)
    const totalPaid = bills.reduce((sum, bill) => sum + bill.amount_paid, 0)
    const totalOutstanding = bills.reduce((sum, bill) => sum + bill.amount_outstanding, 0)
    return { totalBills, totalNet, totalPaid, totalOutstanding }
  }, [bills])

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

  function selectStudent(studentId: string): void {
    setActiveStudentId(studentId)
    setSearchKeyword('')
    navigate({ to: '/dashboard/student-bills', search: { student_id: studentId }, replace: true })
  }

  function clearSelectedStudent(): void {
    setActiveStudentId('')
    setSearchKeyword('')
    setSelectedBill(null)
    setBillToPay(null)
    navigate({ to: '/dashboard/student-bills', search: {}, replace: true })
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

  const canPaySelectedBill = Boolean(selectedBill && selectedBill.status !== 'void' && selectedBill.amount_outstanding > 0)

  return (
    <div className={pageShellClass}>
      <PageHeader title="Tagihan Siswa" description="Lihat tagihan SPP dan tagihan lainnya per siswa." />

      <Card className={surfaceCardClass}>
        <Card.Content className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <TextField fullWidth>
                <Input
                  aria-label="Cari siswa"
                  placeholder="Cari nama siswa, NIPD, atau NISN"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && matchedStudents.length > 0) {
                      selectStudent(matchedStudents[0].student_id)
                    }
                  }}
                />
              </TextField>
            </div>
            {activeStudentId && (
              <Button variant="secondary" onPress={clearSelectedStudent}>
                Ganti Siswa
              </Button>
            )}
          </div>

          {!activeStudentId && searchKeyword.trim().length >= 2 && (
            <div className="space-y-2">
              {studentLookupLoading ? (
                <div className="flex items-center gap-2 text-sm text-default-500">
                  <Spinner size="sm" />
                  Mencari siswa...
                </div>
              ) : matchedStudents.length === 0 ? (
                <p className="text-sm text-default-500">Siswa tidak ditemukan.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {matchedStudents.map((student) => (
                    <Button
                      key={student.student_id}
                      variant="secondary"
                      className="justify-start h-auto py-3"
                      onPress={() => selectStudent(student.student_id)}
                    >
                      <div className="text-left">
                        <p className="font-medium text-foreground">{student.fullname}</p>
                        <p className="text-xs text-default-500">{student.nipd || student.nisn || '-'}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeStudentId && studentName && (
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>{studentName}</Chip.Label>
              </Chip>
              {(selectedStudentFromLookup?.nipd || selectedStudentFromLookup?.nisn) && (
                <span className="text-xs text-default-500">{selectedStudentFromLookup?.nipd || selectedStudentFromLookup?.nisn}</span>
              )}
            </div>
          )}
        </Card.Content>
      </Card>

      {!activeStudentId && (
        <Card className={surfaceCardClass}>
          <Card.Content>
            <EmptyState icon={Search} message="Cari siswa dengan nama, NIPD, atau NISN." />
          </Card.Content>
        </Card>
      )}

      {activeStudentId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={Receipt}
              iconBgClass="bg-accent-soft"
              iconColorClass="text-accent"
              label="Total Tagihan"
              value={summary.totalBills}
            />
            <StatCard
              icon={Wallet}
              iconBgClass="bg-success/15"
              iconColorClass="text-success"
              label="Total Netto"
              value={formatCurrency(summary.totalNet)}
            />
            <StatCard
              icon={CreditCard}
              iconBgClass="bg-accent/15"
              iconColorClass="text-accent"
              label="Sudah Dibayar"
              value={formatCurrency(summary.totalPaid)}
            />
            <StatCard
              icon={BookOpen}
              iconBgClass="bg-danger/15"
              iconColorClass="text-danger"
              label="Sisa Piutang"
              value={formatCurrency(summary.totalOutstanding)}
            />
          </div>

          {billsLoading ? (
            <LoadingState minHeight="300px" />
          ) : billsError ? (
            <ErrorState message="Gagal memuat data tagihan siswa." detail="Silakan pilih siswa lain." />
          ) : (
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key === 'other' ? 'other' : 'spp')}
              className="w-full"
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label="Jenis tagihan">
                  <Tabs.Tab id="spp">
                    <span className="flex items-center gap-2">
                      Tagihan SPP
                      {sppBills.length > 0 && (
                        <Chip size="sm" variant="soft" color="accent">
                          <Chip.Label>{sppBills.length}</Chip.Label>
                        </Chip>
                      )}
                    </span>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="other">
                    <span className="flex items-center gap-2">
                      Tagihan Lainnya
                      {otherBills.length > 0 && (
                        <Chip size="sm" variant="soft" color="default">
                          <Chip.Label>{otherBills.length}</Chip.Label>
                        </Chip>
                      )}
                    </span>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel id="spp" className="mt-6">
                {sppByYear.length === 0 ? (
                  <Card className={surfaceCardClass}>
                    <Card.Content>
                      <EmptyState icon={Calendar} message="Belum ada tagihan SPP untuk siswa ini." />
                    </Card.Content>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {sppByYear.map(([year, monthMap]) => (
                      <div key={year} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-accent" />
                          <h2 className="text-base font-semibold">Tahun {year}</h2>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => {
                            const bill = monthMap.get(month)

                            if (!bill) {
                              return (
                                <div
                                  key={month}
                                  className="rounded-2xl border border-border/40 bg-surface/30 p-3 text-center opacity-40"
                                >
                                  <p className="text-xs font-medium text-default-500">{MONTH_NAMES[month - 1]}</p>
                                  <p className="text-[10px] text-default-500 mt-1">-</p>
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
              </Tabs.Panel>

              <Tabs.Panel id="other" className="mt-6">
                {otherBills.length === 0 ? (
                  <Card className={surfaceCardClass}>
                    <Card.Content>
                      <EmptyState icon={Receipt} message="Tidak ada tagihan lainnya untuk siswa ini." />
                    </Card.Content>
                  </Card>
                ) : (
                  <Card className={surfaceCardClass}>
                    <Card.Header className={cardHeaderClass}>
                      <div className="flex items-center justify-between w-full">
                        <p className="font-medium">Tagihan Non-SPP</p>
                        <Chip size="sm" variant="soft" color="default">
                          <Chip.Label>{otherBills.length} tagihan</Chip.Label>
                        </Chip>
                      </div>
                    </Card.Header>
                    <Card.Content className="px-0 pb-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-t border-border/70">
                              <th className={tableHeadCellClass}>No. Tagihan</th>
                              <th className={tableHeadCellClass}>Judul</th>
                              <th className={tableHeadCellClass}>Jenis</th>
                              <th className={tableHeadCellClass}>Netto</th>
                              <th className={`${tableHeadCellClass} hidden md:table-cell`}>Sisa</th>
                              <th className={tableHeadCellClass}>Jatuh Tempo</th>
                              <th className={tableHeadCellClass}>Status</th>
                              <th className={tableHeadCellClass}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedOtherBills.map((bill) => (
                              <tr key={bill.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                                <td className={tableBodyCellClass}>
                                  <p className="font-mono text-xs">{bill.bill_number}</p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <p className="font-medium text-default-700 max-w-[220px] truncate">{bill.title}</p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Chip size="sm" variant="soft" color="default">
                                    <Chip.Label>{bill.fee_type?.name ?? '-'}</Chip.Label>
                                  </Chip>
                                </td>
                                <td className={`${tableBodyCellClass} font-semibold`}>{formatCurrency(bill.amount_net)}</td>
                                <td className={`${tableBodyCellClass} hidden md:table-cell text-danger`}>
                                  {formatCurrency(bill.amount_outstanding)}
                                </td>
                                <td className={tableBodyCellClass}>
                                  <span className="text-xs">{bill.due_date ?? '-'}</span>
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
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

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
                    </Card.Content>
                  </Card>
                )}
              </Tabs.Panel>
            </Tabs>
          )}
        </>
      )}

      <BillDetailModal
        bill={selectedBill}
        state={detailModalState}
        canPay={canPaySelectedBill}
        onPay={openPaymentModalForBill}
      />

      <PaymentModal
        state={paymentModalState}
        bill={billToPay}
        onSuccess={() => setBillToPay(null)}
      />
    </div>
  )
}
