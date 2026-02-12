import { createFileRoute, Link } from '@tanstack/react-router'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowDownLeft, ArrowUpRight, Download, ExternalLink, Receipt } from 'lucide-react'
import { Button, Card, Chip, Input, TextField } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { usePayments } from '@/hooks/use-payments'
import { formatCurrency } from '@/lib/format'
import type { Payment } from '@/types/finance'
import { TablePagination } from '@/lib/table-pagination'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/payments')({
  component: PaymentsPage,
})

const statusConfig: Record<Payment['status'], { label: string; color: 'success' | 'danger' }> = {
  confirmed: { label: 'Terkonfirmasi', color: 'success' },
  void: { label: 'Void', color: 'danger' },
}

function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | Payment['status']>('all')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const { data, isLoading, error } = usePayments()
  const payments = data?.data ?? []

  const filteredPayments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return payments.filter((payment) => {
      const matchesFilter = activeFilter === 'all' || payment.status === activeFilter
      const matchesSearch =
        query.length === 0 ||
        payment.payment_number.toLowerCase().includes(query) ||
        payment.student?.fullname.toLowerCase().includes(query) ||
        payment.student?.nipd?.toLowerCase().includes(query) ||
        payment.student?.nisn?.toLowerCase().includes(query) ||
        (payment.reference_number ?? '').toLowerCase().includes(query)

      return matchesFilter && matchesSearch
    })
  }, [activeFilter, payments, searchQuery])

  const confirmedCount = payments.filter((item) => item.status === 'confirmed').length
  const voidCount = payments.filter((item) => item.status === 'void').length
  const confirmedAmount = payments
    .filter((item) => item.status === 'confirmed')
    .reduce((sum, item) => sum + item.total_amount, 0)

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [searchQuery, activeFilter])

  const table = useReactTable({
    data: filteredPayments,
    columns: useMemo(() => [{ accessorKey: 'id' }], []),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const paginatedPayments = table.getRowModel().rows.map((row) => row.original)

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message="Gagal memuat data pembayaran." detail="Silakan coba lagi dalam beberapa saat." />
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title="Riwayat Pembayaran" description="Data transaksi pembayaran dari Finance API.">
        <Button variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Receipt}
          iconBgClass="bg-accent-soft"
          iconColorClass="text-accent"
          label="Total Transaksi"
          value={payments.length}
        />
        <StatCard
          icon={ArrowDownLeft}
          iconBgClass="bg-success/15"
          iconColorClass="text-success"
          label="Terkonfirmasi"
          value={confirmedCount}
        />
        <StatCard
          icon={ArrowUpRight}
          iconBgClass="bg-danger/15"
          iconColorClass="text-danger"
          label="Total Diterima"
          value={formatCurrency(confirmedAmount)}
        />
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
              placeholder="Cari nomor pembayaran, nama siswa, atau referensi"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </TextField>
        </Card.Header>

        <Card.Content>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border/70">
                  <th className={tableHeadCellClass}>Nomor</th>
                  <th className={tableHeadCellClass}>Siswa</th>
                  <th className={tableHeadCellClass}>Metode</th>
                  <th className={tableHeadCellClass}>Total</th>
                  <th className={`${tableHeadCellClass} hidden md:table-cell`}>Tanggal</th>
                  <th className={tableHeadCellClass}>Status</th>
                    <th className={tableHeadCellClass}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                    <td className={`${tableBodyCellClass} font-mono text-xs`}>{payment.payment_number}</td>
                    <td className={tableBodyCellClass}>
                      <div>
                        <p className="font-medium text-default-700">{payment.student?.fullname ?? 'Unknown Student'}</p>
                        <p className="text-xs text-default-500 mt-0.5">
                          {payment.student?.nipd || payment.student?.nisn || '-'}
                        </p>
                      </div>
                    </td>
                    <td className={`${tableBodyCellClass} capitalize`}>{payment.payment_method}</td>
                    <td className={`${tableBodyCellClass} font-semibold`}>{formatCurrency(payment.total_amount)}</td>
                    <td className={`${tableBodyCellClass} hidden md:table-cell`}>{payment.payment_date}</td>
                    <td className={tableBodyCellClass}>
                      <Chip size="sm" variant="soft" color={statusConfig[payment.status].color}>
                        <Chip.Label>{statusConfig[payment.status].label}</Chip.Label>
                      </Chip>
                    </td>
                    <td className={tableBodyCellClass}>
                      <Link
                        to="/dashboard/student-bills"
                        search={{ student_id: payment.student_id }}
                        className="flex w-8 h-8 items-center justify-center rounded-lg hover:bg-default/60 transition-colors text-default-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                        aria-label="Lihat tagihan siswa"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <EmptyState icon={Receipt} message="Tidak ada data pembayaran." />
          )}

          <TablePagination
            pageIndex={pagination.pageIndex}
            pageCount={table.getPageCount()}
            pageSize={pagination.pageSize}
            totalRows={filteredPayments.length}
            visibleRows={paginatedPayments.length}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPreviousPage={() => table.previousPage()}
            onNextPage={() => table.nextPage()}
          />
        </Card.Content>
      </Card>

      <Card className={surfaceCardClass}>
        <Card.Content className="flex items-center justify-between text-sm">
          <span className="text-default-500">Transaksi void</span>
          <Chip size="sm" variant="soft" color="danger">
            <Chip.Label>{voidCount}</Chip.Label>
          </Chip>
        </Card.Content>
      </Card>
    </div>
  )
}
