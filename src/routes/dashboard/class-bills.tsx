import { createFileRoute, Outlet } from '@tanstack/react-router'
import { z } from 'zod'

const classBillsSearchSchema = z.object({
  search: z.string().optional(),
  tahun_ajaran_id: z.number().optional(),
  semester_id: z.number().optional(),
})

export type ClassBillsSearch = z.infer<typeof classBillsSearchSchema>

export const Route = createFileRoute('/dashboard/class-bills')({
  validateSearch: (search) => classBillsSearchSchema.parse(search),
  component: () => <Outlet />,
})
