import { createFileRoute, Outlet } from '@tanstack/react-router'
import { z } from 'zod'

const studentBillsSearchSchema = z.object({
  tahun_ajaran_id: z.number().optional(),
  semester_id: z.number().optional(),
  classId: z.string().optional(),
})

export type StudentBillsSearch = z.infer<typeof studentBillsSearchSchema>

export const Route = createFileRoute('/dashboard/student-bills')({
  validateSearch: (search) => studentBillsSearchSchema.parse(search),
  component: () => <Outlet />,
})
