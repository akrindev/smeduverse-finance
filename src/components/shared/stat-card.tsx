import { Card } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'
import { surfaceCardClass } from '@/lib/page-styles'

interface StatCardProps {
  icon: LucideIcon
  iconBgClass: string
  iconColorClass: string
  label: string
  value: string | number
  valueColorClass?: string
}

export function StatCard({
  icon: Icon,
  iconBgClass,
  iconColorClass,
  label,
  value,
  valueColorClass,
}: StatCardProps) {
  return (
    <Card className={surfaceCardClass}>
      <Card.Content className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBgClass} ${iconColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-default-500">{label}</p>
          <p className={`text-xl font-semibold ${valueColorClass ?? ''}`}>{value}</p>
        </div>
      </Card.Content>
    </Card>
  )
}
