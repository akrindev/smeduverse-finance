import { createFileRoute } from '@tanstack/react-router'
import { BadgePercent, CalendarDays, GraduationCap, Plus, Users } from 'lucide-react'
import { Button, Card, Chip, Input, TextField } from '@heroui/react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { LoadingState } from '@/components/shared/loading-state'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { useScholarships } from '@/hooks/use-scholarships'
import { formatCurrency } from '@/lib/format'
import {
  cardHeaderClass,
  pageShellClass,
  surfaceCardClass,
} from '@/lib/page-styles'

export const Route = createFileRoute('/dashboard/beasiswa')({
  component: BeasiswaPage,
})

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
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message="Gagal memuat data beasiswa." detail="Silakan coba lagi dalam beberapa saat." />
  }

  return (
    <div className={pageShellClass}>
      <PageHeader title="Manajemen Beasiswa" description="Program beasiswa berbasis data API Finance.">
        <Button variant="primary" className="bg-accent text-accent-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Program
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={GraduationCap}
          iconBgClass="bg-accent-soft"
          iconColorClass="text-accent"
          label="Total Program"
          value={scholarships.length}
        />
        <StatCard
          icon={Users}
          iconBgClass="bg-success/15"
          iconColorClass="text-success"
          label="Aktif"
          value={activeCount}
        />
        <StatCard
          icon={CalendarDays}
          iconBgClass="bg-warning/15"
          iconColorClass="text-warning"
          label="Nonaktif"
          value={inactiveCount}
        />
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
            <EmptyState icon={GraduationCap} message="Tidak ada data beasiswa ditemukan." />
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
