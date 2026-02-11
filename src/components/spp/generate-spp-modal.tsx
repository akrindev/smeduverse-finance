import {
  Button,
  Input,
  Modal,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from '@heroui/react'
import { Controller, useForm } from 'react-hook-form'
import { useGenerateSpp } from '@/hooks/use-bills'
import { ApiResponseError } from '@/lib/api-client'
import { firstValidationMessage, parseStudentIds } from '@/lib/format'

export interface GenerateSppFormValues {
  rombongan_belajar_id: string
  period_month: string
  period_year: string
  amount: string
  due_date: string
  title: string
  description: string
  student_ids: string
}

interface GenerateSppModalProps {
  state: ReturnType<typeof useOverlayState>
}

export function GenerateSppModal({ state }: GenerateSppModalProps) {
  const generateSpp = useGenerateSpp()
  const now = new Date()
  const form = useForm<GenerateSppFormValues>({
    defaultValues: {
      rombongan_belajar_id: '',
      period_month: String(now.getMonth() + 1),
      period_year: String(now.getFullYear()),
      amount: '',
      due_date: '',
      title: '',
      description: '',
      student_ids: '',
    },
  })

  const submit = form.handleSubmit(async (values) => {
    const month = Number(values.period_month)
    const year = Number(values.period_year)
    const amount = Number(values.amount)

    if (!Number.isFinite(month) || month < 1 || month > 12) {
      form.setError('period_month', { message: 'Bulan harus 1 sampai 12' })
      return
    }

    if (!Number.isFinite(year) || year < 2000) {
      form.setError('period_year', { message: 'Tahun tidak valid' })
      return
    }

    if (!Number.isFinite(amount) || amount < 1) {
      form.setError('amount', { message: 'Nominal harus lebih dari 0' })
      return
    }

    try {
      const response = await generateSpp.mutateAsync({
        rombongan_belajar_id: values.rombongan_belajar_id,
        period_month: month,
        period_year: year,
        amount,
        due_date: values.due_date || undefined,
        title: values.title || undefined,
        description: values.description || undefined,
        student_ids: parseStudentIds(values.student_ids),
      })

      toast.success(`Generate SPP selesai. Dibuat ${response.created_count}, dilewati ${response.skipped_count}.`)
      state.close()
      form.reset({
        ...form.getValues(),
        amount: '',
        due_date: '',
        title: '',
        description: '',
        student_ids: '',
      })
    } catch (err) {
      if (err instanceof ApiResponseError) {
        const message = firstValidationMessage(err.errors) ?? err.message
        toast.danger(message)
      } else {
        toast.danger('Gagal membuat tagihan SPP.')
      }
    }
  })

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog aria-label="Generate Tagihan SPP">
            <form onSubmit={submit}>
              <Modal.Header>
                <Modal.Heading>Generate Tagihan SPP</Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-default-500 mb-1">Rombongan Belajar ID</p>
                    <Controller
                      control={form.control}
                      name="rombongan_belajar_id"
                      rules={{ required: 'Rombongan belajar wajib diisi' }}
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Rombongan Belajar ID"
                            placeholder="UUID rombel"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                    {form.formState.errors.rombongan_belajar_id && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.rombongan_belajar_id.message}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Nominal Tagihan</p>
                    <Controller
                      control={form.control}
                      name="amount"
                      rules={{ required: 'Nominal wajib diisi' }}
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Nominal tagihan"
                            type="number"
                            min={1}
                            placeholder="500000"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                    {form.formState.errors.amount && <p className="text-xs text-danger mt-1">{form.formState.errors.amount.message}</p>}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Bulan Periode (1-12)</p>
                    <Controller
                      control={form.control}
                      name="period_month"
                      rules={{ required: 'Bulan wajib diisi' }}
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
                    {form.formState.errors.period_month && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.period_month.message}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Tahun Periode</p>
                    <Controller
                      control={form.control}
                      name="period_year"
                      rules={{ required: 'Tahun wajib diisi' }}
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
                    {form.formState.errors.period_year && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.period_year.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Jatuh Tempo (opsional)</p>
                    <Controller
                      control={form.control}
                      name="due_date"
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
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Judul Tagihan (opsional)</p>
                    <Controller
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Judul tagihan"
                            placeholder="SPP Februari 2026"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Student UUID (opsional, pisahkan koma)</p>
                    <Controller
                      control={form.control}
                      name="student_ids"
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Student UUID"
                            placeholder="uuid-1, uuid-2"
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
                  isDisabled={generateSpp.isPending}
                >
                  {generateSpp.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
