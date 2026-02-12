import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'
import { useRefRombels } from '@/hooks/use-references'
import { formatCurrency } from '@/lib/format'
import { getRombelLabel, sortRombelsByJenjang } from '@/lib/tagihan-siswa'
import type { Rombel } from '@/types/finance'
import { TablePagination } from '@/lib/table-pagination'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useMemo, useState, useEffect } from 'react'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Button, Card, Chip, Spinner } from '@heroui/react'
import {
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { Users } from 'lucide-react'

export const Route = createFileRoute('/dashboard/student-bills/')({
  component: ClassListPage,
})

function ClassListPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/dashboard/student-bills' })
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })
  
  const {
    data: rombelsData,
    isLoading: rombelsLoading,
    isPlaceholderData,
    isFetching,
    error: rombelsError,
  } = useRefRombels({ 
    per_page: pagination.pageSize, 
    page: pagination.pageIndex + 1,
    search: search.search,
    tahun_ajaran_id: search.tahun_ajaran_id,
  })

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [search.search, search.tahun_ajaran_id])

  const meta = rombelsData?.meta
  const rombels = useMemo(() => sortRombelsByJenjang(rombelsData?.data ?? []), [rombelsData?.data])

  const table = useReactTable({
    data: rombels,
    columns: useMemo(() => [{ accessorKey: 'id' }], []),
    pageCount: meta?.last_page ?? -1,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  })

  function selectClass(rombel: Rombel): void {
    if ((rombel.anggota_count ?? 0) === 0) return
    navigate({
      to: '/dashboard/student-bills/$classId',
      params: { classId: rombel.id },
    })
  }

  if (rombelsLoading && !isPlaceholderData) return <LoadingState minHeight="300px" />
  if (rombelsError) return <ErrorState message="Gagal memuat daftar kelas." detail="Silakan coba lagi dalam beberapa saat." />

  return (
    <div className="space-y-6">
      <Card className={surfaceCardClass}>
        <Card.Content className="relative min-h-[300px]">
          {isFetching && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px] transition-opacity">
              <Spinner size="lg" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-border/70">
                  <th className={tableHeadCellClass}>Nama Kelas</th>
                  <th className={tableHeadCellClass}>Jenjang</th>
                  <th className={tableHeadCellClass}>Jumlah Siswa</th>
                  <th className={tableHeadCellClass}>Total Tagihan</th>
                  <th className={tableHeadCellClass}>Total Terbayar</th>
                  <th className={tableHeadCellClass}>Sisa Piutang</th>
                  <th className={tableHeadCellClass}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rombels.map((rombel) => {
                  const metrics = rombel.summary
                  const activeStudents = rombel.anggota_count ?? 0
                  const isDisabled = activeStudents === 0
                  const label = getRombelLabel(rombel)

                  return (
                    <tr key={rombel.id} className="border-t border-border/50 hover:bg-surface/60 transition-colors">
                      <td className={`${tableBodyCellClass} font-semibold`}>{label}</td>
                      <td className={tableBodyCellClass}>{rombel.tingkat_kelas ?? '-'}</td>
                      <td className={tableBodyCellClass}>
                        <Chip size="sm" variant="soft" color={isDisabled ? 'default' : 'accent'}>
                          <Chip.Label>{activeStudents} siswa</Chip.Label>
                        </Chip>
                      </td>
                      <td className={tableBodyCellClass}>{formatCurrency(metrics?.total_net ?? 0)}</td>
                      <td className={tableBodyCellClass}>{formatCurrency(metrics?.total_paid ?? 0)}</td>
                      <td className={`${tableBodyCellClass} font-semibold ${ (metrics?.total_outstanding ?? 0) > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatCurrency(metrics?.total_outstanding ?? 0)}
                      </td>
                      <td className={tableBodyCellClass}>
                        <Button
                          size="sm"
                          variant="secondary"
                          isDisabled={isDisabled}
                          onPress={() => selectClass(rombel)}
                        >
                          Pilih
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {rombels.length === 0 && (
            <div className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Users className="w-12 h-12 text-default-300 mb-4" />
                <h3 className="text-lg font-semibold text-default-700">Tidak ada kelas ditemukan</h3>
                <p className="text-sm text-default-500 max-w-xs">Data kelas tidak tersedia atau tidak ada yang aktif.</p>
              </div>
            </div>
          )}

          <TablePagination
            pageIndex={pagination.pageIndex}
            pageCount={table.getPageCount()}
            pageSize={pagination.pageSize}
            totalRows={meta?.total ?? 0}
            visibleRows={rombels.length}
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
