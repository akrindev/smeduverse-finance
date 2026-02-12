import { PageHeader } from '@/components/shared/page-header'
import { GenerateBillModal } from '@/components/student-bills/generate-bill-modal'
import { useRefSemesters, useRefTahunAjarans } from '@/hooks/use-references'
import { pageShellClass } from '@/lib/page-styles'
import { Input, Label, ListBox, Select, TextField, useOverlayState } from '@heroui/react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Outlet, useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

const studentBillsSearchSchema = z.object({
  search: z.string().optional(),
  tahun_ajaran_id: z.number().optional(),
  semester_id: z.number().optional(),
})

export type StudentBillsSearch = z.infer<typeof studentBillsSearchSchema>

export const Route = createFileRoute('/dashboard/student-bills')({
  validateSearch: (search) => studentBillsSearchSchema.parse(search),
  component: StudentBillsLayout,
})

function StudentBillsLayout() {
  const search = useSearch({ from: '/dashboard/student-bills' })
  const navigate = useNavigate({ from: Route.fullPath })
  const queryClient = useQueryClient()
  
  const [localSearch, setLocalSearch] = useState(search.search || '')
  const generateModalState = useOverlayState()

  const { data: years } = useRefTahunAjarans()
  const { data: semesters } = useRefSemesters()

  useEffect(() => {
    setLocalSearch(search.search || '')
  }, [search.search])

  const updateSearch = (updates: Partial<StudentBillsSearch>) => {
    navigate({
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

  return (
    <div className={pageShellClass}>
      <PageHeader title="Tagihan Siswa" description="Alur kelas ke siswa untuk melihat dan membayar tagihan.">
        {/* <Button
          variant="primary"
          className="bg-accent text-accent-foreground"
          onPress={generateModalState.open}
        >
          <Calculator className="mr-2 w-4 h-4" />
          Generate Tagihan
        </Button> */}
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <TextField className="md:col-span-2">
          <Label>Cari</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-default-500 z-10" />
            <Input
              placeholder="Cari kelas atau siswa..."
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

        <Select
          aria-label="Semester"
          placeholder="Semua Semester"
          value={search.semester_id?.toString() || ''}
          onChange={(val) => updateSearch({ semester_id: val ? Number(val) : undefined })}
        >
          <Label>Semester</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="" textValue="Semua Semester">Semua Semester</ListBox.Item>
              {(semesters?.data ?? []).map((s) => (
                <ListBox.Item key={s.id} id={s.id.toString()} textValue={s.nama || s.name || ''}>
                  {s.nama || s.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      <Outlet />

      <GenerateBillModal
        state={generateModalState}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['bills'] })
          queryClient.invalidateQueries({ queryKey: ['references', 'rombels'] })
        }}
      />
    </div>
  )
}
