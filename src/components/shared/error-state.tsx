import { Card } from '@heroui/react'

interface ErrorStateProps {
  message: string
  detail?: string
}

export function ErrorState({ message, detail }: ErrorStateProps) {
  return (
    <Card className="max-w-xl mx-auto border border-danger/20 bg-danger/5">
      <Card.Content className="p-6">
        <p className="text-danger font-medium">{message}</p>
        {detail && <p className="text-sm text-default-500 mt-1">{detail}</p>}
      </Card.Content>
    </Card>
  )
}
