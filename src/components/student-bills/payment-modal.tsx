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
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useCreatePayment } from '@/hooks/use-payments'
import { ApiResponseError } from '@/lib/api-client'
import { firstValidationMessage, formatCurrency, todayDateString } from '@/lib/format'
import type { Bill, PaymentMethod } from '@/types/finance'

export interface CreatePaymentFormValues {
  payment_date: string
  total_amount: string
  payment_method: PaymentMethod
  reference_number: string
  notes: string
}

interface PaymentModalProps {
  state: ReturnType<typeof useOverlayState>
  bill: Bill | null
  onSuccess: () => void
}

export function PaymentModal({ state, bill, onSuccess }: PaymentModalProps) {
  const createPayment = useCreatePayment()
  const form = useForm<CreatePaymentFormValues>({
    defaultValues: {
      payment_date: todayDateString(),
      total_amount: '',
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    },
  })

  useEffect(() => {
    form.reset({
      payment_date: todayDateString(),
      total_amount: bill ? String(bill.amount_outstanding) : '',
      payment_method: 'cash',
      reference_number: '',
      notes: bill ? `Pembayaran untuk ${bill.title}` : '',
    })
  }, [bill, form])

  const submitPayment = form.handleSubmit(async (values) => {
    if (!bill) {
      toast.danger('Tagihan belum dipilih.')
      return
    }

    const amount = Number(values.total_amount)
    if (!Number.isFinite(amount) || amount < 1) {
      form.setError('total_amount', { message: 'Nominal pembayaran harus lebih dari 0' })
      return
    }

    if (amount > bill.amount_outstanding) {
      form.setError('total_amount', { message: 'Nominal melebihi sisa tagihan' })
      return
    }

    try {
      await createPayment.mutateAsync({
        student_id: bill.student_id,
        payment_date: values.payment_date,
        total_amount: amount,
        payment_method: values.payment_method,
        reference_number: values.reference_number || undefined,
        notes: values.notes || undefined,
        auto_allocate: false,
        allocations: [
          {
            finance_bill_id: bill.id,
            allocated_amount: amount,
            notes: `Pembayaran ${bill.bill_number}`,
          },
        ],
      })

      toast.success('Pembayaran berhasil disimpan.')
      form.reset({
        payment_date: todayDateString(),
        total_amount: '',
        payment_method: 'cash',
        reference_number: '',
        notes: '',
      })
      state.close()
      onSuccess()
    } catch (err) {
      if (err instanceof ApiResponseError) {
        const message = firstValidationMessage(err.errors) ?? err.message
        toast.danger(message)
      } else {
        toast.danger('Gagal menyimpan pembayaran.')
      }
    }
  })

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog aria-label="Bayar tagihan siswa">
            <form onSubmit={submitPayment}>
              <Modal.Header>
                <div className="flex-1">
                  <Modal.Heading>Bayar Tagihan</Modal.Heading>
                  {bill && <p className="text-xs text-default-500 mt-1 font-mono">{bill.bill_number}</p>}
                </div>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="space-y-4">
                {bill && (
                  <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                    <p className="text-sm font-medium">{bill.title}</p>
                    <p className="text-xs text-default-500 mt-0.5">
                      Sisa tagihan: <span className="font-semibold text-danger">{formatCurrency(bill.amount_outstanding)}</span>
                    </p>
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
                      <p className="text-xs text-danger mt-1">{form.formState.errors.total_amount.message}</p>
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
                  variant="primary"
                  className="bg-accent text-accent-foreground"
                  type="submit"
                  isDisabled={createPayment.isPending}
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
