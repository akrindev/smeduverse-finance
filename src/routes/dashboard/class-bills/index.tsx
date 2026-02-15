import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { GenerateBillModal } from '@/components/student-bills/generate-bill-modal'
import { StudentDetailModal } from '@/components/student-bills/student-detail-modal'
import { useRefRombels, useRefStudents, useRefTahunAjarans } from '@/hooks/use-references'
import { formatCurrency } from '@/lib/format'
import {
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import { getRombelLabel, sortRombelsByJenjang } from '@/lib/tagihan-siswa'
import type { Rombel, Student } from '@/types/finance'
import type { ClassBillsSearch } from '../class-bills'
import { Button, Card, Chip, Input, Label, ListBox, Select, Spinner, TextField, useOverlayState } from '@heroui/react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Calculator, Eye, Search, UserRound, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/dashboard/class-bills/')({
  component: ClassListPage,
})

function ClassListPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/dashboard/class-bills' })
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })
  const searchMode = search.search_by === 'student' ? 'student' : 'class'
  const isStudentMode = searchMode === 'student'
  const normalizedSearch = search.search?.trim() ?? ''

  const searchPlaceholder = isStudentMode ? 'Cari siswa...' : 'Cari kelas...'
  const [localSearch, setLocalSearch] = useState(search.search || '')

  const generateModalState = useOverlayState()
  const detailModalState = useOverlayState()
  const [targetClass, setTargetClass] = useState<Rombel | null>(null)
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null)

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
      search: isStudentMode ? undefined : search.search,
      tahun_ajaran_id: search.tahun_ajaran_id,
      semester_id: search.semester_id,
    },
    { enabled: !isStudentMode },
  )

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isPlaceholderData: studentsPlaceholder,
    isFetching: studentsFetching,
    error: studentsError,
  } = useRefStudents(
    isStudentMode
      ? {
          search: normalizedSearch || undefined,
          page: 1,
          tahun_ajaran_id: search.tahun_ajaran_id,
          semester_id: search.semester_id,
        }
      : undefined,
    { enabled: isStudentMode },
  )

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [search.search, search.tahun_ajaran_id, search.semester_id, search.search_by])

  const sortedRombels = useMemo(
    () => sortRombelsByJenjang(rombelsData?.data ?? []),
    [rombelsData?.data],
  )

  const filteredStudents = useMemo(() => {
    const allStudents = studentsData?.data ?? []
    const selectedYear = search.tahun_ajaran_id

    const studentsInYear = selectedYear
      ? allStudents.filter((student) =>
          (student.rombel_aktif ?? []).some(
            (rombel) => Number(rombel.tahun_ajaran_id ?? 0) === selectedYear,
          ),
        )
      : allStudents

    return [...studentsInYear].sort((left, right) =>
      left.fullname.localeCompare(right.fullname, 'id', { sensitivity: 'base' }),
    )
  }, [search.tahun_ajaran_id, studentsData?.data])

  const pagedStudents = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize
    return filteredStudents.slice(start, start + pagination.pageSize)
  }, [filteredStudents, pagination.pageIndex, pagination.pageSize])

  const classRows = sortedRombels
  const studentRows = pagedStudents

  const studentPageCount = Math.max(
    Math.ceil(filteredStudents.length / pagination.pageSize),
    1,
  )

  const pageCount = isStudentMode
    ? studentPageCount
    : (rombelsData?.meta?.last_page ?? -1)

  const totalRows = isStudentMode
    ? filteredStudents.length
    : (rombelsData?.meta?.total ?? 0)

  const visibleRows = isStudentMode ? studentRows.length : classRows.length

  const canPreviousPage = pagination.pageIndex > 0
  const canNextPage = isStudentMode
    ? pagination.pageIndex + 1 < studentPageCount
    : pagination.pageIndex + 1 < (rombelsData?.meta?.last_page ?? 1)

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

  function openDetailModal(student: Student): void {
    setSelectedStudentForDetail(student)
    detailModalState.open()
  }

  function pickStudentClass(student: Student): Rombel | null {
    const activeClasses = student.rombel_aktif ?? []
    if (activeClasses.length === 0) return null

    const selectedYear = search.tahun_ajaran_id
    if (selectedYear) {
      const classInSelectedYear = activeClasses.find(
        (rombel) => Number(rombel.tahun_ajaran_id ?? 0) === selectedYear,
      )

      if (classInSelectedYear) {
        return classInSelectedYear
      }
    }

    return activeClasses[0]
  }

  function selectStudent(student: Student): void {
    const targetClass = pickStudentClass(student)
    if (!targetClass) return

    navigate({
      to: '/dashboard/student-bills/$studentId',
      params: {
        studentId: student.student_id,
      },
      search: {
        classId: targetClass.id,
        tahun_ajaran_id: search.tahun_ajaran_id,
        semester_id: search.semester_id,
      },
    })
  }

  const loading = isStudentMode
    ? studentsLoading && !studentsPlaceholder
    : rombelsLoading && !rombelsPlaceholder

  const error = isStudentMode ? studentsError : rombelsError
  const isFetching = isStudentMode
    ? studentsFetching && !studentsPlaceholder
    : rombelsFetching

  const pageTitle = isStudentMode ? 'Tagihan Siswa' : 'Tagihan Kelas'
  const pageDescription = isStudentMode
    ? 'Daftar seluruh siswa untuk melihat dan mengelola tagihan secara individu.'
    : 'Daftar seluruh kelas untuk melihat dan mengelola tagihan per rombongan belajar.'

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
        {isStudentMode ? (
          <ErrorState message="Gagal memuat daftar siswa." detail="Silakan coba lagi dalam beberapa saat." />
        ) : (
          <ErrorState message="Gagal memuat daftar kelas." detail="Silakan coba lagi dalam beberapa saat." />
        )}
      </div>
    )
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title={pageTitle} description={pageDescription} />

      <div className="gap-4 grid grid-cols-1 md:grid-cols-4 mb-6">
        <TextField className="md:col-span-2">
          <Label>Cari</Label>
          <div className="relative">
            <Search className="top-1/2 left-3 z-10 absolute w-4 h-4 text-default-500 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
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

          {isStudentMode ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border/70 border-t">
                    <th className={tableHeadCellClass}>Siswa</th>
                    <th className={tableHeadCellClass}>NIPD / NISN</th>
                    <th className={tableHeadCellClass}>Kelas Aktif</th>
                    <th className={tableHeadCellClass}>Jenjang</th>
                    <th className={`${tableHeadCellClass} text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRows.map((student) => {
                    const activeClass = pickStudentClass(student)
                    const activeClassLabel = activeClass ? getRombelLabel(activeClass) : '-'
                    const hasClass = Boolean(activeClass)

                    return (
                      <tr key={student.student_id} className="hover:bg-surface/60 border-border/50 border-t transition-colors">
                        <td className={`${tableBodyCellClass} font-semibold`}>{student.fullname}</td>
                        <td className={tableBodyCellClass}>{student.nipd || student.nisn || '-'}</td>
                        <td className={tableBodyCellClass}>{activeClassLabel}</td>
                        <td className={tableBodyCellClass}>{activeClass?.tingkat_kelas ?? '-'}</td>
                        <td className={`${tableBodyCellClass} text-right`}>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              isIconOnly
                              onPress={() => openDetailModal(student)}
                              aria-label="Lihat detail siswa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              isIconOnly
                              isDisabled={!hasClass}
                              onPress={() => selectStudent(student)}
                            >
                              Pilih
                            </Button>

                            <Button
                              size="sm"
                              variant="secondary"
                              isDisabled={!hasClass}
                              onPress={() => selectStudent(student)}
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
          ) : (
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
          )}

          {visibleRows === 0 && (
            <div className="py-12">
              <div className="flex flex-col justify-center items-center text-center">
                {isStudentMode ? (
                  <UserRound className="mb-4 w-12 h-12 text-default-300" />
                ) : (
                  <Users className="mb-4 w-12 h-12 text-default-300" />
                )}
                <h3 className="font-semibold text-default-700 text-lg">
                  {isStudentMode ? 'Tidak ada siswa ditemukan' : 'Tidak ada kelas ditemukan'}
                </h3>
                <p className="max-w-xs text-default-500 text-sm">
                  {isStudentMode
                    ? 'Coba kata kunci lain atau ubah filter pencarian.'
                    : 'Data kelas tidak tersedia atau tidak ada yang aktif.'}
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

      <StudentDetailModal
        student={selectedStudentForDetail}
        state={detailModalState}
      />
      </div>
    </div>
  )
}
