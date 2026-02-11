import { createFileRoute } from '@tanstack/react-router'
import { BadgePercent, CalendarDays, GraduationCap, Plus, Users } from 'lucide-react'
import { Button, Card, Chip, Input, Spinner, TextField } from '@heroui/react'
import { useMemo, useState } from 'react'
import { useScholarships } from '@/hooks/use-scholarships'
import {
  cardHeaderClass,
  pageHeaderClass,
  pageShellClass,
  surfaceCardClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/beasiswa')({
  component: BeasiswaPage,
})

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatScholarshipValue(discountType: 'fixed' | 'percent', discountValue: number): string {
  if (discountType === 'percent') {
    return `${discountValue}%`
  }

  return formatCurrency(discountValue)
}

function BeasiswaPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading, error } = useScholarships()

  const scholarships = data?.data ?? []

  const filteredScholarships = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return scholarships
    }

    return scholarships.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        (item.description ?? '').toLowerCase().includes(query)
      )
    })
  }, [scholarships, searchQuery])

  const activeCount = scholarships.filter((item) => item.is_active).length
  const inactiveCount = scholarships.length - activeCount

  if (isLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="max-w-xl mx-auto border border-danger/20 bg-danger/5">
        <Card.Content className="p-6">
          <p className="text-danger font-medium">Gagal memuat data beasiswa.</p>
          <p className="text-sm text-default-500 mt-1">Silakan coba lagi dalam beberapa saat.</p>
        </Card.Content>
      </Card>
    )
  }

  return (
    <div className={pageShellClass}>
      <div className={pageHeaderClass}>
        <div>
          <h1 className="text-2xl font-semibold">Manajemen Beasiswa</h1>
          <p className="text-sm text-default-500 mt-1">Program beasiswa berbasis data API Finance.</p>
        </div>
        <Button variant="primary" className="bg-accent text-accent-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Program
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 sm:p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-soft text-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-default-500">Total Program</p>
              <p className="text-xl font-semibold">{scholarships.length}</p>
            </div>
          </Card.Content>
        </Card>
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 sm:p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-success/15 text-success flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-default-500">Aktif</p>
              <p className="text-xl font-semibold">{activeCount}</p>
            </div>
          </Card.Content>
        </Card>
        <Card className={surfaceCardClass}>
          <Card.Content className="p-4 sm:p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-warning/15 text-warning flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-default-500">Nonaktif</p>
              <p className="text-xl font-semibold">{inactiveCount}</p>
            </div>
          </Card.Content>
        </Card>
      </div>

      <Card className={surfaceCardClass}>
        <Card.Header className={cardHeaderClass}>
          <TextField fullWidth>
            <Input
              aria-label="Cari beasiswa"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama, kode, atau deskripsi beasiswa"
            />
          </TextField>
        </Card.Header>
        <Card.Content className="px-5 pb-5">
          {filteredScholarships.length === 0 ? (
            <div className="py-10 text-center text-sm text-default-500">Tidak ada data beasiswa ditemukan.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredScholarships.map((item) => (
                <Card key={item.id} className={surfaceCardClass}>
                  <Card.Content className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-default-500 font-mono">{item.code}</p>
                        <h3 className="text-base font-semibold mt-1">{item.name}</h3>
                      </div>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={item.is_active ? 'success' : 'default'}
                      >
                        <Chip.Label>{item.is_active ? 'Aktif' : 'Nonaktif'}</Chip.Label>
                      </Chip>
                    </div>

                    <p className="text-sm text-default-500">
                      {item.description ?? 'Tanpa deskripsi'}
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-2xl bg-accent-soft/40 p-3">
                        <div className="text-xs text-default-500 flex items-center gap-1.5">
                          <BadgePercent className="w-3.5 h-3.5" />
                          Nilai Diskon
                        </div>
                        <p className="text-sm font-semibold mt-1">
                          {formatScholarshipValue(item.discount_type, item.discount_value)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-surface p-3 border border-border/50">
                        <div className="text-xs text-default-500">Tipe Biaya</div>
                        <p className="text-sm font-semibold mt-1">{item.fee_type?.name ?? 'Semua biaya'}</p>
                      </div>
                    </div>

                    <div className="text-xs text-default-500">
                      Periode:{' '}
                      {item.start_date ?? '-'} sampai {item.end_date ?? '-'}
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
