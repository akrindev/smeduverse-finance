import { DashboardHeader } from '@/components/layouts/dashboard-header'
import { DashboardSidebar } from '@/components/layouts/dashboard-sidebar'
import { MobileBottomNav } from '@/components/layouts/mobile-bottom-nav'
import { isAuthenticated } from '@/lib/api-client'
import { useAuth } from '@/lib/auth'
import { useAuthStore } from '@/lib/auth-store'
import { getInitials, navItems } from '@/lib/nav-items'
import { Card, Spinner } from '@heroui/react'
import { createFileRoute, Outlet, redirect, useMatches, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ location }) => {
    const hasSession = isAuthenticated() || !!useAuthStore.getState().token

    if (!hasSession) {
      throw redirect({
        to: '/auth',
        search: {
          redirect: `${location.pathname}${location.searchStr}`,
        },
      })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const navigate = useNavigate()
  const matches = useMatches()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const currentMatch = matches[matches.length - 1]
  const currentPath = currentMatch?.fullPath ?? '/dashboard'
  const currentSearch = currentMatch?.search as Record<string, any>

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate({
        to: '/auth',
        search: {
          redirect: `${window.location.pathname}${window.location.search}`,
        },
      })
    }
  }, [isAuthenticated, isLoading, navigate])

  const activeNav = useMemo(
    () =>
      navItems.find((item) => {
        if (item.exact) {
          return currentPath === '/dashboard' || currentPath === '/dashboard/'
        }

        const isPathMatch = currentPath.startsWith(item.to)
        if (!isPathMatch) return false

        if (item.to === '/dashboard') return true

        if (item.search) {
          return Object.entries(item.search).every(
            ([key, value]) => currentSearch?.[key] === value,
          )
        }

        // Check if there's a more specific match for this path
        const hasSpecificMatch = navItems.some(
          (other) =>
            other !== item &&
            other.to === item.to &&
            other.search &&
            Object.entries(other.search).every(
              ([k, v]) => currentSearch?.[k] === v,
            ),
        )

        return !hasSpecificMatch
      }),
    [currentPath, currentSearch],
  )

  const displayName = user?.teacher?.fullname ?? user?.username ?? 'Bendahara'
  const displayEmail = user?.email ?? ''
  const initials = getInitials(displayName)

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/auth' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1720px] p-3 sm:p-4 lg:p-5">
        <div className="flex gap-4 lg:gap-5">
          <DashboardSidebar
            sidebarExpanded={sidebarExpanded}
            onToggleExpand={() => setSidebarExpanded(!sidebarExpanded)}
            currentPath={currentPath}
            currentSearch={currentSearch}
          />

          <section className="flex-1 min-w-0">
            <Card className="min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)]">
              <Card.Content className="flex flex-col h-full">
                <DashboardHeader
                  activeLabel={activeNav?.label ?? 'Dashboard'}
                  displayName={displayName}
                  displayEmail={displayEmail}
                  initials={initials}
                  onLogout={handleLogout}
                  onMenuPress={() => setMobileNavOpen(!mobileNavOpen)}
                />

                <main className="flex-1 overflow-auto pb-16 lg:pb-2">
                  <Outlet />
                </main>
              </Card.Content>
            </Card>
          </section>
        </div>
      </div>
      <MobileBottomNav currentPath={currentPath} currentSearch={currentSearch} />
    </div>
  )
}
