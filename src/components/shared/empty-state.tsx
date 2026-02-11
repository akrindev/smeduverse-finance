import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  message: string
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <Icon className="w-10 h-10 text-default-300 mx-auto mb-3" />
      <p className="text-default-500">{message}</p>
    </div>
  )
}
