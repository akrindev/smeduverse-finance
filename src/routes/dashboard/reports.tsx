import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Chip, Input, Tabs, TextField } from '@heroui/react'
import { Calendar, Download, Receipt } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { useCollectionsReport, useReceivablesReport } from '@/hooks/use-reports'
import { formatCurrency } from '@/lib/format'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'receivables' | 'collections'>('receivables')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const filter = dateRange.start && dateRange.end
    ? { start_date: dateRange.start, end_date: dateRange.end }
    : undefined

  const {
    data: receivablesData,
    isLoading: receivablesLoading,
    error: receivablesError,
  } = useReceivablesReport(filter)

  const {
    data: collectionsData,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useCollectionsReport(filter)

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

  return (
    <div className={pageShellClass}>
      <PageHeader title="Laporan Keuangan" description="Ringkasan piutang dan penerimaan dari Finance API.">
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <Card className={surfaceCardClass}>
        <Card.Content className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="inline-flex items-center gap-2 text-sm text-default-500">
              <Calendar className="w-4 h-4" />
              Rentang tanggal
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <TextField>
                <Input
                  type="date"
                  aria-label="Tanggal mulai"
                  value={dateRange.start}
                  onChange={(event) =>
                    setDateRange((prev) => ({ ...prev, start: event.target.value }))
                  }
                />
              </TextField>
              <span className="text-default-500">-</span>
              <TextField>
                <Input
                  type="date"
                  aria-label="Tanggal akhir"
                  value={dateRange.end}
                  onChange={(event) =>
                    setDateRange((prev) => ({ ...prev, end: event.target.value }))
                  }
                />
              </TextField>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) =>
          setActiveTab(key === 'collections' ? 'collections' : 'receivables')
        }
      >
        <Tabs.List className="w-full">
          <Tabs.Tab id="receivables">
            Piutang
          </Tabs.Tab>
          <Tabs.Tab id="collections">
            Penerimaan
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="receivables" className="mt-6">
          {receivablesLoading ? (
            <LoadingState minHeight="300px" />
          ) : receivablesError ? (
            <ErrorState message="Gagal memuat data laporan piutang." />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className={surfaceCardClass}>
                  <Card.Content className="p-4">
                    <p className="text-xs text-default-500 mb-1">Total Tagihan</p>
                    <p className="text-xl font-semibold">{receivables.summary.total_bills}</p>
                  </Card.Content>
                </Card>
                <Card className={surfaceCardClass}>
                  <Card.Content className="p-4">
                    <p className="text-xs text-default-500 mb-1">Total Bruto</p>
                    <p className="text-xl font-semibold">{formatCurrency(receivables.summary.total_gross)}</p>
                  </Card.Content>
                </Card>
                <Card className={surfaceCardClass}>
                  <Card.Content className="p-4">
                    <p className="text-xs text-default-500 mb-1">Total Diskon</p>
                    <p className="text-xl font-semibold">{formatCurrency(receivables.summary.total_discount)}</p>
                  </Card.Content>
                </Card>
                <Card className={surfaceCardClass}>
                  <Card.Content className="p-4">
                    <p className="text-xs text-default-500 mb-1">Total Netto</p>
                    <p className="text-xl font-semibold text-success">{formatCurrency(receivables.summary.total_net)}</p>
                  </Card.Content>
                </Card>
                <Card className={surfaceCardClass}>
                  <Card.Content className="p-4">
                    <p className="text-xs text-default-500 mb-1">Sudah Dibayar</p>
                    <p className="text-xl font-semibold text-accent">{formatCurrency(receivables.summary.total_paid)}</p>
                  </Card.Content>
                </Card>
                <Card className={surfaceCardClass}>
                  <Card.Content className="p-4">
                    <p className="text-xs text-default-500 mb-1">Sisa Piutang</p>
                    <p className="text-xl font-semibold text-danger">
                      {formatCurrency(receivables.summary.total_outstanding)}
                    </p>
                  </Card.Content>
                </Card>
              </div>

              <Card className={surfaceCardClass}>
                <Card.Header className={cardHeaderClass}>
                  <Card.Title>Piutang Berdasarkan Status</Card.Title>
                </Card.Header>
                <Card.Content className="px-0 pb-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-border/70">
                          <th className={tableHeadCellClass}>Status</th>
                          <th className={tableHeadCellClass}>Jumlah Tagihan</th>
                          <th className={tableHeadCellClass}>Total Piutang</th>
                        </tr>
                      </thead>
                      <tbody>
                        {receivables.by_status.map((item) => (
                          <tr key={item.status} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                            <td className={tableBodyCellClass}>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={
                                  item.status === 'paid'
                                    ? 'success'
                                    : item.status === 'partial'
                                      ? 'warning'
                                      : item.status === 'unpaid'
                                        ? 'danger'
                                        : 'default'
                                }
                              >
                                <Chip.Label>
                                  {item.status === 'paid'
                                    ? 'Lunas'
                                    : item.status === 'partial'
                                      ? 'Sebagian'
                                      : item.status === 'unpaid'
                                        ? 'Belum Bayar'
                                        : 'Batal'}
                                </Chip.Label>
                              </Chip>
                            </td>
                            <td className={tableBodyCellClass}>{item.total_bills}</td>
                            <td className={`${tableBodyCellClass} font-medium`}>
                              {formatCurrency(item.total_outstanding)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="collections" className="mt-6">
          {collectionsLoading ? (
            <LoadingState minHeight="300px" />
          ) : collectionsError ? (
            <ErrorState message="Gagal memuat data laporan penerimaan." />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className={surfaceCardClass}>
                  <Card.Content className="p-4">
                    <p className="text-xs text-default-500 mb-1">Total Transaksi</p>
                    <p className="text-xl font-semibold">{collections.summary.total_transactions}</p>
                  </Card.Content>
                </Card>
                <Card className={surfaceCardClass}>
                  <Card.Content className="p-4">
                    <p className="text-xs text-default-500 mb-1">Total Diterima</p>
                    <p className="text-xl font-semibold text-success">
                      {formatCurrency(collections.summary.total_collected)}
                    </p>
                  </Card.Content>
                </Card>
              </div>

              <Card className={surfaceCardClass}>
                <Card.Header className={cardHeaderClass}>
                  <Card.Title>Penerimaan Harian</Card.Title>
                </Card.Header>
                <Card.Content className="px-0 pb-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-border/70">
                          <th className={tableHeadCellClass}>Tanggal</th>
                          <th className={tableHeadCellClass}>Jumlah Transaksi</th>
                          <th className={tableHeadCellClass}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collections.daily.map((item) => (
                          <tr key={item.date} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                            <td className={tableBodyCellClass}>{item.date}</td>
                            <td className={tableBodyCellClass}>{item.total_transactions}</td>
                            <td className={`${tableBodyCellClass} font-medium`}>
                              {formatCurrency(item.total_collected)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {collections.daily.length === 0 && (
                    <EmptyState icon={Receipt} message="Tidak ada data penerimaan" />
                  )}
                </Card.Content>
              </Card>
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
