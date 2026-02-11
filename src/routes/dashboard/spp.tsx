import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/spp')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard/student-bills' })
  },
})
