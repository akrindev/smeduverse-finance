import { createFileRoute, Link } from '@tanstack/react-router'
import { getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import { Download, ExternalLink, Plus, Receipt } from 'lucide-react'
import { Button, Card, Chip, Input, ListBox, Select, TextField, useOverlayState } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import { GenerateFeeModal } from '@/components/spp/generate-fee-modal'
import { GenerateSppModal } from '@/components/spp/generate-spp-modal'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { useBills } from '@/hooks/use-bills'
import { formatCurrency } from '@/lib/format'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import type { BillStatus } from '@/types/finance'

export const Route = createFileRoute('/dashboard/spp')({
  component: SPPPage,
})

const statusConfig: Record<BillStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'default' }> = {
  paid: { label: 'Lunas', color: 'success' },
  partial: { label: 'Sebagian', color: 'warning' },
  unpaid: { label: 'Belum Bayar', color: 'danger' },
  void: { label: 'Void', color: 'default' },
}

function SPPPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | BillStatus>('all')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const generateSppModalState = useOverlayState()
  const generateFeeModalState = useOverlayState()

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
        bill.student?.fullname.toLowerCase().includes(query) ||
        bill.student?.nipd?.toLowerCase().includes(query) ||
        bill.student?.nisn?.toLowerCase().includes(query) ||
        bill.title.toLowerCase().includes(query)
      )
    })
  }, [bills, searchQuery])

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [searchQuery, filterStatus])

  const table = useReactTable({
    data: filteredBills,
    columns: useMemo(() => [{ accessorKey: 'id' }], []),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const paginatedBills = table.getRowModel().rows.map((row) => row.original)
  const paidCount = bills.filter((bill) => bill.status === 'paid').length
  const partialCount = bills.filter((bill) => bill.status === 'partial').length
  const unpaidCount = bills.filter((bill) => bill.status === 'unpaid').length

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message="Gagal memuat data tagihan." detail="Silakan coba lagi dalam beberapa saat." />
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title="Tagihan SPP" description="Daftar tagihan dan pembuatan tagihan bulanan siswa.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="secondary" className="border border-border/70" onPress={generateFeeModalState.open}>
            <Plus className="w-4 h-4 mr-2" />
            Tagihan Lain
          </Button>
          <Button variant="primary" className="bg-accent text-accent-foreground" onPress={generateSppModalState.open}>
            <Plus className="w-4 h-4 mr-2" />
            Generate SPP
          </Button>
        </div>
      </PageHeader>

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
                  placeholder="Cari nomor tagihan, nama siswa, NIPD/NISN, atau judul"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </TextField>
            </div>

            <div className="w-full sm:w-[220px]">
              <Select
                aria-label="Filter status tagihan"
                selectedKey={filterStatus}
                onSelectionChange={(key) => setFilterStatus((key ?? 'all') as 'all' | BillStatus)}
                fullWidth
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="Semua status">Semua status</ListBox.Item>
                    <ListBox.Item id="unpaid" textValue="Belum bayar">Belum bayar</ListBox.Item>
                    <ListBox.Item id="partial" textValue="Sebagian">Sebagian</ListBox.Item>
                    <ListBox.Item id="paid" textValue="Lunas">Lunas</ListBox.Item>
                    <ListBox.Item id="void" textValue="Void">Void</ListBox.Item>
                  </ListBox>
                </Select.Popover>
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
                  <th className={tableHeadCellClass}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBills.map((bill) => (
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
                        <p className="text-xs text-default-500 mt-0.5">{bill.student?.nipd || bill.student?.nisn || '-'}</p>
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
                    <td className={tableBodyCellClass}>
                      <Link to="/dashboard/student-bills" search={{ student_id: bill.student_id }}>
                        <Button size="sm" variant="ghost" isIconOnly aria-label="Lihat tagihan siswa">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBills.length === 0 && <EmptyState icon={Receipt} message="Tidak ada data tagihan ditemukan." />}

          <TablePagination
            pageIndex={pagination.pageIndex}
            pageCount={table.getPageCount()}
            pageSize={pagination.pageSize}
            totalRows={filteredBills.length}
            visibleRows={paginatedBills.length}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPreviousPage={() => table.previousPage()}
            onNextPage={() => table.nextPage()}
          />
        </Card.Content>
      </Card>

      <GenerateSppModal state={generateSppModalState} />
      <GenerateFeeModal state={generateFeeModalState} />
    </div>
  )
}
