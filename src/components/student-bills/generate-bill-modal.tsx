import {
  Button,
  FieldError,
  Input,
  ListBox,
  Modal,
  Select,
  TextField,
  Label,
  toast,
  useOverlayState,
  Form,
  Spinner,
} from '@heroui/react'
import { useState, useMemo, useEffect } from 'react'
import { Calculator } from 'lucide-react'
import { useGenerateSpp, useGenerateFee } from '@/hooks/use-bills'
import { useRefTahunAjarans, useRefSemesters, useRefStudents, useRefRombels } from '@/hooks/use-references'
import { useFeeTypes } from '@/hooks/use-fee-types'
import { ApiResponseError } from '@/lib/api-client'
import { firstValidationMessage, todayDateString } from '@/lib/format'
import { MONTH_NAMES } from '@/lib/student-bills'
import type { Rombel } from '@/types/finance'

interface GenerateBillModalProps {
  state: ReturnType<typeof useOverlayState>
  selectedClass?: Rombel | null
  studentIds?: string[]
  onSuccess: () => void
}

export function GenerateBillModal({ state, selectedClass: initialClass, studentIds: initialStudentIds, onSuccess }: GenerateBillModalProps) {
  const [billType, setBillType] = useState<'spp' | 'fee'>('spp')
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState<string>('')
  
  const generateSpp = useGenerateSpp()
  const generateFee = useGenerateFee()
  
  const { data: years } = useRefTahunAjarans()
  const { data: semesters } = useRefSemesters(
    selectedTahunAjaranId ? { tahun_ajaran_id: Number(selectedTahunAjaranId) } : undefined,
  )
  const { data: feeTypesData } = useFeeTypes({ per_page: 100, is_active: true })
  
  const { data: rombelsData } = useRefRombels({
    per_page: 100,
    active_only: true,
  }, { enabled: state.isOpen && !initialClass })

  const rombels = rombelsData?.data ?? []
  const currentClass = initialClass || rombels.find(r => r.id === selectedClassId)
  const targetClassId = initialClass?.id || selectedClassId

  const { data: studentsData, isLoading: studentsLoading } = useRefStudents({
    rombongan_belajar_id: targetClassId,
    per_page: 200,
  }, { enabled: state.isOpen && billType === 'fee' && !!targetClassId && (!initialStudentIds || initialStudentIds.length === 0) })

  useEffect(() => {
    if (state.isOpen) {
      setSelectedClassId('')
      setBillType('spp')
      setSelectedTahunAjaranId('')
    }
  }, [state.isOpen])

  const studentIds = useMemo(() => {
    if (initialStudentIds && initialStudentIds.length > 0) return initialStudentIds
    return studentsData?.data.map(s => s.student_id) ?? []
  }, [initialStudentIds, studentsData])

  const activeYears = useMemo(() => years?.data.filter(y => y.is_active || y.aktif) ?? [], [years])
  const activeSemesters = useMemo(() => semesters?.data.filter(s => s.is_active) ?? [], [semesters])
  const otherFeeTypes = useMemo(() => feeTypesData?.data.filter(ft => ft.billing_cycle !== 'monthly') ?? [], [feeTypesData])

  useEffect(() => {
    if (activeYears.length > 0 && !selectedTahunAjaranId) {
      setSelectedTahunAjaranId(activeYears[0].id.toString())
    }
  }, [activeYears, selectedTahunAjaranId])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!targetClassId) {
      toast.danger('Kelas wajib dipilih.')
      return
    }

    const formData = new FormData(e.currentTarget)
    
    try {
      if (billType === 'spp') {
        await generateSpp.mutateAsync({
          rombongan_belajar_id: targetClassId,
          tahun_ajaran_id: Number(formData.get('tahun_ajaran_id')),
          semester_id: Number(formData.get('semester_id')),
          period_month: Number(formData.get('period_month')),
          period_year: Number(formData.get('period_year')),
          amount: Number(formData.get('amount')),
          due_date: formData.get('due_date') as string || undefined,
          title: formData.get('title') as string || undefined,
        })
        toast.success('Tagihan SPP berhasil dibuat untuk satu kelas.')
      } else {
        if (studentIds.length === 0) {
          toast.danger('Tidak ada siswa di kelas ini untuk ditagihkan.')
          return
        }

        await generateFee.mutateAsync({
          finance_fee_type_id: Number(formData.get('finance_fee_type_id')),
          student_ids: studentIds,
          amount: Number(formData.get('amount')),
          title: formData.get('title') as string,
          due_date: formData.get('due_date') as string || undefined,
        })
        toast.success('Tagihan biaya berhasil dibuat.')
      }
      
      state.close()
      onSuccess()
    } catch (err) {
      if (err instanceof ApiResponseError) {
        toast.danger(firstValidationMessage(err.errors) ?? err.message)
      } else {
        toast.danger('Gagal membuat tagihan.')
      }
    }
  }

  const isPending = generateSpp.isPending || generateFee.isPending || studentsLoading

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog aria-label="Generate tagihan untuk kelas">
            <Form onSubmit={handleSubmit}>
              <Modal.Header>
                <div className="flex-1">
                  <Modal.Heading>Generate Tagihan</Modal.Heading>
                  {currentClass && (
                    <p className="text-xs text-default-500 mt-1">
                      Kelas: {currentClass.nama || currentClass.name}
                    </p>
                  )}
                </div>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="space-y-4 relative">
                {studentsLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-[1px]">
                    <Spinner size="md" />
                  </div>
                )}

                {!initialClass && (
                  <Select
                    aria-label="Pilih Kelas"
                    isRequired
                    fullWidth
                    value={selectedClassId}
                    onChange={(val) => setSelectedClassId(val ? String(val) : '')}
                  >
                    <Label>Pilih Kelas</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {rombels.map((r) => (
                          <ListBox.Item key={r.id} id={r.id} textValue={r.nama || r.name || ''}>
                            <div className="flex flex-col">
                              <span className="font-medium">{r.nama || r.name}</span>
                              <span className="text-xs text-default-500">{r.tingkat_kelas ? `Tingkat ${r.tingkat_kelas}` : ''}</span>
                            </div>
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    <FieldError />
                  </Select>
                )}


                <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border/50">
                  <Button
                    size="sm"
                    variant={billType === 'spp' ? 'primary' : 'ghost'}
                    className="flex-1 rounded-lg"
                    onPress={() => setBillType('spp')}
                  >
                    Tagihan SPP
                  </Button>
                  <Button
                    size="sm"
                    variant={billType === 'fee' ? 'primary' : 'ghost'}
                    className="flex-1 rounded-lg"
                    onPress={() => setBillType('fee')}
                  >
                    Tagihan Lainnya
                  </Button>
                </div>

                {billType === 'spp' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Select
                        isRequired
                        name="tahun_ajaran_id"
                        value={selectedTahunAjaranId}
                        onChange={(val) => {
                          setSelectedTahunAjaranId(val ? String(val) : '')
                        }}
                      >
                        <Label>Tahun Ajaran</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {years?.data.map(y => (
                              <ListBox.Item key={y.id} id={y.id.toString()} textValue={y.nama || y.name || ''}>
                                {y.nama || y.name}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                        <FieldError />
                      </Select>
                      <Select isRequired name="semester_id" defaultValue={activeSemesters[0]?.id.toString()} key={selectedTahunAjaranId}>
                        <Label>Semester</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {semesters?.data.map(s => (
                              <ListBox.Item key={s.id} id={s.id.toString()} textValue={s.nama || s.name || ''}>
                                {s.nama || s.name}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                        <FieldError />
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Select isRequired name="period_month" defaultValue={(new Date().getMonth() + 1).toString()}>
                        <Label>Bulan SPP</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {MONTH_NAMES.map((name, i) => (
                              <ListBox.Item key={i+1} id={(i+1).toString()} textValue={name}>
                                {name}
                                <ListBox.ItemIndicator />
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                        <FieldError />
                      </Select>
                      <TextField isRequired name="period_year" type="number" defaultValue={new Date().getFullYear().toString()}>
                        <Label>Tahun SPP</Label>
                        <Input />
                      </TextField>
                    </div>

                    <TextField isRequired name="amount" type="number">
                      <Label>Nominal (IDR)</Label>
                      <Input placeholder="Nominal tagihan" />
                    </TextField>

                    <TextField name="due_date" type="date" defaultValue={todayDateString()}>
                      <Label>Tenggat Waktu</Label>
                      <Input />
                    </TextField>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select isRequired name="finance_fee_type_id">
                      <Label>Jenis Biaya</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {otherFeeTypes.map(ft => (
                            <ListBox.Item key={ft.id} id={ft.id.toString()} textValue={ft.name}>
                              {ft.name}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                      <FieldError />
                    </Select>

                    <TextField isRequired name="title">
                      <Label>Judul Tagihan</Label>
                      <Input placeholder="Contoh: Uang Gedung 2024" />
                    </TextField>

                    <TextField isRequired name="amount" type="number">
                      <Label>Nominal (IDR)</Label>
                      <Input placeholder="Nominal tagihan" />
                    </TextField>

                    <TextField name="due_date" type="date" defaultValue={todayDateString()}>
                      <Label>Tenggat Waktu</Label>
                      <Input />
                    </TextField>
                    
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-warning-foreground">
                      Peringatan: Tagihan biaya akan dibuat untuk <strong>seluruh siswa</strong> di kelas ini.
                    </div>
                  </div>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" type="button" onPress={state.close}>
                  Batal
                </Button>
                <Button
                  variant="primary"
                  className="bg-accent text-accent-foreground"
                  type="submit"
                  isPending={isPending}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Generate Sekarang
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
