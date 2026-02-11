import { createFileRoute } from '@tanstack/react-router'
import { ArrowDownLeft, ArrowUpRight, Download, Receipt } from 'lucide-react'
import { Button, Card, Chip, Input, Spinner, TextField } from '@heroui/react'
import { useMemo, useState } from 'react'
import { usePayments } from '@/hooks/use-payments'
import type { Payment } from '@/types/finance'
import {
  cardHeaderClass,
  pageHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/payments')({
  component: PaymentsPage,
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

const statusConfig: Record<Payment['status'], { label: string; color: 'success' | 'danger' }> = {
  confirmed: { label: 'Terkonfirmasi', color: 'success' },
  void: { label: 'Void', color: 'danger' },
}

function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | Payment['status']>('all')

  const { data, isLoading, error } = usePayments()
  const payments = data?.data ?? []

  const filteredPayments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return payments.filter((payment) => {
      const matchesFilter = activeFilter === 'all' || payment.status === activeFilter
      const matchesSearch =
        query.length === 0 ||
        payment.payment_number.toLowerCase().includes(query) ||
        payment.student_id.toLowerCase().includes(query) ||
        (payment.reference_number ?? '').toLowerCase().includes(query)

      return matchesFilter && matchesSearch
    })
  }, [activeFilter, payments, searchQuery])

  const confirmedCount = payments.filter((item) => item.status === 'confirmed').length
  const voidCount = payments.filter((item) => item.status === 'void').length
  const confirmedAmount = payments
    .filter((item) => item.status === 'confirmed')
    .reduce((sum, item) => sum + item.total_amount, 0)

  if (isLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="max-w-xl mx-auto border border-danger/20 bg-danger/5">
        <Card.Content className="p-6">
          <p className="text-danger font-medium">Gagal memuat data pembayaran.</p>
          <p className="text-sm text-default-500 mt-1">Silakan coba lagi dalam beberapa saat.</p>
        </Card.Content>
      </Card>
    )
  }

  return (
    <div className={pageShellClass}>
      <div className={pageHeaderClass}>
        <div>
          <h1 className="text-2xl font-semibold">Riwayat Pembayaran</h1>
          <p className="text-sm text-default-500 mt-1">Data transaksi pembayaran dari Finance API.</p>
        </div>
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-default-500">Total Transaksi</p>
              <p className="text-xl font-semibold">{payments.length}</p>
            </div>
          </Card.Content>
        </Card>
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-success/15 text-success flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-default-500">Terkonfirmasi</p>
              <p className="text-xl font-semibold">{confirmedCount}</p>
            </div>
          </Card.Content>
        </Card>
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-danger/15 text-danger flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-default-500">Total Diterima</p>
              <p className="text-xl font-semibold">{formatCurrency(confirmedAmount)}</p>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className={surfaceCardClass}>
        <Card.Header className={`${cardHeaderClass} flex flex-col gap-3`}>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={activeFilter === 'all' ? 'primary' : 'secondary'}
              className={activeFilter === 'all' ? 'bg-accent text-accent-foreground' : ''}
              size="sm"
              onPress={() => setActiveFilter('all')}
            >
              Semua
            </Button>
            <Button
              variant={activeFilter === 'confirmed' ? 'primary' : 'secondary'}
              className={activeFilter === 'confirmed' ? 'bg-accent text-accent-foreground' : ''}
              size="sm"
              onPress={() => setActiveFilter('confirmed')}
            >
              Terkonfirmasi
            </Button>
            <Button
              variant={activeFilter === 'void' ? 'primary' : 'secondary'}
              className={activeFilter === 'void' ? 'bg-accent text-accent-foreground' : ''}
              size="sm"
              onPress={() => setActiveFilter('void')}
            >
              Void
            </Button>
            <Chip size="sm" variant="soft" color="default" className="ml-auto">
              <Chip.Label>{filteredPayments.length} data</Chip.Label>
            </Chip>
          </div>

          <TextField fullWidth>
            <Input
              aria-label="Cari pembayaran"
              placeholder="Cari nomor pembayaran, student_id, atau referensi"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </TextField>
        </Card.Header>

        <Card.Content className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border/70">
                  <th className={tableHeadCellClass}>Nomor</th>
                  <th className={`${tableHeadCellClass} hidden sm:table-cell`}>Student ID</th>
                  <th className={tableHeadCellClass}>Metode</th>
                  <th className={tableHeadCellClass}>Total</th>
                  <th className={`${tableHeadCellClass} hidden md:table-cell`}>Tanggal</th>
                  <th className={tableHeadCellClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                    <td className={`${tableBodyCellClass} font-mono text-xs`}>{payment.payment_number}</td>
                    <td className={`${tableBodyCellClass} hidden sm:table-cell`}>{payment.student_id}</td>
                    <td className={`${tableBodyCellClass} capitalize`}>{payment.payment_method}</td>
                    <td className={`${tableBodyCellClass} font-semibold`}>{formatCurrency(payment.total_amount)}</td>
                    <td className={`${tableBodyCellClass} hidden md:table-cell`}>{payment.payment_date}</td>
                    <td className={tableBodyCellClass}>
                      <Chip size="sm" variant="soft" color={statusConfig[payment.status].color}>
                        <Chip.Label>{statusConfig[payment.status].label}</Chip.Label>
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="py-10 text-center text-sm text-default-500">Tidak ada data pembayaran.</div>
          )}
        </Card.Content>
      </Card>

      <Card className={surfaceCardClass}>
        <Card.Content className="p-4 flex items-center justify-between text-sm">
          <span className="text-default-500">Transaksi void</span>
          <Chip size="sm" variant="soft" color="danger">
            <Chip.Label>{voidCount}</Chip.Label>
          </Chip>
        </Card.Content>
      </Card>
    </div>
  )
}
