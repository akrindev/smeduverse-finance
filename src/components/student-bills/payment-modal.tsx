import {
  Autocomplete,
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
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCreatePayment } from '@/hooks/use-payments'
import { useRefStudents } from '@/hooks/use-references'
import { ApiResponseError } from '@/lib/api-client'
import { firstValidationMessage, formatCurrency, todayDateString } from '@/lib/format'
import { validatePaymentAmount } from '@/lib/tagihan-siswa'
import type { Bill, PaymentMethod } from '@/types/finance'

export interface CreatePaymentFormValues {
  student_id: string
  payment_date: string
  total_amount: string
  payment_method: PaymentMethod
  reference_number: string
  notes: string
}

interface PaymentModalProps {
  state: ReturnType<typeof useOverlayState>
  bill?: Bill | null
  studentId?: string
  studentName?: string
  onSuccess: () => void
}

export function PaymentModal({ state, bill, studentId, studentName, onSuccess }: PaymentModalProps) {
  const [studentSearch, setStudentSearch] = useState('')
  const createPayment = useCreatePayment()
  
  const { data: studentsData } = useRefStudents({
    search: studentSearch || undefined,
    active: true,
    per_page: 20,
  }, { enabled: state.isOpen && !bill && !studentId })

  const students = studentsData?.data ?? []

  const form = useForm<CreatePaymentFormValues>({
    defaultValues: {
      student_id: '',
      payment_date: todayDateString(),
      total_amount: '',
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (state.isOpen) {
      form.reset({
        student_id: bill?.student_id || studentId || '',
        payment_date: todayDateString(),
        total_amount: bill ? String(bill.amount_outstanding) : '',
        payment_method: 'cash',
        reference_number: '',
        notes: bill ? `Pembayaran untuk ${bill.title}` : '',
      })
    }
  }, [bill, studentId, form, state.isOpen])

  const submitPayment = form.handleSubmit(async (values) => {
    const targetStudentId = bill?.student_id || studentId || values.student_id
    if (!targetStudentId) {
      toast.danger('Siswa belum dipilih.')
      return
    }

    const amount = Number(values.total_amount)
    if (bill) {
      const amountError = validatePaymentAmount(amount, bill.amount_outstanding)
      if (amountError) {
        form.setError('total_amount', { message: amountError })
        return
      }
    }

    try {
      await createPayment.mutateAsync({
        student_id: targetStudentId,
        payment_date: values.payment_date,
        total_amount: amount,
        payment_method: values.payment_method,
        reference_number: values.reference_number || undefined,
        notes: values.notes || undefined,
        auto_allocate: !bill,
        allocations: bill ? [
          {
            finance_bill_id: bill.id,
            allocated_amount: amount,
            notes: `Pembayaran ${bill.bill_number}`,
          },
        ] : undefined,
      })

      toast.success('Pembayaran berhasil disimpan.')
      form.reset()
      state.close()
      onSuccess()
    } catch (err) {
      if (err instanceof ApiResponseError) {
        toast.danger(firstValidationMessage(err.errors) ?? err.message)
      } else {
        toast.danger('Gagal menyimpan pembayaran.')
      }
    }
  })

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog aria-label="Input pembayaran">
            <form onSubmit={submitPayment}>
              <Modal.Header>
                <div className="flex-1">
                  <Modal.Heading>{bill ? 'Bayar Tagihan' : 'Input Pembayaran'}</Modal.Heading>
                  {(bill || studentName) && (
                    <p className="text-xs text-default-500 mt-1 font-mono">
                      {bill ? bill.bill_number : studentName}
                    </p>
                  )}
                </div>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="space-y-4">
                {!bill && !studentId && (
                  <Controller
                    control={form.control}
                    name="student_id"
                    rules={{ required: 'Siswa wajib dipilih' }}
                    render={({ field }) => (
                      <Autocomplete
                        isRequired
                        className="w-full"
                        placeholder="Cari nama atau NISN siswa..."
                        onInputChange={setStudentSearch}
                        value={field.value}
                        onChange={(val) => field.onChange(val as string)}
                      >
                        <Autocomplete.Trigger>
                          <Autocomplete.Value>
                            {({ state: autocompleteState }: any) => {
                              const selected = students.find(s => s.student_id === autocompleteState.selectedKey)
                              return selected ? selected.fullname : 'Pilih Siswa'
                            }}
                          </Autocomplete.Value>
                          <Autocomplete.Indicator />
                        </Autocomplete.Trigger>
                        <Autocomplete.Popover>
                          <Autocomplete.Filter>
                            <ListBox>
                              {students.map((s) => (
                                <ListBox.Item key={s.student_id} id={s.student_id} textValue={s.fullname}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{s.fullname}</span>
                                    <span className="text-xs text-default-500">{s.nipd || s.nisn}</span>
                                  </div>
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Autocomplete.Filter>
                        </Autocomplete.Popover>
                      </Autocomplete>
                    )}
                  />
                )}

                {bill ? (
                  <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                    <p className="text-sm font-medium">{bill.title}</p>
                    <p className="text-xs text-default-500 mt-0.5">
                      Sisa tagihan: <span className="font-semibold text-danger">{formatCurrency(bill.amount_outstanding)}</span>
                    </p>
                  </div>
                ) : (
                   <div className="p-3 bg-accent/5 border border-accent/20 rounded-xl text-xs text-default-600">
                    Sistem akan mengalokasikan pembayaran secara otomatis ke tagihan tertua yang belum lunas.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-default-500 mb-1">Tanggal Pembayaran</p>
                  <Controller
                      control={form.control}
                      name="payment_date"
                      rules={{ required: 'Tanggal pembayaran wajib diisi' }}
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Tanggal pembayaran"
                            type="date"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                    {form.formState.errors.payment_date && (
                      <p className="text-xs text-danger mt-1">{form.formState.errors.payment_date.message}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-default-500 mb-1">Metode Pembayaran</p>
                    <Controller
                      control={form.control}
                      name="payment_method"
                      render={({ field }) => (
                        <Select
                          aria-label="Metode pembayaran"
                          selectedKey={field.value}
                          onSelectionChange={(key) => field.onChange(String(key ?? 'cash') as PaymentMethod)}
                          fullWidth
                        >
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              <ListBox.Item id="cash" textValue="Cash">Cash</ListBox.Item>
                              <ListBox.Item id="transfer" textValue="Transfer">Transfer</ListBox.Item>
                              <ListBox.Item id="other" textValue="Other">Other</ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Nominal Pembayaran</p>
                    <Controller
                      control={form.control}
                      name="total_amount"
                      rules={{ required: 'Nominal pembayaran wajib diisi' }}
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            data-testid="payment-amount-input"
                            aria-label="Nominal pembayaran"
                            type="number"
                            min={1}
                            placeholder="100000"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                    {form.formState.errors.total_amount && (
                      <p data-testid="payment-amount-error" className="text-xs text-danger mt-1">{form.formState.errors.total_amount.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Nomor Referensi (opsional)</p>
                    <Controller
                      control={form.control}
                      name="reference_number"
                      render={({ field }) => (
                        <TextField fullWidth>
                          <Input
                            aria-label="Nomor referensi"
                            placeholder="REF-001"
                            value={field.value}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </TextField>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-default-500 mb-1">Catatan (opsional)</p>
                    <Controller
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <TextArea
                          aria-label="Catatan"
                          placeholder="Catatan pembayaran"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      )}
                    />
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" type="button" onPress={state.close}>
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button
                  data-testid="payment-submit-button"
                  variant="primary"
                  className="bg-accent text-accent-foreground"
                  type="submit"
                  isPending={createPayment.isPending}
                >
                  {createPayment.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
