import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, Chip } from '@heroui/react'
import {
  Plus,
  Calendar,
  Users,
  DollarSign,
  ChevronRight,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard/beasiswa')({
  component: BeasiswaPage,
})

interface Scholarship {
  id: string
  name: string
  provider: string
  type: string
  amount: string
  recipients: number
  maxRecipients: number
  startDate: string
  endDate: string
  status: 'active' | 'pending' | 'completed' | 'draft'
  description: string
}

const scholarships: Scholarship[] = [
  {
    id: 'BSW-001',
    name: 'Beasiswa Prestasi Akademik',
    provider: 'Yayasan Smeduverse',
    type: 'Prestasi',
    amount: 'Rp 2.000.000/bulan',
    recipients: 15,
    maxRecipients: 20,
    startDate: 'Jan 2026',
    endDate: 'Des 2026',
    status: 'active',
    description:
      'Beasiswa untuk siswa berprestasi dengan nilai rata-rata minimal 85.',
  },
  {
    id: 'BSW-002',
    name: 'Beasiswa Kurang Mampu',
    provider: 'Dinas Pendidikan',
    type: 'Bantuan',
    amount: 'Rp 1.500.000/bulan',
    recipients: 25,
    maxRecipients: 30,
    startDate: 'Jan 2026',
    endDate: 'Jun 2026',
    status: 'active',
    description:
      'Program bantuan pendidikan untuk keluarga kurang mampu.',
  },
  {
    id: 'BSW-003',
    name: 'Beasiswa Hafidz Quran',
    provider: 'Yayasan Smeduverse',
    type: 'Keagamaan',
    amount: 'Rp 1.000.000/bulan',
    recipients: 5,
    maxRecipients: 10,
    startDate: 'Mar 2026',
    endDate: 'Des 2026',
    status: 'pending',
    description:
      'Beasiswa khusus untuk siswa penghafal Al-Quran minimal 10 juz.',
  },
  {
    id: 'BSW-004',
    name: 'Beasiswa Olimpiade Sains',
    provider: 'Kemendikbud',
    type: 'Prestasi',
    amount: 'Rp 3.000.000/bulan',
    recipients: 3,
    maxRecipients: 5,
    startDate: 'Feb 2026',
    endDate: 'Des 2026',
    status: 'active',
    description:
      'Beasiswa bagi siswa peraih medali olimpiade sains nasional.',
  },
  {
    id: 'BSW-005',
    name: 'Beasiswa Atlet Berprestasi',
    provider: 'Kemenpora',
    type: 'Olahraga',
    amount: 'Rp 2.500.000/bulan',
    recipients: 8,
    maxRecipients: 8,
    startDate: 'Jul 2025',
    endDate: 'Jun 2026',
    status: 'completed',
    description:
      'Program beasiswa untuk atlet berprestasi tingkat nasional.',
  },
  {
    id: 'BSW-006',
    name: 'Beasiswa Tahfidz 2027',
    provider: 'Yayasan Smeduverse',
    type: 'Keagamaan',
    amount: 'Rp 1.200.000/bulan',
    recipients: 0,
    maxRecipients: 15,
    startDate: 'Jan 2027',
    endDate: 'Des 2027',
    status: 'draft',
    description:
      'Rancangan program beasiswa tahfidz untuk tahun ajaran baru.',
  },
]

const statusConfig = {
  active: { label: 'Aktif', color: 'success' as const },
  pending: { label: 'Menunggu', color: 'warning' as const },
  completed: { label: 'Selesai', color: 'default' as const },
  draft: { label: 'Draf', color: 'default' as const },
}

const typeColors: Record<string, string> = {
  Prestasi: 'bg-blue-50 text-blue-700',
  Bantuan: 'bg-emerald-50 text-emerald-700',
  Keagamaan: 'bg-purple-50 text-purple-700',
  Olahraga: 'bg-amber-50 text-amber-700',
}

function BeasiswaPage() {
  const activeCount = scholarships.filter((s) => s.status === 'active').length
  const totalRecipients = scholarships
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.recipients, 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manajemen Beasiswa
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola program beasiswa dan penerima
          </p>
        </div>
        <Button
          variant="primary"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Program Baru
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4">
            <p className="text-2xl font-bold text-gray-900">
              {scholarships.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Program</p>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4">
            <p className="text-2xl font-bold text-emerald-600">
              {activeCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">Program Aktif</p>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4">
            <p className="text-2xl font-bold text-blue-600">
              {totalRecipients}
            </p>
            <p className="text-xs text-gray-500 mt-1">Penerima Aktif</p>
          </Card.Content>
        </Card>
        <Card className="border border-gray-100 shadow-sm">
          <Card.Content className="p-4">
            <p className="text-2xl font-bold text-purple-600">
              Rp 42.5jt
            </p>
            <p className="text-xs text-gray-500 mt-1">Anggaran/Bulan</p>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scholarships.map((scholarship) => (
          <Card
            key={scholarship.id}
            className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <Card.Content className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      typeColors[scholarship.type] ??
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {scholarship.type}
                  </span>
                  <Chip
                    size="sm"
                    color={statusConfig[scholarship.status].color}
                    variant="soft"
                  >
                    <Chip.Label>
                      {statusConfig[scholarship.status].label}
                    </Chip.Label>
                  </Chip>
                </div>
              </div>

              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {scholarship.name}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {scholarship.provider}
              </p>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {scholarship.description}
              </p>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-medium text-gray-900">
                    {scholarship.amount.split('/')[0]}
                  </p>
                  <p className="text-[10px] text-gray-400">per bulan</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-medium text-gray-900">
                    {scholarship.recipients}/{scholarship.maxRecipients}
                  </p>
                  <p className="text-[10px] text-gray-400">penerima</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-xs font-medium text-gray-900">
                    {scholarship.endDate}
                  </p>
                  <p className="text-[10px] text-gray-400">berakhir</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Kuota terisi</span>
                  <span>
                    {Math.round(
                      (scholarship.recipients / scholarship.maxRecipients) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                    style={{
                      width: `${(scholarship.recipients / scholarship.maxRecipients) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </Card.Content>
            <Card.Footer className="px-5 py-3 border-t border-gray-50">
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                Detail
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </div>
  )
}
