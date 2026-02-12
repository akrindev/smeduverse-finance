import {
  Button,
  Input,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from '@heroui/react'
import { Controller, useForm } from 'react-hook-form'
import { StudentSearchSelect } from '@/components/shared/student-search-select'
import { useGenerateFee } from '@/hooks/use-bills'
import { useFeeTypes } from '@/hooks/use-fee-types'
import { ApiResponseError } from '@/lib/api-client'
import { firstValidationMessage } from '@/lib/format'

export interface GenerateFeeFormValues {
  finance_fee_type_id: string
  student_ids: string[]
  amount: string
  due_date: string
  title: string
  description: string
  period_month: string
  period_year: string
}

interface GenerateFeeModalProps {
  state: ReturnType<typeof useOverlayState>
}

export function GenerateFeeModal({ state }: GenerateFeeModalProps) {
  const { data: feeTypesData } = useFeeTypes({ per_page: 100 })
  const feeTypes = (feeTypesData?.data ?? []).filter((item) => item.is_active)
  const generateFee = useGenerateFee()
  const form = useForm<GenerateFeeFormValues>({
    defaultValues: {
      finance_fee_type_id: '',
      student_ids: [],
      amount: '',
      due_date: '',
      title: '',
      description: '',
      period_month: '',
      period_year: '',
    },
  })

  const submit = form.handleSubmit(async (values) => {
    const feeTypeId = Number(values.finance_fee_type_id)
    const amount = Number(values.amount)
    const month = values.period_month ? Number(values.period_month) : undefined
    const year = values.period_year ? Number(values.period_year) : undefined
    const studentIds = values.student_ids

    if (!Number.isFinite(feeTypeId) || feeTypeId < 1) {
      form.setError('finance_fee_type_id', { message: 'Jenis tagihan wajib dipilih' })
      return
    }

    if (!studentIds || studentIds.length === 0) {
      form.setError('student_ids', { message: 'Pilih minimal satu siswa' })
      return
    }

    if (!Number.isFinite(amount) || amount < 1) {
      form.setError('amount', { message: 'Nominal harus lebih dari 0' })
      return
    }

    if (month && (month < 1 || month > 12)) {
      form.setError('period_month', { message: 'Bulan harus 1 sampai 12' })
      return
    }

    if (year && year < 2000) {
      form.setError('period_year', { message: 'Tahun tidak valid' })
      return
    }

    try {
      const response = await generateFee.mutateAsync({
        finance_fee_type_id: feeTypeId,
        student_ids: studentIds,
        amount,
        due_date: values.due_date || undefined,
        title: values.title,
        description: values.description || undefined,
        period_month: month,
        period_year: year,
      })

      toast.success(`Tagihan lainnya berhasil dibuat (${response.created_count} tagihan).`)
      state.close()
      form.reset({
        finance_fee_type_id: '',
        student_ids: [],
        amount: '',
        due_date: '',
        title: '',
        description: '',
        period_month: '',
        period_year: '',
      })
    } catch (err) {
      if (err instanceof ApiResponseError) {
        const message = firstValidationMessage(err.errors) ?? err.message
        toast.danger(message)
      } else {
        toast.danger('Gagal membuat tagihan lainnya.')
      }
    }
  })

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog aria-label="Generate Tagihan Lainnya">
            <form onSubmit={submit}>
              <Modal.Header>
                <Modal.Heading>Generate Tagihan Lainnya</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Jenis Tagihan</p>
                    <Controller
                      control={form.control}
                      name="finance_fee_type_id"
                      rules={{ required: 'Jenis tagihan wajib dipilih' }}
                      render={({ field }) => (
                        <Select
                          aria-label="Jenis tagihan"
                          selectedKey={field.value || null}
                          onSelectionChange={(key) => field.onChange(String(key ?? ''))}
                          fullWidth
                        >
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {feeTypes.map((feeType) => (
                                <ListBox.Item key={feeType.id} id={String(feeType.id)} textValue={feeType.name}>
                                  {feeType.name}
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      )}
                    />
                    {form.formState.errors.finance_fee_type_id && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.finance_fee_type_id.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Siswa</p>
                    <Controller
                      control={form.control}
                      name="student_ids"
                      rules={{
                        validate: (value) => value.length > 0 || 'Pilih minimal satu siswa',
                      }}
                      render={({ field }) => (
                        <StudentSearchSelect
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {form.formState.errors.student_ids && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.student_ids.message}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Nominal</p>
                    <Controller
                      control={form.control}
                      name="amount"
                      rules={{ required: 'Nominal wajib diisi' }}
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Nominal"
                            type="number"
                            min={1}
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                    {form.formState.errors.amount && <p className="text-xs text-danger mt-1">{form.formState.errors.amount.message}</p>}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Jatuh Tempo</p>
                    <Controller
                      control={form.control}
                      name="due_date"
                      rules={{ required: 'Jatuh tempo wajib diisi' }}
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Jatuh tempo"
                            type="date"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                    {form.formState.errors.due_date && <p className="text-xs text-danger mt-1">{form.formState.errors.due_date.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Judul Tagihan</p>
                    <Controller
                      control={form.control}
                      name="title"
                      rules={{ required: 'Judul wajib diisi' }}
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Judul"
                            placeholder="Biaya kegiatan semester"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                    {form.formState.errors.title && <p className="text-xs text-danger mt-1">{form.formState.errors.title.message}</p>}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Bulan Periode (opsional)</p>
                    <Controller
                      control={form.control}
                      name="period_month"
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Bulan periode"
                            type="number"
                            min={1}
                            max={12}
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Tahun Periode (opsional)</p>
                    <Controller
                      control={form.control}
                      name="period_year"
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Tahun periode"
                            type="number"
                            min={2000}
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Deskripsi (opsional)</p>
                    <Controller
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <TextArea
                          aria-label="Deskripsi"
                          placeholder="Keterangan tambahan"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      )}
                    />
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={state.close} type="button">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  className="bg-accent text-accent-foreground"
                  type="submit"
                  isDisabled={generateFee.isPending}
                >
                  {generateFee.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
