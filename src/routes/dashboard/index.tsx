import { createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  Coins,
  CreditCard,
  GraduationCap,
  Wallet,
} from 'lucide-react'
import { Button, Card, Chip } from '@heroui/react'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { useCollectionsReport, useReceivablesReport } from '@/hooks/use-reports'
import { usePayments } from '@/hooks/use-payments'
import { useScholarships } from '@/hooks/use-scholarships'
import { useFinanceHealth } from '@/hooks/use-finance-meta'
import { formatCurrency } from '@/lib/format'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

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
    return <LoadingState />
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title="Ringkasan Keuangan" description="Data realtime dari Finance API backend.">
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
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          iconBgClass="bg-accent-soft"
          iconColorClass="text-accent"
          label="Total Penerimaan"
          value={formatCurrency(collections.summary.total_collected)}
        />

        <StatCard
          icon={Coins}
          iconBgClass="bg-success/15"
          iconColorClass="text-success"
          label="Sudah Dibayar"
          value={formatCurrency(receivables.summary.total_paid)}
        />

        <StatCard
          icon={GraduationCap}
          iconBgClass="bg-warning/15"
          iconColorClass="text-warning"
          label="Beasiswa Aktif"
          value={activeScholarships}
        />

        <StatCard
          icon={AlertTriangle}
          iconBgClass="bg-danger/15"
          iconColorClass="text-danger"
          label="Sisa Piutang"
          value={formatCurrency(receivables.summary.total_outstanding)}
        />
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
          <Card.Content>
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
              <EmptyState icon={CreditCard} message="Belum ada data pembayaran." />
            )}
          </Card.Content>
        </Card>

        <Card className={surfaceCardClass}>
          <Card.Header className={cardHeaderClass}>
            <Card.Title>Status Piutang</Card.Title>
            <Card.Description>Distribusi jumlah tagihan berdasarkan status</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3">
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
                  <p className="text-sm font-medium mt-2">{formatCurrency(Number(item.total_outstanding))}</p>
                </div>
              ))
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
