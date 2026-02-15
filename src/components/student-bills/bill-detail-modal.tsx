import { Button, Chip, Modal, Separator, useOverlayState } from '@heroui/react'
import { X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { billStatusConfig, MONTH_NAMES_FULL } from '@/lib/student-bills'
import type { Bill } from '@/types/finance'

interface BillDetailModalProps {
  bill: Bill | null
  state: ReturnType<typeof useOverlayState>
  canPay: boolean
  onPay: (bill: Bill) => void
}

export function BillDetailModal({ bill, state, canPay, onPay }: BillDetailModalProps) {
  if (!bill) {
    return null
  }

  const hasDiscount = bill.amount_discount > 0
  const hasScholarship = Boolean(bill.student_scholarship)

  const statusConfig = billStatusConfig[bill.status] || { label: bill.status, color: 'default' }

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog aria-label="Detail Tagihan" data-testid="bill-detail-modal">
            <Modal.Header>
              <div className="flex-1">
                <Modal.Heading>Detail Tagihan</Modal.Heading>
                <p className="text-xs text-default-500 font-mono mt-1">{bill.bill_number}</p>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="space-y-5">
              <div className="flex items-center justify-between">
                <Chip size="sm" variant="soft" color={statusConfig.color as any}>
                  {statusConfig.label}
                </Chip>
                {bill.period_month && bill.period_year && (
                  <span className="text-sm font-medium text-default-500">
                    {MONTH_NAMES_FULL[bill.period_month - 1]} {bill.period_year}
                  </span>
                )}
              </div>

              <div>
                <p className="text-lg font-semibold">{bill.title}</p>
                {bill.description && <p className="text-sm text-default-500 mt-1">{bill.description}</p>}
              </div>

              <Separator />

              <div className="space-y-2">
                <DetailRow label="Jenis Tagihan" value={bill.fee_type?.name ?? '-'} />
                <DetailRow label="Bruto" value={formatCurrency(bill.amount_gross)} />
                {hasDiscount && <DetailRow label="Diskon" value={`- ${formatCurrency(bill.amount_discount)}`} valueClass="text-success" />}
                {hasScholarship && <DetailRow label="Beasiswa" value={bill.student_scholarship?.scholarship?.name ?? '-'} />}
                <Separator />
                <DetailRow label="Netto" value={formatCurrency(bill.amount_net)} bold />
                <DetailRow label="Sudah Dibayar" value={formatCurrency(bill.amount_paid)} valueClass="text-success" />
                <DetailRow
                  label="Sisa"
                  value={formatCurrency(bill.amount_outstanding)}
                  valueClass={bill.amount_outstanding > 0 ? 'text-danger' : 'text-success'}
                  bold
                />
              </div>

              <Separator />

              <div className="space-y-2">
                {bill.due_date && <DetailRow label="Jatuh Tempo" value={bill.due_date} />}
                {bill.issued_at && <DetailRow label="Diterbitkan" value={formatDate(bill.issued_at)} />}
                {bill.paid_off_at && <DetailRow label="Lunas Pada" value={formatDate(bill.paid_off_at)} valueClass="text-success" />}
                {bill.voided_at && <DetailRow label="Divoid Pada" value={formatDate(bill.voided_at)} valueClass="text-danger" />}
              </div>

              {(bill.allocations ?? []).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-3">Riwayat Pembayaran</p>
                    <div className="space-y-3">
                      {(bill.allocations ?? []).map((allocation) => (
                        <div key={allocation.id} className="rounded-2xl border border-border/50 p-3 space-y-2 bg-surface/30">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-medium text-accent">
                                {allocation.payment?.payment_number || `#${allocation.finance_payment_id}`}
                              </span>
                              <span className="text-[10px] text-default-500">
                                {allocation.payment?.payment_date ? formatDate(allocation.payment.payment_date) : 'Tanggal tidak tersedia'}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-success">
                              {formatCurrency(allocation.allocated_amount)}
                            </span>
                          </div>
                          
                          {allocation.payment && (
                            <div className="flex items-center gap-2">
                              <div className="bg-default/10 px-2 py-0.5 rounded-full text-default-600 text-[10px] capitalize">
                                {allocation.payment.payment_method}
                              </div>
                              {allocation.payment.reference_number && (
                                <span className="text-[10px] text-default-400 truncate max-w-[150px]">
                                  Ref: {allocation.payment.reference_number}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {allocation.notes && (
                            <p className="text-[10px] text-default-500 italic bg-background/40 p-1.5 rounded-lg border border-border/30">
                              Catatan: {allocation.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onPress={state.close}>
                <X className="w-4 h-4 mr-2" />
                Tutup
              </Button>
              {canPay && (
                <Button
                  data-testid="pay-bill-button"
                  variant="primary"
                  className="bg-accent text-accent-foreground"
                  onPress={() => onPay(bill)}
                >
                  Bayar Tagihan
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}

function DetailRow({
  label,
  value,
  valueClass,
  bold,
}: {
  label: string
  value: string
  valueClass?: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-default-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold' : 'font-medium'} ${valueClass ?? ''}`}>{value}</span>
    </div>
  )
}
