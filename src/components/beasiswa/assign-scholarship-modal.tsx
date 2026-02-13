import { Button, Form, Input, Label, ListBox, Modal, Select, Spinner, TextField, useOverlayState, FieldError } from '@heroui/react'
import { useScholarships, useAssignScholarship } from '@/hooks/use-scholarships'
import { useRefTahunAjarans, useRefSemesters } from '@/hooks/use-references'
import { useState } from 'react'
import { StudentSearchSelect } from '@/components/shared/student-search-select'

interface AssignScholarshipModalProps {
  state: ReturnType<typeof useOverlayState>
  onSuccess?: () => void
  initialStudentId?: string
}

export function AssignScholarshipModal({ state, onSuccess, initialStudentId }: AssignScholarshipModalProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialStudentId ? [initialStudentId] : [])
  const [selectedTahunId, setSelectedTahunId] = useState<number | null>(null)

  const { data: scholarshipsData } = useScholarships({ is_active: true, per_page: 100 })
  const scholarships = scholarshipsData?.data ?? []

  const { data: years } = useRefTahunAjarans()
  const { data: semesters } = useRefSemesters({ tahun_ajaran_id: selectedTahunId ?? undefined }, { enabled: !!selectedTahunId })

  const assignMutation = useAssignScholarship()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedStudentIds.length === 0) return

    const formData = new FormData(e.currentTarget)
    const scholarshipId = Number(formData.get('finance_scholarship_id'))
    const semesterId = Number(formData.get('semester_id'))
    const tahunId = Number(formData.get('tahun_ajaran_id'))
    const startDate = formData.get('start_date') as string || null
    const endDate = formData.get('end_date') as string || null

    try {
      for (const studentId of selectedStudentIds) {
        await assignMutation.mutateAsync({
          student_id: studentId,
          finance_scholarship_id: scholarshipId,
          semester_id: semesterId,
          tahun_ajaran_id: tahunId,
          start_date: startDate,
          end_date: endDate,
          is_active: true,
        })
      }

      state.close()
      onSuccess?.()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog aria-label="Assign Beasiswa">
            <Modal.Header>
              <div className="flex-1">
                <Modal.Heading>Assign Beasiswa</Modal.Heading>
                <p className="text-xs text-default-500 mt-1">Berikan beasiswa kepada siswa terpilih</p>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
              <Modal.Body className="space-y-4">
                {!initialStudentId && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Pilih Siswa</Label>
                    <StudentSearchSelect
                      value={selectedStudentIds}
                      onChange={setSelectedStudentIds}
                      placeholder="Cari nama atau NISN siswa..."
                    />
                  </div>
                )}

                <Select isRequired name="finance_scholarship_id">
                  <Label>Program Beasiswa</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {scholarships.map((s) => (
                        <ListBox.Item key={s.id} id={s.id.toString()} textValue={s.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-[10px] text-default-500">{s.code}</span>
                          </div>
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                  <FieldError />
                </Select>

                <div className="grid grid-cols-2 gap-4">
                  <Select 
                    isRequired 
                    name="tahun_ajaran_id"
                    onChange={(val) => setSelectedTahunId(val ? Number(val) : null)}
                  >
                    <Label>Tahun Ajaran</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {(years?.data ?? []).map((y) => (
                          <ListBox.Item key={y.id} id={y.id.toString()} textValue={y.nama || y.name || ''}>
                            {y.nama || y.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    <FieldError />
                  </Select>

                  <Select isRequired name="semester_id" isDisabled={!selectedTahunId}>
                    <Label>Semester</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {(semesters?.data ?? []).map((s) => (
                          <ListBox.Item key={s.id} id={s.id.toString()} textValue={s.nama || s.name || ''}>
                            {s.nama || s.name}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    <FieldError />
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <TextField name="start_date" type="date">
                    <Label>Tanggal Mulai</Label>
                    <Input />
                  </TextField>
                  <TextField name="end_date" type="date">
                    <Label>Tanggal Berakhir</Label>
                    <Input />
                  </TextField>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" onPress={state.close}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-accent text-accent-foreground"
                  isPending={assignMutation.isPending}
                >
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : null}
                      Assign Beasiswa
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
