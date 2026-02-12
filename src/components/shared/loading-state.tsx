import { Spinner } from '@heroui/react'

export function LoadingState({ minHeight = '420px' }: { minHeight?: string }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight }}>
      <Spinner size="lg" />
    </div>
  )
}
