import { createFileRoute } from '@tanstack/react-router'
import { Card, Chip, Button } from '@heroui/react'
import {
  TrendingUp,
  DollarSign,
  Users,
  GraduationCap,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
})

const stats = [
  {
    label: 'Total Pendapatan',
    value: 'Rp 245.680.000',
    change: '+12.5%',
    trend: 'up' as const,
    icon: DollarSign,
    color: 'bg-emerald-50 text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
  {
    label: 'SPP Terbayar',
    value: 'Rp 189.200.000',
    change: '+8.2%',
    trend: 'up' as const,
    icon: TrendingUp,
    color: 'bg-blue-50 text-blue-600',
    iconBg: 'bg-blue-100',
  },
  {
    label: 'Beasiswa Aktif',
    value: '47 Siswa',
    change: '+3',
    trend: 'up' as const,
    icon: GraduationCap,
    color: 'bg-purple-50 text-purple-600',
    iconBg: 'bg-purple-100',
  },
  {
    label: 'Tunggakan',
    value: 'Rp 32.450.000',
    change: '-5.1%',
    trend: 'down' as const,
    icon: AlertTriangle,
    color: 'bg-amber-50 text-amber-600',
    iconBg: 'bg-amber-100',
  },
]

const recentTransactions = [
  {
    id: 'TRX-001',
    student: 'Ahmad Rizki',
    type: 'SPP',
    amount: 'Rp 1.500.000',
    date: '10 Feb 2026',
    status: 'success' as const,
  },
  {
    id: 'TRX-002',
    student: 'Siti Nurhaliza',
    type: 'Uang Gedung',
    amount: 'Rp 5.000.000',
    date: '10 Feb 2026',
    status: 'success' as const,
  },
  {
    id: 'TRX-003',
    student: 'Budi Santoso',
    type: 'SPP',
    amount: 'Rp 1.500.000',
    date: '09 Feb 2026',
    status: 'pending' as const,
  },
  {
    id: 'TRX-004',
    student: 'Dewi Lestari',
    type: 'Beasiswa',
    amount: 'Rp 2.000.000',
    date: '09 Feb 2026',
    status: 'success' as const,
  },
  {
    id: 'TRX-005',
    student: 'Reza Pratama',
    type: 'SPP',
    amount: 'Rp 1.500.000',
    date: '08 Feb 2026',
    status: 'failed' as const,
  },
]

const statusConfig = {
  success: { label: 'Berhasil', color: 'success' as const },
  pending: { label: 'Menunggu', color: 'warning' as const },
  failed: { label: 'Gagal', color: 'danger' as const },
}

function DashboardOverview() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat Datang, Admin
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Berikut ringkasan keuangan sekolah Anda hari ini.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <Card.Content className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={`p-2.5 rounded-xl ${stat.iconBg}`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.color.split(' ')[1]}`} />
                </div>
                <div
                  className={`flex items-center gap-0.5 text-xs font-medium ${
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <Card.Header className="px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <Card.Title className="text-base font-semibold">
              Transaksi Terbaru
            </Card.Title>
            <Card.Description className="text-sm text-gray-500">
              5 transaksi terakhir
            </Card.Description>
          </div>
          <Button variant="outline" size="sm">
            Lihat Semua
          </Button>
        </Card.Header>
        <Card.Content className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    ID
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    Siswa
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3 hidden sm:table-cell">
                    Jenis
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    Jumlah
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3 hidden md:table-cell">
                    Tanggal
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {tx.id}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {tx.student}
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden sm:table-cell">
                      {tx.type}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900">
                      {tx.amount}
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden md:table-cell">
                      {tx.date}
                    </td>
                    <td className="px-6 py-3">
                      <Chip
                        size="sm"
                        color={statusConfig[tx.status].color}
                        variant="soft"
                      >
                        <Chip.Label>
                          {statusConfig[tx.status].label}
                        </Chip.Label>
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <Card.Content className="p-5 text-center">
            <div className="inline-flex p-3 rounded-xl bg-blue-50 mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              Input Pembayaran SPP
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Catat pembayaran SPP siswa
            </p>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <Card.Content className="p-5 text-center">
            <div className="inline-flex p-3 rounded-xl bg-purple-50 mb-3">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              Kelola Beasiswa
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Tambah atau ubah data beasiswa
            </p>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <Card.Content className="p-5 text-center">
            <div className="inline-flex p-3 rounded-xl bg-emerald-50 mb-3">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              Laporan Keuangan
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Unduh laporan bulanan
            </p>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
