import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { GenerateBillModal } from '@/components/student-bills/generate-bill-modal'
import { useRefRombels, useRefTahunAjarans } from '@/hooks/use-references'
import { formatCurrency } from '@/lib/format'
import {
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import { getRombelLabel, sortRombelsByJenjang } from '@/lib/tagihan-siswa'
import type { Rombel } from '@/types/finance'
import { Button, Card, Chip, Input, Label, ListBox, Select, Spinner, TextField, useOverlayState } from '@heroui/react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Calculator, Search, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ClassBillsSearch } from '../class-bills'

export const Route = createFileRoute('/dashboard/class-bills/')({
  component: ClassListPage,
})

function ClassListPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/dashboard/class-bills' })
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })

  const [localSearch, setLocalSearch] = useState(search.search || '')

  const generateModalState = useOverlayState()
  const [targetClass, setTargetClass] = useState<Rombel | null>(null)

  const { data: years } = useRefTahunAjarans()

  useEffect(() => {
    setLocalSearch(search.search || '')
  }, [search.search])

  const updateSearch = (updates: Partial<ClassBillsSearch>) => {
    navigate({
      to: '/dashboard/class-bills',
      search: (prev: ClassBillsSearch) => {
        const next = { ...prev, ...updates }

        if (updates.tahun_ajaran_id !== undefined && updates.tahun_ajaran_id !== prev.tahun_ajaran_id) {
          delete next.semester_id
        }

        Object.keys(next).forEach((key) => {
          if (next[key as keyof ClassBillsSearch] === undefined) {
            delete next[key as keyof ClassBillsSearch]
          }
        })
        return next
      },
    })
  }

  const {
    data: rombelsData,
    isLoading: rombelsLoading,
    isPlaceholderData: rombelsPlaceholder,
    isFetching: rombelsFetching,
    error: rombelsError,
    refetch,
  } = useRefRombels(
    {
      per_page: pagination.pageSize,
      page: pagination.pageIndex + 1,
      search: search.search,
      tahun_ajaran_id: search.tahun_ajaran_id,
      semester_id: search.semester_id,
    }
  )

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [search.search, search.tahun_ajaran_id, search.semester_id])

  const sortedRombels = useMemo(
    () => sortRombelsByJenjang(rombelsData?.data ?? []),
    [rombelsData?.data],
  )

  const classRows = sortedRombels

  const pageCount = rombelsData?.meta?.last_page ?? -1
  const totalRows = rombelsData?.meta?.total ?? 0
  const visibleRows = classRows.length

  const canPreviousPage = pagination.pageIndex > 0
  const canNextPage = pagination.pageIndex + 1 < (rombelsData?.meta?.last_page ?? 1)

  function previousPage(): void {
    if (!canPreviousPage) return
    setPagination((previous) => ({ ...previous, pageIndex: previous.pageIndex - 1 }))
  }

  function nextPage(): void {
    if (!canNextPage) return
    setPagination((previous) => ({ ...previous, pageIndex: previous.pageIndex + 1 }))
  }

  function selectClass(rombel: Rombel): void {
    if ((rombel.anggota_count ?? 0) === 0) return

    navigate({
      to: '/dashboard/class-bills/$classId',
      params: { classId: rombel.id },
    })
  }

  function openGenerateModal(rombel: Rombel): void {
    setTargetClass(rombel)
    generateModalState.open()
  }

  const loading = rombelsLoading && !rombelsPlaceholder
  const error = rombelsError
  const isFetching = rombelsFetching

  const pageTitle = 'Tagihan Kelas'
  const pageDescription = 'Daftar seluruh kelas untuk melihat dan mengelola tagihan per rombongan belajar.'

  if (loading) return (
    <div className={pageShellClass}>
      <PageHeader title={pageTitle} description={pageDescription} />
      <LoadingState minHeight="300px" />
    </div>
  )
  
  if (error) {
    return (
      <div className={pageShellClass}>
        <PageHeader title={pageTitle} description={pageDescription} />
        <ErrorState message="Gagal memuat daftar kelas." detail="Silakan coba lagi dalam beberapa saat." />
      </div>
    )
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title={pageTitle} description={pageDescription} />

      <div className="flex md:flex-row flex-col gap-4 mb-6">
        <TextField>
          <Label>Cari Kelas</Label>
          <div className="relative">
            <Search className="top-1/2 left-3 z-10 absolute w-4 h-4 text-default-500 -translate-y-1/2" />
            <Input
              placeholder="Cari kelas..."
              className="pl-10"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateSearch({ search: localSearch || undefined })}
              onBlur={() => updateSearch({ search: localSearch || undefined })}
            />
          </div>
        </TextField>

        <Select
          aria-label="Tahun Ajaran"
          placeholder="Semua Tahun"
          value={search.tahun_ajaran_id?.toString() || ''}
          onChange={(val) => updateSearch({ tahun_ajaran_id: val ? Number(val) : undefined })}
        >
          <Label>Tahun Ajaran</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="" textValue="Semua Tahun">Semua Tahun</ListBox.Item>
              {(years?.data ?? []).map((y) => (
                <ListBox.Item key={y.id} id={y.id.toString()} textValue={y.nama || y.name || ''}>
                  {y.nama || y.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <div className="space-y-6">
      <Card className={surfaceCardClass}>
        <Card.Content className="relative min-h-[300px]">
          {isFetching && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-surface/50 backdrop-blur-[1px] transition-opacity">
              <Spinner size="lg" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/70 border-t">
                  <th className={tableHeadCellClass}>Nama Kelas</th>
                  <th className={tableHeadCellClass}>Jenjang</th>
                  <th className={tableHeadCellClass}>Jumlah Siswa</th>
                  <th className={tableHeadCellClass}>Total Tagihan</th>
                  <th className={tableHeadCellClass}>Total Terbayar</th>
                  <th className={tableHeadCellClass}>Sisa Piutang</th>
                  <th className={`${tableHeadCellClass} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {classRows.map((rombel) => {
                  const metrics = rombel.summary
                  const activeStudents = rombel.anggota_count ?? 0
                  const isDisabled = activeStudents === 0
                  const label = getRombelLabel(rombel)

                  return (
                    <tr key={rombel.id} className="hover:bg-surface/60 border-border/50 border-t transition-colors">
                      <td className={`${tableBodyCellClass} font-semibold`}>{label}</td>
                      <td className={tableBodyCellClass}>{rombel.tingkat_kelas ?? '-'}</td>
                      <td className={tableBodyCellClass}>
                        <Chip size="sm" variant="soft" color={isDisabled ? 'default' : 'accent'}>
                          <Chip.Label>{activeStudents} siswa</Chip.Label>
                        </Chip>
                      </td>
                      <td className={tableBodyCellClass}>{formatCurrency(metrics?.total_net ?? 0)}</td>
                      <td className={tableBodyCellClass}>{formatCurrency(metrics?.total_paid ?? 0)}</td>
                      <td className={`${tableBodyCellClass} font-semibold ${
                        (metrics?.total_outstanding ?? 0) > 0 ? 'text-danger' : 'text-success'
                      }`}>
                        {formatCurrency(metrics?.total_outstanding ?? 0)}
                      </td>
                      <td className={`${tableBodyCellClass} text-right`}>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            isIconOnly
                            isDisabled={isDisabled}
                            onPress={() => openGenerateModal(rombel)}
                            aria-label="Generate tagihan"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            isDisabled={isDisabled}
                            onPress={() => selectClass(rombel)}
                          >
                            Pilih
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {visibleRows === 0 && (
            <div className="py-12">
              <div className="flex flex-col justify-center items-center text-center">
                <Users className="mb-4 w-12 h-12 text-default-300" />
                <h3 className="font-semibold text-default-700 text-lg">
                  Tidak ada kelas ditemukan
                </h3>
                <p className="max-w-xs text-default-500 text-sm">
                  Data kelas tidak tersedia atau tidak ada yang aktif.
                </p>
              </div>
            </div>
          )}

          <TablePagination
            pageIndex={pagination.pageIndex}
            pageCount={pageCount}
            pageSize={pagination.pageSize}
            totalRows={totalRows}
            visibleRows={visibleRows}
            canPreviousPage={canPreviousPage}
            canNextPage={canNextPage}
            onPreviousPage={previousPage}
            onNextPage={nextPage}
          />
        </Card.Content>
      </Card>

      {targetClass && (
        <GenerateBillModal
          state={generateModalState}
          selectedClass={targetClass}
          studentIds={[]}
          onSuccess={() => {
            refetch()
          }}
        />
      )}
      </div>
    </div>
  )
}
