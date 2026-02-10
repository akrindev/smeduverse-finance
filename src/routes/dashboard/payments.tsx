import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Chip, Input, TextField } from '@heroui/react'
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/payments')({
  component: PaymentsPage,
})

interface Payment {
  id: string
  student: string
  class: string
  type: string
  category: 'income' | 'expense'
  amount: string
  method: string
  date: string
  reference: string
  status: 'success' | 'pending' | 'failed' | 'refunded'
}

const payments: Payment[] = [
  {
    id: 'PAY-001',
    student: 'Ahmad Rizki',
    class: 'XII IPA 1',
    type: 'SPP Februari',
    category: 'income',
    amount: 'Rp 1.500.000',
    method: 'Transfer Bank',
    date: '10 Feb 2026 09:30',
    reference: 'BCA-28371',
    status: 'success',
  },
  {
    id: 'PAY-002',
    student: 'Siti Nurhaliza',
    class: 'XII IPA 2',
    type: 'Uang Gedung',
    category: 'income',
    amount: 'Rp 5.000.000',
    method: 'Transfer Bank',
    date: '10 Feb 2026 10:15',
    reference: 'BNI-93847',
    status: 'success',
  },
  {
    id: 'PAY-003',
    student: 'Budi Santoso',
    class: 'XI IPS 1',
    type: 'SPP Februari',
    category: 'income',
    amount: 'Rp 1.500.000',
    method: 'Virtual Account',
    date: '10 Feb 2026 11:00',
    reference: 'VA-74829',
    status: 'pending',
  },
  {
    id: 'PAY-004',
    student: 'Dewi Lestari',
    class: 'X IPA 1',
    type: 'Seragam',
    category: 'income',
    amount: 'Rp 850.000',
    method: 'Tunai',
    date: '09 Feb 2026 08:45',
    reference: 'CSH-12938',
    status: 'success',
  },
  {
    id: 'PAY-005',
    student: 'Maya Sari',
    class: 'XI IPA 1',
    type: 'Kegiatan Ekskul',
    category: 'income',
    amount: 'Rp 350.000',
    method: 'QRIS',
    date: '09 Feb 2026 13:20',
    reference: 'QR-39281',
    status: 'success',
  },
  {
    id: 'PAY-006',
    student: '-',
    class: '-',
    type: 'Beasiswa Prestasi',
    category: 'expense',
    amount: 'Rp 30.000.000',
    method: 'Transfer Bank',
    date: '08 Feb 2026 10:00',
    reference: 'BSW-00128',
    status: 'success',
  },
  {
    id: 'PAY-007',
    student: 'Reza Pratama',
    class: 'XII IPA 1',
    type: 'SPP Januari',
    category: 'income',
    amount: 'Rp 1.500.000',
    method: 'Transfer Bank',
    date: '08 Feb 2026 14:30',
    reference: 'BCA-19283',
    status: 'failed',
  },
  {
    id: 'PAY-008',
    student: 'Farhan Adi',
    class: 'X IPS 1',
    type: 'SPP Februari',
    category: 'income',
    amount: 'Rp 1.500.000',
    method: 'Transfer Bank',
    date: '07 Feb 2026 16:45',
    reference: 'MDR-82746',
    status: 'refunded',
  },
]

const statusConfig = {
  success: { label: 'Berhasil', color: 'success' as const },
  pending: { label: 'Menunggu', color: 'warning' as const },
  failed: { label: 'Gagal', color: 'danger' as const },
  refunded: { label: 'Refund', color: 'default' as const },
}

function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'income' && p.category === 'income') ||
      (activeTab === 'expense' && p.category === 'expense')
    return matchSearch && matchTab
  })

  const totalIncome = payments
    .filter((p) => p.category === 'income' && p.status === 'success')
    .length
  const totalExpense = payments
    .filter((p) => p.category === 'expense' && p.status === 'success')
    .length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Riwayat Pembayaran
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Seluruh transaksi keuangan sekolah
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {payments.length}
                </p>
                <p className="text-xs text-gray-500">Total Transaksi</p>
              </div>
            </div>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {totalIncome}
                </p>
                <p className="text-xs text-gray-500">Pemasukan</p>
              </div>
            </div>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50">
                <ArrowUpRight className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {totalExpense}
                </p>
                <p className="text-xs text-gray-500">Pengeluaran</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <Card.Header className="px-6 py-4">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'income', label: 'Pemasukan' },
                { id: 'expense', label: 'Pengeluaran' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <TextField fullWidth>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  placeholder="Cari transaksi..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </TextField>
          </div>
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
                    Jenis
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3 hidden sm:table-cell">
                    Siswa
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    Jumlah
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3 hidden md:table-cell">
                    Metode
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3 hidden lg:table-cell">
                    Tanggal
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {payment.id}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {payment.category === 'income' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="font-medium text-gray-900">
                          {payment.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-600 hidden sm:table-cell">
                      {payment.student}
                    </td>
                    <td
                      className={`px-6 py-3 font-semibold ${
                        payment.category === 'income'
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {payment.category === 'expense' ? '- ' : '+ '}
                      {payment.amount}
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden md:table-cell">
                      {payment.method}
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden lg:table-cell">
                      {payment.date}
                    </td>
                    <td className="px-6 py-3">
                      <Chip
                        size="sm"
                        color={statusConfig[payment.status].color}
                        variant="soft"
                      >
                        <Chip.Label>
                          {statusConfig[payment.status].label}
                        </Chip.Label>
                      </Chip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan {filteredPayments.length} dari {payments.length}{' '}
              transaksi
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" isIconOnly isDisabled>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" isIconOnly isDisabled>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
