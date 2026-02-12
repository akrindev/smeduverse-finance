import { Card } from '@heroui/react'
import type { LucideIcon } from 'lucide-react'

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
    <Card className="border border-border/50 shadow-sm bg-surface/50 backdrop-blur-sm">
      <Card.Content className="flex flex-row gap-4">
        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${iconBgClass} ${iconColorClass} shadow-inner`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-xs font-medium text-default-500 uppercase tracking-wider truncate">{label}</p>
          <p className={`text-xl font-bold tracking-tight truncate ${valueColorClass ?? 'text-foreground'}`}>
            {value}
          </p>
        </div>
      </Card.Content>
    </Card>
  )
}

