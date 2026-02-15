import { Button, ComboBox, Input, ListBox, Spinner, Avatar } from '@heroui/react'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useRefStudents } from '@/hooks/use-references'
import type { Student } from '@/types/finance'

const MIN_SEARCH_LENGTH = 2

interface StudentSearchSelectProps {
  value: string[]
  onChange: (nextValue: string[]) => void
  rombonganBelajarId?: string
  placeholder?: string
  isDisabled?: boolean
}

function studentText(student: Student): string {
  const identity = student.nipd || student.nisn
  if (!identity) {
    return student.fullname
  }

  return `${student.fullname} (${identity})`
}

export function StudentSearchSelect({
  value,
  onChange,
  rombonganBelajarId,
  placeholder = 'Cari siswa (nama, NIPD, atau NISN)',
  isDisabled = false,
}: StudentSearchSelectProps) {
  const [searchValue, setSearchValue] = useState('')
  const [cachedStudents, setCachedStudents] = useState<Record<string, Student>>({})
  const debouncedSearchValue = useDebouncedValue(searchValue.trim(), 300)

  const shouldFetchByRombel = Boolean(rombonganBelajarId && debouncedSearchValue.length === 0)
  const shouldQuery = debouncedSearchValue.length >= MIN_SEARCH_LENGTH || shouldFetchByRombel

  const { data, isFetching } = useRefStudents(
    {
      search: debouncedSearchValue.length >= MIN_SEARCH_LENGTH ? debouncedSearchValue : undefined,
      active: true,
      rombongan_belajar_id: rombonganBelajarId || undefined,
      per_page: 15,
    },
    { enabled: shouldQuery && !isDisabled },
  )

  const students = data?.data ?? []

  useEffect(() => {
    if (students.length === 0) {
      return
    }

    setCachedStudents((previous) => {
      const next = { ...previous }
      for (const student of students) {
        next[student.student_id] = student
      }
      return next
    })
  }, [students])

  const selectedStudents = useMemo(
    () =>
      value.map((studentId) => ({
        studentId,
        student: cachedStudents[studentId] ?? null,
      })),
    [cachedStudents, value],
  )

  function removeStudent(studentId: string): void {
    onChange(value.filter((item) => item !== studentId))
  }

  function addStudent(studentId: string): void {
    if (value.includes(studentId)) {
      return
    }

    onChange([...value, studentId])
    setSearchValue('')
  }

  return (
    <div className="space-y-2">
      <ComboBox
        aria-label="Pilih siswa"
        selectedKey={null}
        onSelectionChange={(key) => {
          if (!key) {
            return
          }
          addStudent(String(key))
        }}
        inputValue={searchValue}
        onInputChange={setSearchValue}
        allowsEmptyCollection
        menuTrigger="input"
        fullWidth
        isDisabled={isDisabled}
      >
        <ComboBox.InputGroup>
          <Input placeholder={placeholder} />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox
            aria-label="Hasil pencarian siswa"
            renderEmptyState={() => (
              <div className="px-3 py-2 text-xs text-default-500">
                {searchValue.trim().length < MIN_SEARCH_LENGTH && !shouldFetchByRombel
                  ? `Ketik minimal ${MIN_SEARCH_LENGTH} karakter`
                  : isFetching
                    ? 'Mencari siswa...'
                    : 'Siswa tidak ditemukan'}
              </div>
            )}
          >
            {students.map((student) => (
              <ListBox.Item
                key={student.student_id}
                id={student.student_id}
                textValue={`${student.fullname} ${student.nipd ?? ''} ${student.nisn ?? ''}`}
                isDisabled={value.includes(student.student_id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <Avatar.Image src={student.photo || undefined} alt={student.fullname} />
                    <Avatar.Fallback>{student.fullname.charAt(0)}</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{student.fullname}</span>
                    <span className="text-xs text-default-500">{student.nipd || student.nisn || '-'}</span>
                  </div>
                </div>
              </ListBox.Item>
            ))}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      {isFetching && (
        <div className="flex items-center gap-2 text-xs text-default-500">
          <Spinner size="sm" />
          Memuat data siswa...
        </div>
      )}

      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStudents.map(({ studentId, student }) => (
            <div
              key={studentId}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1"
            >
              <span className="text-xs text-foreground">{student ? studentText(student) : studentId}</span>
              <Button
                size="sm"
                isIconOnly
                variant="ghost"
                className="h-5 w-5 min-w-0"
                onPress={() => removeStudent(studentId)}
                aria-label={`Hapus siswa ${student?.fullname ?? studentId}`}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
