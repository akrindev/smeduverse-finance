import type { Bill, Rombel } from '@/types/finance'

export interface ClassMetrics {
  totalBills: number
  totalNet: number
  totalPaid: number
  totalOutstanding: number
}

export function getRombelLabel(rombel: Rombel): string {
  return rombel.nama ?? rombel.name ?? rombel.code ?? '-'
}

export function sortRombelsByJenjang(rombels: Rombel[]): Rombel[] {
  return [...rombels].sort((left, right) => {
    const leftLevel = Number(left.tingkat_kelas ?? 0)
    const rightLevel = Number(right.tingkat_kelas ?? 0)

    if (leftLevel !== rightLevel) {
      return leftLevel - rightLevel
    }

    return getRombelLabel(left).localeCompare(getRombelLabel(right), 'id', {
      sensitivity: 'base',
    })
  })
}

export function buildClassMetricsMap(bills: Bill[]): Map<string, ClassMetrics> {
  const metrics = new Map<string, ClassMetrics>()

  for (const bill of bills) {
    const key = bill.rombongan_belajar_id
    const current = metrics.get(key) ?? {
      totalBills: 0,
      totalNet: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    }

    metrics.set(key, {
      totalBills: current.totalBills + 1,
      totalNet: current.totalNet + bill.amount_net,
      totalPaid: current.totalPaid + bill.amount_paid,
      totalOutstanding: current.totalOutstanding + bill.amount_outstanding,
    })
  }

  return metrics
}

export function validatePaymentAmount(amount: number, outstanding: number): string | null {
  if (!Number.isFinite(amount) || amount < 1) {
    return 'Nominal pembayaran harus lebih dari 0'
  }

  if (amount > outstanding) {
    return 'Nominal melebihi sisa tagihan'
  }

  return null
}
