import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  CreditCard,
  Receipt,
  Search,
  Wallet,
} from 'lucide-react'
import {
  Button,
  Card,
  Chip,
  Input,
  Spinner,
  Tabs,
  TextField,
} from '@heroui/react'
import { useMemo, useState } from 'react'
import { useStudentBills } from '@/hooks/use-bills'
import { useStudentLedger } from '@/hooks/use-student-finance'
import type { BillStatus } from '@/types/finance'
import {
  cardHeaderClass,
  pageHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

interface SearchParams {
  student_id?: string
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

const statusConfig: Record<BillStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'default' }> = {
  paid: { label: 'Lunas', color: 'success' },
  partial: { label: 'Sebagian', color: 'warning' },
  unpaid: { label: 'Belum Bayar', color: 'danger' },
  void: { label: 'Void', color: 'default' },
}

function StudentBillsPage() {
  const { student_id: paramStudentId } = Route.useSearch()
  const navigate = useNavigate()

  const [searchInput, setSearchInput] = useState(paramStudentId ?? '')
  const [activeStudentId, setActiveStudentId] = useState(paramStudentId ?? '')
  const [activeTab, setActiveTab] = useState<'bills' | 'ledger'>('bills')

  const {
    data: billsData,
    isLoading: billsLoading,
    error: billsError,
  } = useStudentBills(activeStudentId)

  const {
    data: ledgerData,
    isLoading: ledgerLoading,
    error: ledgerError,
  } = useStudentLedger(activeStudentId)

  const bills = billsData?.data ?? []

  const studentName = useMemo(() => {
    const bill = bills.find((b) => b.student)
    if (bill?.student) return bill.student.fullname
    const ledgerBill = ledgerData?.bills?.find((b) => b.student)
    if (ledgerBill?.student) return ledgerBill.student.fullname
    return null
  }, [bills, ledgerData])

  const summary = useMemo(() => {
    const target = activeTab === 'ledger' && ledgerData ? ledgerData.bills : bills
    const totalBills = target.length
    const totalNet = target.reduce((sum, b) => sum + b.amount_net, 0)
    const totalPaid = target.reduce((sum, b) => sum + b.amount_paid, 0)
    const totalOutstanding = target.reduce((sum, b) => sum + b.amount_outstanding, 0)
    return { totalBills, totalNet, totalPaid, totalOutstanding }
  }, [activeTab, bills, ledgerData])

  const handleSearch = () => {
    const trimmed = searchInput.trim()
    if (!trimmed) return
    setActiveStudentId(trimmed)
    navigate({
      to: '/dashboard/student-bills',
      search: { student_id: trimmed },
      replace: true,
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={pageShellClass}>
      <div className={pageHeaderClass}>
        <div>
          <h1 className="text-2xl font-semibold">Tagihan Siswa</h1>
          <p className="text-sm text-default-500 mt-1">
            Lihat tagihan dan buku besar per siswa.
          </p>
        </div>
      </div>

      <Card className={surfaceCardClass}>
        <Card.Content className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <TextField fullWidth>
                <Input
                  aria-label="Cari siswa"
                  placeholder="Masukkan Student ID (UUID) ..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </TextField>
            </div>
            <Button
              variant="primary"
              className="bg-accent text-accent-foreground"
              onPress={handleSearch}
              isDisabled={!searchInput.trim()}
            >
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
          </div>

          {activeStudentId && studentName && (
            <div className="mt-3 flex items-center gap-2">
              <Chip size="sm" variant="soft" color="accent">
                <Chip.Label>{studentName}</Chip.Label>
              </Chip>
              <span className="text-xs text-default-500 font-mono">{activeStudentId.slice(0, 8)}...</span>
            </div>
          )}
        </Card.Content>
      </Card>

      {!activeStudentId && (
        <Card className={surfaceCardClass}>
          <Card.Content className="py-16 text-center">
            <Search className="w-10 h-10 text-default-300 mx-auto mb-3" />
            <p className="text-default-500">Masukkan Student ID untuk melihat tagihan.</p>
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

          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) =>
              setActiveTab(key === 'ledger' ? 'ledger' : 'bills')
            }
          >
            <Tabs.List className="w-full">
              <Tabs.Tab id="bills">Tagihan</Tabs.Tab>
              <Tabs.Tab id="ledger">Buku Besar</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel id="bills" className="mt-6">
              {billsLoading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : billsError ? (
                <Card className="border border-danger/20 bg-danger/5">
                  <Card.Content className="p-6">
                    <p className="text-danger font-medium">Gagal memuat data tagihan siswa.</p>
                    <p className="text-sm text-default-500 mt-1">Pastikan Student ID valid.</p>
                  </Card.Content>
                </Card>
              ) : (
                <Card className={surfaceCardClass}>
                  <Card.Header className={cardHeaderClass}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="font-medium">Daftar Tagihan</p>
                        <p className="text-xs text-default-500 mt-0.5">
                          GET /students/{'{student}'}/bills
                        </p>
                      </div>
                      <Chip size="sm" variant="soft" color="default">
                        <Chip.Label>{bills.length} tagihan</Chip.Label>
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
                            <th className={tableHeadCellClass}>Periode</th>
                            <th className={tableHeadCellClass}>Netto</th>
                            <th className={`${tableHeadCellClass} hidden md:table-cell`}>Dibayar</th>
                            <th className={`${tableHeadCellClass} hidden md:table-cell`}>Sisa</th>
                            <th className={tableHeadCellClass}>Jatuh Tempo</th>
                            <th className={tableHeadCellClass}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bills.map((bill) => (
                            <tr
                              key={bill.id}
                              className="border-t border-border/50 hover:bg-surface/60 transition-colors"
                            >
                              <td className={tableBodyCellClass}>
                                <p className="font-mono text-xs">{bill.bill_number}</p>
                              </td>
                              <td className={tableBodyCellClass}>
                                <p className="font-medium text-default-700 max-w-[200px] truncate">{bill.title}</p>
                                {bill.description && (
                                  <p className="text-xs text-default-500 mt-0.5 max-w-[200px] truncate">
                                    {bill.description}
                                  </p>
                                )}
                              </td>
                              <td className={tableBodyCellClass}>
                                <Chip size="sm" variant="soft" color="default">
                                  <Chip.Label>{bill.fee_type?.name ?? '-'}</Chip.Label>
                                </Chip>
                              </td>
                              <td className={tableBodyCellClass}>
                                {bill.period_month && bill.period_year
                                  ? `${bill.period_month}/${bill.period_year}`
                                  : '-'}
                              </td>
                              <td className={`${tableBodyCellClass} font-semibold`}>
                                {formatCurrency(bill.amount_net)}
                              </td>
                              <td className={`${tableBodyCellClass} hidden md:table-cell text-success`}>
                                {formatCurrency(bill.amount_paid)}
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {bills.length === 0 && (
                      <div className="py-10 text-center text-sm text-default-500">
                        Tidak ada tagihan untuk siswa ini.
                      </div>
                    )}
                  </Card.Content>
                </Card>
              )}
            </Tabs.Panel>

            <Tabs.Panel id="ledger" className="mt-6">
              {ledgerLoading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              ) : ledgerError ? (
                <Card className="border border-danger/20 bg-danger/5">
                  <Card.Content className="p-6">
                    <p className="text-danger font-medium">Gagal memuat buku besar siswa.</p>
                    <p className="text-sm text-default-500 mt-1">Pastikan Student ID valid.</p>
                  </Card.Content>
                </Card>
              ) : (
                <div className="space-y-6">
                  <Card className={surfaceCardClass}>
                    <Card.Header className={cardHeaderClass}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-medium">Tagihan (Ledger)</p>
                          <p className="text-xs text-default-500 mt-0.5">
                            GET /students/{'{student}'}/ledger
                          </p>
                        </div>
                        <Chip size="sm" variant="soft" color="default">
                          <Chip.Label>{ledgerData?.bills?.length ?? 0} tagihan</Chip.Label>
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
                              <th className={`${tableHeadCellClass} hidden md:table-cell`}>Dibayar</th>
                              <th className={`${tableHeadCellClass} hidden md:table-cell`}>Sisa</th>
                              <th className={tableHeadCellClass}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(ledgerData?.bills ?? []).map((bill) => (
                              <tr
                                key={bill.id}
                                className="border-t border-border/50 hover:bg-surface/60 transition-colors"
                              >
                                <td className={tableBodyCellClass}>
                                  <p className="font-mono text-xs">{bill.bill_number}</p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <p className="font-medium text-default-700">{bill.title}</p>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Chip size="sm" variant="soft" color="default">
                                    <Chip.Label>{bill.fee_type?.name ?? '-'}</Chip.Label>
                                  </Chip>
                                </td>
                                <td className={`${tableBodyCellClass} font-semibold`}>
                                  {formatCurrency(bill.amount_net)}
                                </td>
                                <td className={`${tableBodyCellClass} hidden md:table-cell text-success`}>
                                  {formatCurrency(bill.amount_paid)}
                                </td>
                                <td className={`${tableBodyCellClass} hidden md:table-cell text-danger`}>
                                  {formatCurrency(bill.amount_outstanding)}
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Chip size="sm" variant="soft" color={statusConfig[bill.status].color}>
                                    <Chip.Label>{statusConfig[bill.status].label}</Chip.Label>
                                  </Chip>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {(ledgerData?.bills ?? []).length === 0 && (
                        <div className="py-10 text-center text-sm text-default-500">
                          Tidak ada tagihan dalam buku besar.
                        </div>
                      )}
                    </Card.Content>
                  </Card>

                  <Card className={surfaceCardClass}>
                    <Card.Header className={cardHeaderClass}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-medium">Riwayat Pembayaran (Ledger)</p>
                          <p className="text-xs text-default-500 mt-0.5">
                            Pembayaran yang tercatat dalam buku besar siswa
                          </p>
                        </div>
                        <Chip size="sm" variant="soft" color="default">
                          <Chip.Label>{ledgerData?.payments?.length ?? 0} pembayaran</Chip.Label>
                        </Chip>
                      </div>
                    </Card.Header>
                    <Card.Content className="px-0 pb-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-t border-border/70">
                              <th className={tableHeadCellClass}>No. Pembayaran</th>
                              <th className={tableHeadCellClass}>Tanggal</th>
                              <th className={tableHeadCellClass}>Metode</th>
                              <th className={tableHeadCellClass}>Total</th>
                              <th className={`${tableHeadCellClass} hidden md:table-cell`}>Referensi</th>
                              <th className={tableHeadCellClass}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(ledgerData?.payments ?? []).map((payment) => (
                              <tr
                                key={payment.id}
                                className="border-t border-border/50 hover:bg-surface/60 transition-colors"
                              >
                                <td className={`${tableBodyCellClass} font-mono text-xs`}>
                                  {payment.payment_number}
                                </td>
                                <td className={tableBodyCellClass}>{payment.payment_date}</td>
                                <td className={`${tableBodyCellClass} capitalize`}>
                                  {payment.payment_method}
                                </td>
                                <td className={`${tableBodyCellClass} font-semibold`}>
                                  {formatCurrency(payment.total_amount)}
                                </td>
                                <td className={`${tableBodyCellClass} hidden md:table-cell`}>
                                  <span className="text-xs text-default-500">
                                    {payment.reference_number ?? '-'}
                                  </span>
                                </td>
                                <td className={tableBodyCellClass}>
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    color={payment.status === 'confirmed' ? 'success' : 'danger'}
                                  >
                                    <Chip.Label>
                                      {payment.status === 'confirmed' ? 'Terkonfirmasi' : 'Void'}
                                    </Chip.Label>
                                  </Chip>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {(ledgerData?.payments ?? []).length === 0 && (
                        <div className="py-10 text-center text-sm text-default-500">
                          Belum ada pembayaran tercatat.
                        </div>
                      )}
                    </Card.Content>
                  </Card>
                </div>
              )}
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </div>
  )
}
