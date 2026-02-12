import { PageHeader } from '@/components/shared/page-header'
import { pageShellClass } from '@/lib/page-styles'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/student-bills')({
  component: StudentBillsLayout,
})

function StudentBillsLayout() {
  return (
    <div className={pageShellClass}>
      <PageHeader title="Tagihan Siswa" description="Alur kelas ke siswa untuk melihat dan membayar tagihan." />
      <Outlet />
    </div>
  )
}
