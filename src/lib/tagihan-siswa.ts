import type { Bill, Rombel, Student } from '@/types/finance'

export interface ClassMetrics {
  totalBills: number
  totalNet: number
  totalPaid: number
  totalOutstanding: number
}

export function getRombelLabel(rombel: Rombel): string {
  return rombel.nama ?? rombel.name ?? rombel.code ?? '-'
}

export function getStudentLatestRombel(student: Student): Rombel | null {
  const history = student.rombongan_belajar ?? []
  if (history.length === 0) return null

  return [...history].sort((a, b) => {
    const dateA = new Date(a.pivot?.created_at || a.pivot?.tanggal_masuk || 0).getTime()
    const dateB = new Date(b.pivot?.created_at || b.pivot?.tanggal_masuk || 0).getTime()
    return dateB - dateA
  })[0]
}

export function getStudentStatusInfo(student: Student): {
  status: number
  label: string
  color: 'success' | 'accent' | 'danger' | 'default'
} {
  const latest = getStudentLatestRombel(student)
  const pivot = latest?.pivot
  const status = Number(pivot?.status ?? 0)

  if (status === 1) {
    return { status, label: pivot?.keterangan_masuk || 'Aktif', color: 'success' }
  }

  if (status === 2) {
    return { status, label: pivot?.keterangan_keluar || 'Lulus', color: 'accent' }
  }

  return {
    status,
    label: pivot?.keterangan_keluar || 'Non-Aktif',
    color: status === 0 ? 'default' : 'danger',
  }
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
