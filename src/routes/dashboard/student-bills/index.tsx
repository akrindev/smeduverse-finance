import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/student-bills/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/class-bills' })
  },
})
