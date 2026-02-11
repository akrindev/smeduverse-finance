import {
  Button,
  Card,
  Chip,
  Input,
  ListBox,
  Modal,
  Select,
  Separator,
  Spinner,
  Tabs,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from '@heroui/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Controller, useForm } from 'react-hook-form'
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Receipt,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useBills, useStudentBills } from '@/hooks/use-bills'
import { useCreatePayment } from '@/hooks/use-payments'
import { ApiResponseError } from '@/lib/api-client'
import {
  cardHeaderClass,
  pageHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import type { Bill, BillStatus, PaymentMethod } from '@/types/finance'

interface SearchParams {
  student_id?: string
}

interface StudentLookupItem {
  student_id: string
  fullname: string
  nipd: string | null
  nisn: string | null
}

interface CreatePaymentFormValues {
  payment_date: string
  total_amount: string
  payment_method: PaymentMethod
  reference_number: string
  notes: string
}

export const Route = createFileRoute('/dashboard/student-bills')({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    student_id: typeof search.student_id === 'string' ? search.student_id : undefined,
  }),
  component: StudentBillsPage,
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID')
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function firstValidationMessage(errors?: Record<string, string[]>): string | null {
  if (!errors) {
    return null
  }

  for (const messages of Object.values(errors)) {
    if (messages.length > 0) {
      return messages[0]
    }
  }

  return null
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const statusConfig: Record<BillStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'default' }> = {
  paid: { label: 'Lunas', color: 'success' },
  partial: { label: 'Sebagian', color: 'warning' },
  unpaid: { label: 'Belum Bayar', color: 'danger' },
  void: { label: 'Void', color: 'default' },
}

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

  const paymentForm = useForm<CreatePaymentFormValues>({
    defaultValues: {
      payment_date: todayDateString(),
      total_amount: '',
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    },
  })

  const createPayment = useCreatePayment()

  useEffect(() => {
    setActiveStudentId(paramStudentId ?? '')
  }, [paramStudentId])

  const { data: billsLookupData, isLoading: studentLookupLoading } = useBills({ per_page: 100 })

  const {
    data: billsData,
    isLoading: billsLoading,
    error: billsError,
  } = useStudentBills(activeStudentId, { per_page: 100 })

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

  const sppBills = useMemo(
    () => bills.filter((bill) => bill.fee_type?.billing_cycle === 'monthly'),
    [bills],
  )

  const otherBills = useMemo(
    () => bills.filter((bill) => bill.fee_type?.billing_cycle !== 'monthly'),
    [bills],
  )

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
    navigate({
      to: '/dashboard/student-bills',
      search: { student_id: studentId },
      replace: true,
    })
  }

  function clearSelectedStudent(): void {
    setActiveStudentId('')
    setSearchKeyword('')
    setSelectedBill(null)
    navigate({
      to: '/dashboard/student-bills',
      search: {},
      replace: true,
    })
  }

  function openBillDetail(bill: Bill): void {
    setSelectedBill(bill)
    detailModalState.open()
  }

  function openPaymentModalForBill(bill: Bill): void {
    setBillToPay(bill)
    paymentForm.reset({
      payment_date: todayDateString(),
      total_amount: String(bill.amount_outstanding),
      payment_method: 'cash',
      reference_number: '',
      notes: `Pembayaran untuk ${bill.title}`,
    })
    detailModalState.close()
    paymentModalState.open()
  }

  const submitPayment = paymentForm.handleSubmit(async (values) => {
    if (!billToPay) {
      toast.danger('Tagihan belum dipilih.')
      return
    }

    const amount = Number(values.total_amount)
    if (!Number.isFinite(amount) || amount < 1) {
      paymentForm.setError('total_amount', {
        message: 'Nominal pembayaran harus lebih dari 0',
      })
      return
    }

    if (amount > billToPay.amount_outstanding) {
      paymentForm.setError('total_amount', {
        message: 'Nominal melebihi sisa tagihan',
      })
      return
    }

    try {
      await createPayment.mutateAsync({
        student_id: billToPay.student_id,
        payment_date: values.payment_date,
        total_amount: amount,
        payment_method: values.payment_method,
        reference_number: values.reference_number || undefined,
        notes: values.notes || undefined,
        auto_allocate: false,
        allocations: [
          {
            finance_bill_id: billToPay.id,
            allocated_amount: amount,
            notes: `Pembayaran ${billToPay.bill_number}`,
          },
        ],
      })

      toast.success('Pembayaran berhasil disimpan.')
      paymentModalState.close()
      setBillToPay(null)
      paymentForm.reset({
        payment_date: todayDateString(),
        total_amount: '',
        payment_method: 'cash',
        reference_number: '',
        notes: '',
      })
    } catch (err) {
      if (err instanceof ApiResponseError) {
        const message = firstValidationMessage(err.errors) ?? err.message
        toast.danger(message)
      } else {
        toast.danger('Gagal menyimpan pembayaran.')
      }
    }
  })

  const canPaySelectedBill = Boolean(
    selectedBill && selectedBill.status !== 'void' && selectedBill.amount_outstanding > 0,
  )

  return (
    <div className={pageShellClass}>
      <div className={pageHeaderClass}>
        <div>
          <h1 className="text-2xl font-semibold">Tagihan Siswa</h1>
          <p className="text-sm text-default-500 mt-1">
            Lihat tagihan SPP dan tagihan lainnya per siswa.
          </p>
        </div>
      </div>

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
                        <p className="text-xs text-default-500">
                          {student.nipd || student.nisn || '-'}
                        </p>
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
                <span className="text-xs text-default-500">
                  {selectedStudentFromLookup?.nipd || selectedStudentFromLookup?.nisn}
                </span>
              )}
            </div>
          )}
        </Card.Content>
      </Card>

      {!activeStudentId && (
        <Card className={surfaceCardClass}>
          <Card.Content className="py-16 text-center">
            <Search className="w-10 h-10 text-default-300 mx-auto mb-3" />
            <p className="text-default-500">Cari siswa dengan nama, NIPD, atau NISN.</p>
          </Card.Content>
        </Card>
      )}

      {activeStudentId && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className={surfaceCardClass}>
              <Card.Content className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-default-500">Total Tagihan</p>
                  <p className="text-xl font-semibold">{summary.totalBills}</p>
                </div>
              </Card.Content>
            </Card>
            <Card className={surfaceCardClass}>
              <Card.Content className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-success/15 text-success flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-default-500">Total Netto</p>
                  <p className="text-xl font-semibold">{formatCurrency(summary.totalNet)}</p>
                </div>
              </Card.Content>
            </Card>
            <Card className={surfaceCardClass}>
              <Card.Content className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-default-500">Sudah Dibayar</p>
                  <p className="text-xl font-semibold">{formatCurrency(summary.totalPaid)}</p>
                </div>
              </Card.Content>
            </Card>
            <Card className={surfaceCardClass}>
              <Card.Content className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-danger/15 text-danger flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-default-500">Sisa Piutang</p>
                  <p className="text-xl font-semibold">{formatCurrency(summary.totalOutstanding)}</p>
                </div>
              </Card.Content>
            </Card>
          </div>

          {billsLoading ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : billsError ? (
            <Card className="border border-danger/20 bg-danger/5">
              <Card.Content className="p-6">
                <p className="text-danger font-medium">Gagal memuat data tagihan siswa.</p>
                <p className="text-sm text-default-500 mt-1">Silakan pilih siswa lain.</p>
              </Card.Content>
            </Card>
          ) : (
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) =>
                setActiveTab(key === 'other' ? 'other' : 'spp')
              }
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
                    <Card.Content className="py-16 text-center">
                      <Calendar className="w-10 h-10 text-default-300 mx-auto mb-3" />
                      <p className="text-default-500">Belum ada tagihan SPP untuk siswa ini.</p>
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
                                  <span className={`text-xs font-semibold ${statusTextClass}`}>
                                    {MONTH_NAMES[month - 1]}
                                  </span>
                                  {isPaid ? (
                                    <CheckCircle2 className="w-4 h-4 text-success" />
                                  ) : (
                                    <span className={`text-[10px] font-medium ${statusTextClass}`}>
                                      {statusConfig[bill.status].label}
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
                    <Card.Content className="py-16 text-center">
                      <Receipt className="w-10 h-10 text-default-300 mx-auto mb-3" />
                      <p className="text-default-500">Tidak ada tagihan lainnya untuk siswa ini.</p>
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
                              <tr
                                key={bill.id}
                                className="border-t border-border/50 hover:bg-surface/60 transition-colors"
                              >
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
                                <td className={`${tableBodyCellClass} font-semibold`}>
                                  {formatCurrency(bill.amount_net)}
                                </td>
                                <td className={`${tableBodyCellClass} hidden md:table-cell text-danger`}>
                                  {formatCurrency(bill.amount_outstanding)}
                                </td>
                                <td className={tableBodyCellClass}>
                                  <span className="text-xs">{bill.due_date ?? '-'}</span>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Chip size="sm" variant="soft" color={statusConfig[bill.status].color}>
                                    <Chip.Label>{statusConfig[bill.status].label}</Chip.Label>
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

      <Modal state={paymentModalState}>
        <Modal.Backdrop>
          <Modal.Container size="md" placement="center">
            <Modal.Dialog aria-label="Bayar tagihan siswa">
              <form onSubmit={submitPayment}>
                <Modal.Header>
                  <div className="flex-1">
                    <Modal.Heading>Bayar Tagihan</Modal.Heading>
                    {billToPay && (
                      <p className="text-xs text-default-500 mt-1 font-mono">{billToPay.bill_number}</p>
                    )}
                  </div>
                  <Modal.CloseTrigger />
                </Modal.Header>

                <Modal.Body className="space-y-4">
                  {billToPay && (
                    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                      <p className="text-sm font-medium">{billToPay.title}</p>
                      <p className="text-xs text-default-500 mt-0.5">
                        Sisa tagihan: <span className="font-semibold text-danger">{formatCurrency(billToPay.amount_outstanding)}</span>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-default-500 mb-1">Tanggal Pembayaran</p>
                      <Controller
                        control={paymentForm.control}
                        name="payment_date"
                        rules={{ required: 'Tanggal pembayaran wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Tanggal pembayaran"
                              type="date"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {paymentForm.formState.errors.payment_date && (
                        <p className="text-xs text-danger mt-1">{paymentForm.formState.errors.payment_date.message}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-default-500 mb-1">Metode Pembayaran</p>
                      <Controller
                        control={paymentForm.control}
                        name="payment_method"
                        render={({ field }) => (
                          <Select
                            aria-label="Metode pembayaran"
                            selectedKey={field.value}
                            onSelectionChange={(key) => field.onChange(String(key ?? 'cash') as PaymentMethod)}
                            fullWidth
                          >
                            <Select.Trigger>
                              <Select.Value />
                              <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover>
                              <ListBox>
                                <ListBox.Item id="cash" textValue="Cash">Cash</ListBox.Item>
                                <ListBox.Item id="transfer" textValue="Transfer">Transfer</ListBox.Item>
                                <ListBox.Item id="other" textValue="Other">Other</ListBox.Item>
                              </ListBox>
                            </Select.Popover>
                          </Select>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Nominal Pembayaran</p>
                      <Controller
                        control={paymentForm.control}
                        name="total_amount"
                        rules={{ required: 'Nominal pembayaran wajib diisi' }}
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Nominal pembayaran"
                              type="number"
                              min={1}
                              placeholder="100000"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                      {paymentForm.formState.errors.total_amount && (
                        <p className="text-xs text-danger mt-1">{paymentForm.formState.errors.total_amount.message}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Nomor Referensi (opsional)</p>
                      <Controller
                        control={paymentForm.control}
                        name="reference_number"
                        render={({ field }) => (
                          <TextField fullWidth>
                            <Input
                              aria-label="Nomor referensi"
                              placeholder="REF-001"
                              value={field.value}
                              onChange={(event) => field.onChange(event.target.value)}
                            />
                          </TextField>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-default-500 mb-1">Catatan (opsional)</p>
                      <Controller
                        control={paymentForm.control}
                        name="notes"
                        render={({ field }) => (
                          <TextArea
                            aria-label="Catatan"
                            placeholder="Catatan pembayaran"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        )}
                      />
                    </div>
                  </div>
                </Modal.Body>

                <Modal.Footer>
                  <Button variant="secondary" type="button" onPress={paymentModalState.close}>
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-accent text-accent-foreground"
                    type="submit"
                    isDisabled={createPayment.isPending}
                  >
                    {createPayment.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}

function BillDetailModal({
  bill,
  state,
  canPay,
  onPay,
}: {
  bill: Bill | null
  state: ReturnType<typeof useOverlayState>
  canPay: boolean
  onPay: (bill: Bill) => void
}) {
  if (!bill) {
    return null
  }

  const hasDiscount = bill.amount_discount > 0
  const hasScholarship = Boolean(bill.student_scholarship)

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog aria-label="Detail Tagihan">
            <Modal.Header>
              <div className="flex-1">
                <Modal.Heading>Detail Tagihan</Modal.Heading>
                <p className="text-xs text-default-500 font-mono mt-1">{bill.bill_number}</p>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="space-y-5">
              <div className="flex items-center justify-between">
                <Chip size="sm" variant="soft" color={statusConfig[bill.status].color}>
                  <Chip.Label>{statusConfig[bill.status].label}</Chip.Label>
                </Chip>
                {bill.period_month && bill.period_year && (
                  <span className="text-sm font-medium text-default-500">
                    {MONTH_NAMES_FULL[bill.period_month - 1]} {bill.period_year}
                  </span>
                )}
              </div>

              <div>
                <p className="text-lg font-semibold">{bill.title}</p>
                {bill.description && (
                  <p className="text-sm text-default-500 mt-1">{bill.description}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <DetailRow label="Jenis Tagihan" value={bill.fee_type?.name ?? '-'} />
                <DetailRow label="Bruto" value={formatCurrency(bill.amount_gross)} />
                {hasDiscount && (
                  <DetailRow
                    label="Diskon"
                    value={`- ${formatCurrency(bill.amount_discount)}`}
                    valueClass="text-success"
                  />
                )}
                {hasScholarship && (
                  <DetailRow
                    label="Beasiswa"
                    value={bill.student_scholarship?.scholarship?.name ?? '-'}
                  />
                )}
                <Separator />
                <DetailRow label="Netto" value={formatCurrency(bill.amount_net)} bold />
                <DetailRow
                  label="Sudah Dibayar"
                  value={formatCurrency(bill.amount_paid)}
                  valueClass="text-success"
                />
                <DetailRow
                  label="Sisa"
                  value={formatCurrency(bill.amount_outstanding)}
                  valueClass={bill.amount_outstanding > 0 ? 'text-danger' : 'text-success'}
                  bold
                />
              </div>

              <Separator />

              <div className="space-y-2">
                {bill.due_date && (
                  <DetailRow label="Jatuh Tempo" value={bill.due_date} />
                )}
                {bill.issued_at && (
                  <DetailRow label="Diterbitkan" value={formatDate(bill.issued_at)} />
                )}
                {bill.paid_off_at && (
                  <DetailRow
                    label="Lunas Pada"
                    value={formatDate(bill.paid_off_at)}
                    valueClass="text-success"
                  />
                )}
                {bill.voided_at && (
                  <DetailRow
                    label="Divoid Pada"
                    value={formatDate(bill.voided_at)}
                    valueClass="text-danger"
                  />
                )}
              </div>

              {bill.allocations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Riwayat Alokasi Pembayaran</p>
                    <div className="space-y-1.5">
                      {bill.allocations.map((allocation) => (
                        <div
                          key={allocation.id}
                          className="flex items-center justify-between rounded-xl bg-background/60 p-2.5"
                        >
                          <span className="text-xs text-default-500">Pembayaran #{allocation.finance_payment_id}</span>
                          <span className="text-sm font-medium text-success">
                            {formatCurrency(allocation.allocated_amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onPress={state.close}>
                <X className="w-4 h-4 mr-2" />
                Tutup
              </Button>
              {canPay && (
                <Button
                  variant="primary"
                  className="bg-accent text-accent-foreground"
                  onPress={() => onPay(bill)}
                >
                  Bayar Tagihan
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

function DetailRow({
  label,
  value,
  valueClass,
  bold,
}: {
  label: string
  value: string
  valueClass?: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-default-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold' : 'font-medium'} ${valueClass ?? ''}`}>
        {value}
      </span>
    </div>
  )
}
