import type { BillStatus } from '@/types/finance'

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export const MONTH_NAMES_FULL = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export const billStatusConfig: Record<BillStatus, { label: string; color: 'success' | 'warning' | 'danger' | 'default' }> = {
  paid: { label: 'Lunas', color: 'success' },
  partial: { label: 'Sebagian', color: 'warning' },
  unpaid: { label: 'Belum Bayar', color: 'danger' },
  void: { label: 'Void', color: 'default' },
}
