import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Chip, Input, TextField } from '@heroui/react'
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/dashboard/spp')({
  component: SPPPage,
})

interface SPPRecord {
  id: string
  nis: string
  name: string
  class: string
  month: string
  amount: string
  dueDate: string
  paidDate: string | null
  status: 'paid' | 'pending' | 'overdue'
}

const sppData: SPPRecord[] = [
  {
    id: 'SPP-001',
    nis: '2024001',
    name: 'Ahmad Rizki',
    class: 'XII IPA 1',
    month: 'Februari 2026',
    amount: 'Rp 1.500.000',
    dueDate: '10 Feb 2026',
    paidDate: '08 Feb 2026',
    status: 'paid',
  },
  {
    id: 'SPP-002',
    nis: '2024002',
    name: 'Siti Nurhaliza',
    class: 'XII IPA 2',
    month: 'Februari 2026',
    amount: 'Rp 1.500.000',
    dueDate: '10 Feb 2026',
    paidDate: '10 Feb 2026',
    status: 'paid',
  },
  {
    id: 'SPP-003',
    nis: '2024003',
    name: 'Budi Santoso',
    class: 'XI IPS 1',
    month: 'Februari 2026',
    amount: 'Rp 1.500.000',
    dueDate: '10 Feb 2026',
    paidDate: null,
    status: 'pending',
  },
  {
    id: 'SPP-004',
    nis: '2024004',
    name: 'Dewi Lestari',
    class: 'X IPA 1',
    month: 'Februari 2026',
    amount: 'Rp 1.500.000',
    dueDate: '10 Feb 2026',
    paidDate: null,
    status: 'pending',
  },
  {
    id: 'SPP-005',
    nis: '2024005',
    name: 'Reza Pratama',
    class: 'XII IPA 1',
    month: 'Januari 2026',
    amount: 'Rp 1.500.000',
    dueDate: '10 Jan 2026',
    paidDate: null,
    status: 'overdue',
  },
  {
    id: 'SPP-006',
    nis: '2024006',
    name: 'Maya Sari',
    class: 'XI IPA 1',
    month: 'Februari 2026',
    amount: 'Rp 1.500.000',
    dueDate: '10 Feb 2026',
    paidDate: '05 Feb 2026',
    status: 'paid',
  },
  {
    id: 'SPP-007',
    nis: '2024007',
    name: 'Farhan Adi',
    class: 'X IPS 1',
    month: 'Januari 2026',
    amount: 'Rp 1.500.000',
    dueDate: '10 Jan 2026',
    paidDate: null,
    status: 'overdue',
  },
  {
    id: 'SPP-008',
    nis: '2024008',
    name: 'Putri Ayu',
    class: 'XII IPS 1',
    month: 'Februari 2026',
    amount: 'Rp 1.500.000',
    dueDate: '10 Feb 2026',
    paidDate: '09 Feb 2026',
    status: 'paid',
  },
]

const statusConfig = {
  paid: { label: 'Lunas', color: 'success' as const },
  pending: { label: 'Menunggu', color: 'warning' as const },
  overdue: { label: 'Terlambat', color: 'danger' as const },
}

function SPPPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredData = sppData.filter((record) => {
    const matchSearch =
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.nis.includes(searchQuery)
    const matchStatus =
      filterStatus === 'all' || record.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalPaid = sppData.filter((r) => r.status === 'paid').length
  const totalPending = sppData.filter((r) => r.status === 'pending').length
  const totalOverdue = sppData.filter((r) => r.status === 'overdue').length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen SPP</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola pembayaran SPP siswa
          </p>
        </div>
        <Button
          variant="primary"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pembayaran
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalPaid}</p>
            <p className="text-xs text-gray-500 mt-1">Lunas</p>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
            <p className="text-xs text-gray-500 mt-1">Menunggu</p>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{totalOverdue}</p>
            <p className="text-xs text-gray-500 mt-1">Terlambat</p>
          </Card.Content>
        </Card>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <Card.Header className="px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1">
              <TextField fullWidth>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <Input
                    placeholder="Cari nama siswa atau NIS..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </TextField>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="paid">Lunas</option>
                <option value="pending">Menunggu</option>
                <option value="overdue">Terlambat</option>
              </select>
              <Button variant="outline" isIconOnly>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    NIS
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    Nama Siswa
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3 hidden md:table-cell">
                    Kelas
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3 hidden sm:table-cell">
                    Bulan
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    Jumlah
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3 hidden lg:table-cell">
                    Jatuh Tempo
                  </th>
                  <th className="text-left font-medium text-gray-500 px-6 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((record) => (
                  <tr
                    key={record.id}
                    className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {record.nis}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {record.name}
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden md:table-cell">
                      {record.class}
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden sm:table-cell">
                      {record.month}
                    </td>
                    <td className="px-6 py-3 font-semibold text-gray-900">
                      {record.amount}
                    </td>
                    <td className="px-6 py-3 text-gray-500 hidden lg:table-cell">
                      {record.dueDate}
                    </td>
                    <td className="px-6 py-3">
                      <Chip
                        size="sm"
                        color={statusConfig[record.status].color}
                        variant="soft"
                      >
                        <Chip.Label>
                          {statusConfig[record.status].label}
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
              Menampilkan {filteredData.length} dari {sppData.length} data
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
