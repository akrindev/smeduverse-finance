import {
  BarChart3,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Tag,
  Users,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  to: '/dashboard' | '/dashboard/class-bills' | '/dashboard/fee-types' | '/dashboard/beasiswa' | '/dashboard/payments' | '/dashboard/reports'
  search?: Record<string, any>
  label: string
  icon: LucideIcon
  exact?: boolean
}

export const navItems: readonly NavItem[] = [
  { to: '/dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/class-bills' as const, label: 'Tagihan Kelas', icon: Users },
  {
    to: '/dashboard/class-bills' as const,
    search: { search_by: 'student' },
    label: 'Tagihan Siswa',
    icon: UserRound,
  },
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
