import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { GenerateBillModal } from '@/components/student-bills/generate-bill-modal'
import { useRefRombels, useRefStudents } from '@/hooks/use-references'
import { formatCurrency } from '@/lib/format'
import {
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import { getRombelLabel, sortRombelsByJenjang } from '@/lib/tagihan-siswa'
import type { Rombel, Student } from '@/types/finance'
import { Button, Card, Chip, Spinner, useOverlayState } from '@heroui/react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { Calculator, UserRound, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/dashboard/student-bills/')({
  component: ClassListPage,
})

function ClassListPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/dashboard/student-bills' })
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })
  const searchMode = search.search_by === 'student' ? 'student' : 'class'
  const isStudentMode = searchMode === 'student'
  const normalizedSearch = search.search?.trim() ?? ''

  const generateModalState = useOverlayState()
  const [targetClass, setTargetClass] = useState<Rombel | null>(null)

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
          active: true,
          page: 1,
          // per_page: 500,
        }
      : undefined,
    { enabled: isStudentMode },
  )

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [search.search, search.tahun_ajaran_id, search.search_by])

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
      to: '/dashboard/student-bills/$classId',
      params: { classId: rombel.id },
    })
  }

  function openGenerateModal(rombel: Rombel): void {
    setTargetClass(rombel)
    generateModalState.open()
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
      to: '/dashboard/student-bills/$classId/$studentId',
      params: {
        classId: targetClass.id,
        studentId: student.student_id,
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

  if (loading) return <LoadingState minHeight="300px" />
  if (error) {
    return isStudentMode ? (
      <ErrorState message="Gagal memuat daftar siswa." detail="Silakan coba lagi dalam beberapa saat." />
    ) : (
      <ErrorState message="Gagal memuat daftar kelas." detail="Silakan coba lagi dalam beberapa saat." />
    )
  }

  return (
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
                          <Button
                            size="sm"
                            variant="secondary"
                            isDisabled={!hasClass}
                            onPress={() => selectStudent(student)}
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
    </div>
  )
}
