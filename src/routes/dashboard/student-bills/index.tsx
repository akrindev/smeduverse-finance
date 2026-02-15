import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { StudentDetailModal } from '@/components/student-bills/student-detail-modal'
import { useRefStudents, useRefTahunAjarans } from '@/hooks/use-references'
import {
  pageShellClass,
  surfaceCardClass,
  tableBodyCellClass,
  tableHeadCellClass,
} from '@/lib/page-styles'
import { TablePagination } from '@/lib/table-pagination'
import { formatCurrency } from '@/lib/format'
import { getRombelLabel, getStudentStatusInfo, getStudentLatestRombel } from '@/lib/tagihan-siswa'
import type { Rombel, Student } from '@/types/finance'
import { Button, Card, Chip, Input, Label, ListBox, Select, Spinner, TextField, useOverlayState, toast, Avatar } from '@heroui/react'
import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, Search, UserRound, RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { StudentBillsSearch } from '../student-bills'

export const Route = createFileRoute('/dashboard/student-bills/')({
  component: StudentListPage,
})

const genderLabels: Record<string, string> = {
  l: 'Laki-laki',
  p: 'Perempuan',
}

function StudentListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useSearch({ from: '/dashboard/student-bills' })
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 })
  const normalizedSearch = search.search?.trim() ?? ''

  const [localSearch, setLocalSearch] = useState(search.search || '')

  const detailModalState = useOverlayState()
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null)

  const { data: years } = useRefTahunAjarans()

  useEffect(() => {
    setLocalSearch(search.search || '')
  }, [search.search])

  const updateSearch = (updates: Partial<StudentBillsSearch>) => {
    navigate({
      to: '/dashboard/student-bills',
      search: (prev: StudentBillsSearch) => {
        const next = { ...prev, ...updates }

        Object.keys(next).forEach((key) => {
          if (next[key as keyof StudentBillsSearch] === undefined) {
            delete next[key as keyof StudentBillsSearch]
          }
        })
        return next
      },
    })
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['references', 'students'] })
    toast.success('Daftar siswa diperbarui')
  }

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isPlaceholderData: studentsPlaceholder,
    isFetching: studentsFetching,
    error: studentsError,
  } = useRefStudents(
    {
      search: normalizedSearch || undefined,
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
      tahun_ajaran_id: search.tahun_ajaran_id,
      semester_id: search.semester_id,
    }
  )

  useEffect(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }))
  }, [search.search, search.tahun_ajaran_id, search.semester_id])

  const allStudents = studentsData?.data ?? []
  const meta = studentsData?.meta
  const isServerPaginated = Boolean(meta)

  const studentRows = useMemo(() => {
    if (isServerPaginated) return allStudents
    const start = pagination.pageIndex * pagination.pageSize
    return allStudents.slice(start, start + pagination.pageSize)
  }, [isServerPaginated, allStudents, pagination.pageIndex, pagination.pageSize])

  const pageCount = isServerPaginated 
    ? (meta?.last_page ?? 1) 
    : Math.max(Math.ceil(allStudents.length / pagination.pageSize), 1)

  const totalRows = isServerPaginated 
    ? (meta?.total ?? 0) 
    : allStudents.length

  const visibleRows = studentRows.length

  const canPreviousPage = pagination.pageIndex > 0
  const canNextPage = pagination.pageIndex + 1 < pageCount

  function previousPage(): void {
    if (!canPreviousPage) return
    setPagination((previous) => ({ ...previous, pageIndex: previous.pageIndex - 1 }))
  }

  function nextPage(): void {
    if (!canNextPage) return
    setPagination((previous) => ({ ...previous, pageIndex: previous.pageIndex + 1 }))
  }

  function openDetailModal(student: Student): void {
    setSelectedStudentForDetail(student)
    detailModalState.open()
  }

  function pickStudentClass(student: Student): Rombel | null {
    const activeClasses = student.rombel_aktif ?? []
    
    if (activeClasses.length > 0) {
      const selectedYear = search.tahun_ajaran_id
      if (selectedYear) {
        const classInSelectedYear = activeClasses.find(
          (rombel) => Number(rombel.tahun_ajaran_id ?? 0) === selectedYear,
        )
        if (classInSelectedYear) return classInSelectedYear
      }
      return activeClasses[0]
    }

    return getStudentLatestRombel(student)
  }

  function selectStudent(student: Student): void {
    const targetClass = pickStudentClass(student)

    navigate({
      to: '/dashboard/student-bills/$studentId',
      params: {
        studentId: student.student_id,
      },
      search: {
        classId: targetClass?.id,
        tahun_ajaran_id: search.tahun_ajaran_id,
        semester_id: search.semester_id,
        from: 'student',
      },
    })
  }

  const pageTitle = 'Tagihan Siswa'
  const pageDescription = 'Daftar seluruh siswa untuk melihat dan mengelola tagihan secara individu.'

  if (studentsLoading && !studentsPlaceholder) return (
    <div className={pageShellClass}>
      <PageHeader title={pageTitle} description={pageDescription} />
      <LoadingState minHeight="300px" />
    </div>
  )
  
  if (studentsError) {
    return (
      <div className={pageShellClass}>
        <PageHeader title={pageTitle} description={pageDescription} />
        <ErrorState message="Gagal memuat daftar siswa." detail="Silakan coba lagi dalam beberapa saat." />
      </div>
    )
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title={pageTitle} description={pageDescription} />

      <div className="flex md:flex-row flex-col gap-4 mb-6">
        <TextField>
          <Label>Cari Siswa</Label>
          <div className="relative">
            <Search className="top-1/2 left-3 z-10 absolute w-4 h-4 text-default-500 -translate-y-1/2" />
            <Input
              placeholder="Cari siswa..."
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

        <div className="flex items-end">
          <Button
            variant="secondary"
            isDisabled={studentsFetching}
            onPress={handleRefresh}
            className="md:mb-0 mb-4"
          >
            <RefreshCcw className={`w-4 h-4 mr-2 ${studentsFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-6">
      <Card className={surfaceCardClass}>
        <Card.Content className="relative min-h-[300px]">
          {studentsFetching && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-surface/50 backdrop-blur-[1px] transition-opacity">
              <Spinner size="lg" />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border/70 border-t">
                      <th className={tableHeadCellClass}>Siswa</th>
                      <th className={tableHeadCellClass}>Gender / Tgl Lahir</th>
                      <th className={tableHeadCellClass}>Kelas Aktif</th>
                      <th className={tableHeadCellClass}>Jenjang</th>
                      <th className={tableHeadCellClass}>Total Tagihan</th>
                      <th className={tableHeadCellClass}>Sisa</th>
                      <th className={`${tableHeadCellClass} text-right`}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentRows.map((student) => {
                      const activeClass = pickStudentClass(student)
                      const hasClass = Boolean(activeClass)
                      const statusInfo = getStudentStatusInfo(student)
                      const summary = student.summary

                      return (
                        <tr key={student.student_id} className="hover:bg-surface/60 border-border/50 border-t transition-colors">
                          <td className={tableBodyCellClass}>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <Avatar.Image
                                  src={student.photo || undefined}
                                  alt={student.fullname}
                                />
                                <Avatar.Fallback>
                                  {student.fullname.charAt(0)}
                                </Avatar.Fallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold">{student.fullname}</span>
                                <span className="text-[10px] text-default-500 font-mono">{student.nipd || '-'}</span>
                              </div>
                            </div>
                          </td>
                          <td className={tableBodyCellClass}>
                            <div className="flex flex-col">
                              <span>{student.jenis_kelamin ? genderLabels[student.jenis_kelamin.toLowerCase()] || student.jenis_kelamin : '-'}</span>
                              <span className="text-[10px] text-default-500">{student.tanggal_lahir || '-'}</span>
                            </div>
                          </td>
                          <td className={tableBodyCellClass}>
                            <div className="flex flex-wrap items-center gap-2">
                              {activeClass && (
                                <span className={statusInfo.status === 1 ? 'font-medium' : 'text-default-500'}>
                                  {getRombelLabel(activeClass)}
                                </span>
                              )}
                              {statusInfo.status !== 1 && (
                                <Chip size="sm" variant="soft" color={statusInfo.color}>
                                  <Chip.Label>{statusInfo.label}</Chip.Label>
                                </Chip>
                              )}
                              {!activeClass && statusInfo.status === 1 && '-'}
                            </div>
                          </td>
                          <td className={tableBodyCellClass}>{activeClass?.tingkat_kelas ?? '-'}</td>
                          <td className={tableBodyCellClass}>
                            {summary ? formatCurrency(summary.total_net) : '-'}
                          </td>
                          <td className={`${tableBodyCellClass} font-semibold ${summary?.total_outstanding ? 'text-danger' : 'text-success'}`}>
                            {summary ? formatCurrency(summary.total_outstanding) : '-'}
                          </td>
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

          {visibleRows === 0 && (
            <div className="py-12">
              <div className="flex flex-col justify-center items-center text-center">
                <UserRound className="mb-4 w-12 h-12 text-default-300" />
                <h3 className="font-semibold text-default-700 text-lg">
                  Tidak ada siswa ditemukan
                </h3>
                <p className="max-w-xs text-default-500 text-sm">
                  Coba kata kunci lain atau ubah filter pencarian.
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

      <StudentDetailModal
        student={selectedStudentForDetail}
        state={detailModalState}
      />
      </div>
    </div>
  )
}
