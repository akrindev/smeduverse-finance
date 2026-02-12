import { LoadingState } from '@/components/shared/loading-state'
import { ErrorState } from '@/components/shared/error-state'
import { useRefRombels } from '@/hooks/use-references'
import { formatCurrency } from '@/lib/format'
import { getRombelLabel, sortRombelsByJenjang } from '@/lib/tagihan-siswa'
import type { Rombel } from '@/types/finance'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

export const Route = createFileRoute('/dashboard/student-bills/')({
  component: ClassListPage,
})

function ClassListPage() {
  const navigate = useNavigate()
  
  const rombelsParams = useMemo(() => ({ per_page: 100, active_only: true }), [])
  const {
    data: rombelsData,
    isLoading: rombelsLoading,
    error: rombelsError,
  } = useRefRombels(rombelsParams)

  const rombels = useMemo(() => sortRombelsByJenjang(rombelsData?.data ?? []), [rombelsData?.data])

  function selectClass(rombel: Rombel): void {
    if ((rombel.anggota_count ?? 0) === 0) return
    navigate({
      to: '/dashboard/student-bills/$classId',
      params: { classId: rombel.id },
    })
  }

  if (rombelsLoading) return <LoadingState minHeight="300px" />
  if (rombelsError) return <ErrorState message="Gagal memuat daftar kelas." detail="Silakan coba lagi dalam beberapa saat." />

  return (
    <div className="space-y-6">
      <div data-testid="class-cards-grid" className="gap-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {rombels.map((rombel) => {
          const metrics = rombel.summary
          const activeStudents = rombel.anggota_count ?? 0
          const isDisabled = activeStudents === 0
          const label = getRombelLabel(rombel)

          return (
            <div
              key={rombel.id}
              data-testid="class-card"
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-disabled={isDisabled}
              className={`p-4 flex flex-col items-stretch text-left border border-border/50 hover:border-accent/40 transition-colors rounded-[24px] bg-surface/90 backdrop-blur-xl ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={() => !isDisabled && selectClass(rombel)}
              onKeyDown={(e) => {
                if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  selectClass(rombel)
                }
              }}
            >
              <div className="flex justify-between items-start gap-3 mb-4 w-full">
                <div>
                  <p className="font-semibold text-foreground text-lg">{label}</p>
                  <p className="text-default-500 text-xs">
                    Jenjang {rombel.tingkat_kelas ?? '-'}
                  </p>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isDisabled ? 'bg-default/10 text-default-500' : 'bg-accent/10 text-accent'}`}>
                  {activeStudents} siswa
                </div>
              </div>

              <div className="space-y-2">
                <MetricRow label="Total Tagihan Netto" value={formatCurrency(metrics?.total_net ?? 0)} />
                <MetricRow label="Total Terbayar" value={formatCurrency(metrics?.total_paid ?? 0)} />
                <MetricRow
                  label="Total Outstanding"
                  value={formatCurrency(metrics?.total_outstanding ?? 0)}
                  valueClass={(metrics?.total_outstanding ?? 0) > 0 ? 'text-danger' : 'text-success'}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MetricRow({
  label,
  value,
  valueClass,
  testId,
}: {
  label: string
  value: string
  valueClass?: string
  testId?: string
}) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-default-500 text-sm">{label}</p>
      <p data-testid={testId} className={`text-sm font-semibold ${valueClass ?? 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}
