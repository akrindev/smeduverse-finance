import {
  BarChart3,
  BookOpen,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Tag,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: '/dashboard' | '/dashboard/student-bills' | '/dashboard/fee-types' | '/dashboard/beasiswa' | '/dashboard/payments' | '/dashboard/reports'
  label: string
  icon: LucideIcon
  exact?: boolean
}

export const navItems: readonly NavItem[] = [
  { to: '/dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/student-bills' as const, label: 'Tagihan Siswa', icon: BookOpen },
  { to: '/dashboard/fee-types' as const, label: 'Jenis Biaya', icon: Tag },
  { to: '/dashboard/beasiswa' as const, label: 'Beasiswa', icon: GraduationCap },
  { to: '/dashboard/payments' as const, label: 'Pembayaran', icon: CreditCard },
  { to: '/dashboard/reports' as const, label: 'Laporan', icon: BarChart3 },
]

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
