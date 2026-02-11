import { createFileRoute } from '@tanstack/react-router'
import { Download, Plus } from 'lucide-react'
import {
  Button,
  Card,
  Chip,
  Input,
  ListBox,
  Select,
  Spinner,
  TextField,
} from '@heroui/react'
import { useMemo, useState } from 'react'
import { useBills } from '@/hooks/use-bills'
import type { BillStatus } from '@/types/finance'
import {
  cardHeaderClass,
  pageHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/spp')({
  component: SPPPage,
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

function SPPPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | BillStatus>('all')

  const { data, isLoading, error } = useBills({
    per_page: 100,
    status: filterStatus === 'all' ? undefined : filterStatus,
  })

  const bills = data?.data ?? []

  const filteredBills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return bills.filter((bill) => {
      if (!query) {
        return true
      }

      return (
        bill.bill_number.toLowerCase().includes(query) ||
        bill.student_id.toLowerCase().includes(query) ||
        bill.student?.fullname.toLowerCase().includes(query) ||
        bill.student?.nipd?.toLowerCase().includes(query) ||
        bill.student?.nisn?.toLowerCase().includes(query) ||
        bill.title.toLowerCase().includes(query)
      )
    })
  }, [bills, searchQuery])

  const paidCount = bills.filter((bill) => bill.status === 'paid').length
  const partialCount = bills.filter((bill) => bill.status === 'partial').length
  const unpaidCount = bills.filter((bill) => bill.status === 'unpaid').length

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
          <p className="text-danger font-medium">Gagal memuat data tagihan.</p>
          <p className="text-sm text-default-500 mt-1">Silakan coba lagi dalam beberapa saat.</p>
        </Card.Content>
      </Card>
    )
  }

  return (
    <div className={pageShellClass}>
      <div className={pageHeaderClass}>
        <div>
          <h1 className="text-2xl font-semibold">Tagihan SPP</h1>
          <p className="text-sm text-default-500 mt-1">Daftar tagihan dari endpoint bills Finance API.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="primary" className="bg-accent text-accent-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Generate SPP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 text-center">
            <p className="text-xs text-default-500">Lunas</p>
            <p className="text-2xl font-semibold text-success mt-1">{paidCount}</p>
          </Card.Content>
        </Card>
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 text-center">
            <p className="text-xs text-default-500">Sebagian</p>
            <p className="text-2xl font-semibold text-warning mt-1">{partialCount}</p>
          </Card.Content>
        </Card>
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 text-center">
            <p className="text-xs text-default-500">Belum Bayar</p>
            <p className="text-2xl font-semibold text-danger mt-1">{unpaidCount}</p>
          </Card.Content>
        </Card>
      </div>

      <Card className={surfaceCardClass}>
        <Card.Header className={cardHeaderClass}>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1">
              <TextField fullWidth>
                <Input
                  aria-label="Cari tagihan"
                  placeholder="Cari nomor tagihan, nama siswa, atau judul"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </TextField>
            </div>

            <div className="w-full sm:w-[220px]">
              <Select
                aria-label="Filter status tagihan"
                placeholder="Pilih status"
                value={filterStatus}
                onChange={(value) => setFilterStatus((value ?? 'all') as 'all' | BillStatus)}
                fullWidth
              >
                <ListBox.Item id="all" textValue="Semua status">Semua status</ListBox.Item>
                <ListBox.Item id="unpaid" textValue="Belum bayar">Belum bayar</ListBox.Item>
                <ListBox.Item id="partial" textValue="Sebagian">Sebagian</ListBox.Item>
                <ListBox.Item id="paid" textValue="Lunas">Lunas</ListBox.Item>
                <ListBox.Item id="void" textValue="Void">Void</ListBox.Item>
              </Select>
            </div>
          </div>
        </Card.Header>

        <Card.Content className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border/70">
                  <th className={tableHeadCellClass}>Nomor Tagihan</th>
                  <th className={tableHeadCellClass}>Siswa</th>
                  <th className={tableHeadCellClass}>Periode</th>
                  <th className={tableHeadCellClass}>Netto</th>
                  <th className={`${tableHeadCellClass} hidden md:table-cell`}>Sisa</th>
                  <th className={tableHeadCellClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                    <td className={tableBodyCellClass}>
                      <div>
                        <p className="font-mono text-xs">{bill.bill_number}</p>
                        <p className="text-xs text-default-500 mt-0.5">{bill.title}</p>
                      </div>
                    </td>
                    <td className={tableBodyCellClass}>
                      <div>
                        <p className="font-medium text-default-700">{bill.student?.fullname ?? 'Unknown Student'}</p>
                        <p className="text-xs text-default-500 mt-0.5">
                          {bill.student?.nipd || bill.student?.nisn || bill.student_id.slice(0, 8)}
                        </p>
                      </div>
                    </td>
                    <td className={tableBodyCellClass}>
                      {bill.period_month && bill.period_year ? `${bill.period_month}/${bill.period_year}` : '-'}
                    </td>
                    <td className={`${tableBodyCellClass} font-semibold`}>{formatCurrency(bill.amount_net)}</td>
                    <td className={`${tableBodyCellClass} hidden md:table-cell`}>{formatCurrency(bill.amount_outstanding)}</td>
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

          {filteredBills.length === 0 && (
            <div className="py-10 text-center text-sm text-default-500">Tidak ada data tagihan ditemukan.</div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
