import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Coins,
  CreditCard,
  GraduationCap,
  Wallet,
} from 'lucide-react'
import { Button, Card, Chip, Spinner } from '@heroui/react'
import { useCollectionsReport, useReceivablesReport } from '@/hooks/use-reports'
import { usePayments } from '@/hooks/use-payments'
import { useScholarships } from '@/hooks/use-scholarships'
import { useFinanceHealth } from '@/hooks/use-finance-meta'
import {
  cardHeaderClass,
  pageHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function DashboardOverview() {
  const { data: receivablesData, isLoading: receivablesLoading } = useReceivablesReport()
  const { data: collectionsData, isLoading: collectionsLoading } = useCollectionsReport()
  const { data: recentPaymentsData, isLoading: paymentsLoading } = usePayments({ per_page: 5 })
  const { data: scholarshipsData, isLoading: scholarshipsLoading } = useScholarships({ per_page: 100 })
  const { data: healthData } = useFinanceHealth()

  const isLoading = receivablesLoading || collectionsLoading || paymentsLoading || scholarshipsLoading

  const receivables = receivablesData ?? {
    summary: {
      total_bills: 0,
      total_gross: 0,
      total_discount: 0,
      total_net: 0,
      total_paid: 0,
      total_outstanding: 0,
    },
    by_status: [],
  }

  const collections = collectionsData ?? {
    summary: {
      total_transactions: 0,
      total_collected: 0,
    },
    daily: [],
  }

  const recentPayments = recentPaymentsData?.data ?? []
  const activeScholarships = (scholarshipsData?.data ?? []).filter((item) => item.is_active).length

  if (isLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className={pageShellClass}>
      <div className={pageHeaderClass}>
        <div>
          <h1 className="text-2xl font-semibold">Ringkasan Keuangan</h1>
          <p className="text-sm text-default-500 mt-1">Data realtime dari Finance API backend.</p>
        </div>
        <Chip
          size="sm"
          variant="soft"
          color={healthData?.status === 'ok' ? 'success' : 'warning'}
          className="w-fit"
        >
          <Chip.Label>
            API {healthData?.service ?? 'finance-api'}: {healthData?.status ?? 'unknown'}
          </Chip.Label>
        </Chip>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className={surfaceCardClass}>
          <Card.Content className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <ArrowDownLeft className="w-4 h-4 text-success" />
            </div>
            <p className="text-xs text-default-500 mt-4">Total Penerimaan</p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(collections.summary.total_collected)}</p>
          </Card.Content>
        </Card>

        <Card className={surfaceCardClass}>
          <Card.Content className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-success/15 text-success flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <BadgeCheck className="w-4 h-4 text-success" />
            </div>
            <p className="text-xs text-default-500 mt-4">Sudah Dibayar</p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(receivables.summary.total_paid)}</p>
          </Card.Content>
        </Card>

        <Card className={surfaceCardClass}>
          <Card.Content className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-warning/15 text-warning flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-warning" />
            </div>
            <p className="text-xs text-default-500 mt-4">Beasiswa Aktif</p>
            <p className="text-2xl font-semibold mt-1">{activeScholarships}</p>
          </Card.Content>
        </Card>

        <Card className={surfaceCardClass}>
          <Card.Content className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-danger/15 text-danger flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <CreditCard className="w-4 h-4 text-danger" />
            </div>
            <p className="text-xs text-default-500 mt-4">Sisa Piutang</p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(receivables.summary.total_outstanding)}</p>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className={`${surfaceCardClass} xl:col-span-2`}>
          <Card.Header className={`${cardHeaderClass} flex flex-row items-center justify-between`}>
            <div>
              <Card.Title>5 Pembayaran Terbaru</Card.Title>
              <Card.Description>Diambil dari endpoint payments</Card.Description>
            </div>
            <Button variant="secondary" size="sm">
              Lihat Semua
            </Button>
          </Card.Header>
          <Card.Content className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-border/70">
                      <th className={tableHeadCellClass}>Nomor</th>
                      <th className={tableHeadCellClass}>Siswa</th>
                      <th className={tableHeadCellClass}>Total</th>
                    <th className={`${tableHeadCellClass} hidden md:table-cell`}>Tanggal</th>
                    <th className={tableHeadCellClass}>Status</th>
                  </tr>
                </thead>
                <tbody>
                    {recentPayments.map((item) => (
                      <tr key={item.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                        <td className={`${tableBodyCellClass} font-mono text-xs`}>{item.payment_number}</td>
                        <td className={tableBodyCellClass}>
                          <div>
                            <p className="font-medium text-default-700">{item.student?.fullname ?? 'Unknown Student'}</p>
                            <p className="text-xs text-default-500 mt-0.5">
                              {item.student?.nipd || item.student?.nisn || item.student_id.slice(0, 8)}
                            </p>
                          </div>
                        </td>
                        <td className={`${tableBodyCellClass} font-semibold`}>{formatCurrency(item.total_amount)}</td>
                      <td className={`${tableBodyCellClass} hidden md:table-cell`}>{item.payment_date}</td>
                      <td className={tableBodyCellClass}>
                        <Chip size="sm" variant="soft" color={item.status === 'confirmed' ? 'success' : 'danger'}>
                          <Chip.Label>{item.status === 'confirmed' ? 'Terkonfirmasi' : 'Void'}</Chip.Label>
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {recentPayments.length === 0 && (
              <div className="py-10 text-center text-sm text-default-500">Belum ada data pembayaran.</div>
            )}
          </Card.Content>
        </Card>

        <Card className={surfaceCardClass}>
          <Card.Header className={cardHeaderClass}>
            <Card.Title>Status Piutang</Card.Title>
            <Card.Description>Distribusi jumlah tagihan berdasarkan status</Card.Description>
          </Card.Header>
          <Card.Content className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3">
            {receivables.by_status.length === 0 ? (
              <p className="text-sm text-default-500">Belum ada data.</p>
            ) : (
              receivables.by_status.map((item) => (
                <div key={item.status} className="rounded-2xl border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <Chip
                      size="sm"
                      variant="soft"
                      color={
                        item.status === 'paid' ? 'success' : item.status === 'partial' ? 'warning' : item.status === 'unpaid' ? 'danger' : 'default'
                      }
                    >
                      <Chip.Label>{item.status}</Chip.Label>
                    </Chip>
                    <span className="text-xs text-default-500">{item.total_bills} tagihan</span>
                  </div>
                  <p className="text-sm font-medium mt-2">{formatCurrency(item.total_outstanding)}</p>
                </div>
              ))
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
