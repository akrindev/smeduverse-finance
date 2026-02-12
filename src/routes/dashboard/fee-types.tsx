import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Chip, Input, TextField } from '@heroui/react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Search, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { useFeeTypes } from '@/hooks/use-fee-types'
import { TablePagination } from '@/lib/table-pagination'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/fee-types')({
  component: FeeTypesPage,
})

const billingCycleLabels: Record<string, string> = {
  monthly: 'Bulanan',
  one_time: 'Sekali',
  custom: 'Kustom',
}

function FeeTypesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })

  const { data, isLoading, isPlaceholderData, error } = useFeeTypes({
    page: pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    search: searchQuery || undefined,
  })
  const feeTypesData = data?.data ?? []
  const meta = data?.meta

  const table = useReactTable({
    data: feeTypesData,
    columns: useMemo(() => [{ accessorKey: 'id' }], []),
    pageCount: meta?.last_page ?? -1,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  if (isLoading && !isPlaceholderData) {
    return <LoadingState minHeight="400px" />
  }

  if (error) {
    return <ErrorState message="Gagal memuat data. Silakan coba lagi." />
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title="Jenis Biaya" description="Kelola jenis biaya dan tagihan sekolah">
        <Button
          variant="primary"
          className="bg-accent text-accent-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Jenis Biaya
        </Button>
      </PageHeader>

      <Card className={surfaceCardClass}>
        <Card.Header className={cardHeaderClass}>
          <TextField fullWidth>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-500 z-10" />
              <Input
                placeholder="Cari jenis biaya..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }))
                }}
              />
            </div>
          </TextField>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border/70">
                  <th className={tableHeadCellClass}>Kode</th>
                  <th className={tableHeadCellClass}>Nama</th>
                  <th className={`${tableHeadCellClass} hidden sm:table-cell`}>Siklus</th>
                  <th className={`${tableHeadCellClass} hidden md:table-cell`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {feeTypesData.map((feeType) => (
                  <tr key={feeType.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                    <td className={`${tableBodyCellClass} font-mono text-xs text-default-500`}>{feeType.code}</td>
                    <td className={`${tableBodyCellClass} font-medium`}>{feeType.name}</td>
                    <td className={`${tableBodyCellClass} hidden sm:table-cell`}>
                      <Chip size="sm" variant="soft" color="default">
                        <Chip.Label>{billingCycleLabels[feeType.billing_cycle]}</Chip.Label>
                      </Chip>
                    </td>
                    <td className={`${tableBodyCellClass} hidden md:table-cell`}>
                      <Chip size="sm" variant="soft" color={feeType.is_active ? 'success' : 'default'}>
                        <Chip.Label>{feeType.is_active ? 'Aktif' : 'Nonaktif'}</Chip.Label>
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {feeTypesData.length === 0 && (
            <EmptyState icon={Search} message="Tidak ada jenis biaya ditemukan" />
          )}

          <TablePagination
            pageIndex={pagination.pageIndex}
            pageCount={table.getPageCount()}
            pageSize={pagination.pageSize}
            totalRows={meta?.total ?? 0}
            visibleRows={feeTypesData.length}
            canPreviousPage={table.getCanPreviousPage()}
            canNextPage={table.getCanNextPage()}
            onPreviousPage={() => table.previousPage()}
            onNextPage={() => table.nextPage()}
          />
        </Card.Content>
      </Card>
    </div>
  )
}
