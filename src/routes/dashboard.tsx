import { createFileRoute, Link, Outlet, redirect, useMatches, useNavigate } from '@tanstack/react-router'
import { Avatar, Button, Card, Chip, Dropdown, Spinner, Tooltip } from '@heroui/react'
import {
  BarChart3,
  Bell,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Tag,
  User,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { isAuthenticated } from '@/lib/api-client'
import { useAuthStore } from '@/lib/auth-store'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    const hasSession = isAuthenticated() || !!useAuthStore.getState().token

    if (!hasSession) {
      throw redirect({ to: '/auth' })
    }
  },
  component: DashboardLayout,
})

const navItems = [
  { to: '/dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/spp' as const, label: 'SPP', icon: Receipt },
  { to: '/dashboard/fee-types' as const, label: 'Jenis Biaya', icon: Tag },
  { to: '/dashboard/beasiswa' as const, label: 'Beasiswa', icon: GraduationCap },
  { to: '/dashboard/payments' as const, label: 'Pembayaran', icon: CreditCard },
  { to: '/dashboard/reports' as const, label: 'Laporan', icon: BarChart3 },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const navigate = useNavigate()
  const matches = useMatches()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const currentPath = matches[matches.length - 1]?.fullPath ?? '/dashboard'

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate({ to: '/auth' })
    }
  }, [isAuthenticated, isLoading, navigate])

  const activeNav = useMemo(
    () =>
      navItems.find((item) => {
        if (item.exact) {
          return currentPath === '/dashboard' || currentPath === '/dashboard/'
        }

        return currentPath.startsWith(item.to)
      }),
    [currentPath],
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
          <aside className="hidden lg:flex lg:flex-col lg:w-[72px] lg:shrink-0">
            <Card className="h-[calc(100vh-3rem)] rounded-[24px] border border-border/50 bg-surface/90 backdrop-blur-xl">
              <Card.Content className="h-full py-5 px-2.5 flex flex-col items-center">
                <div className="w-11 h-11 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/25">
                  <GraduationCap className="w-5 h-5" />
                </div>

                <div className="mt-8 flex flex-col items-center gap-1.5 flex-1">
                  {navItems.map((item) => {
                    const isActive = item.exact
                      ? currentPath === '/dashboard' || currentPath === '/dashboard/'
                      : currentPath.startsWith(item.to)
                    const Icon = item.icon

                    return (
                      <Tooltip key={item.to}>
                        <Tooltip.Trigger>
                          <Link to={item.to}>
                            <Button
                              isIconOnly
                              variant={isActive ? 'primary' : 'ghost'}
                              className={`w-11 h-11 rounded-2xl ${
                                isActive
                                  ? 'bg-accent text-accent-foreground shadow-md shadow-accent/25'
                                  : 'text-default-foreground hover:bg-default/60'
                              }`}
                              aria-label={item.label}
                            >
                              <Icon className="w-[18px] h-[18px]" />
                            </Button>
                          </Link>
                        </Tooltip.Trigger>
                        <Tooltip.Content>{item.label}</Tooltip.Content>
                      </Tooltip>
                    )
                  })}
                </div>

                <div className="flex flex-col items-center gap-2 mt-auto">
                  <Button
                    isIconOnly
                    variant="ghost"
                    className="w-11 h-11 rounded-2xl text-default-foreground hover:bg-default/60 relative"
                    aria-label="Notifikasi"
                  >
                    <Bell className="w-[18px] h-[18px]" />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
                  </Button>

                  <Dropdown>
                    <Dropdown.Trigger>
                      <Button isIconOnly variant="ghost" className="w-11 h-11 rounded-2xl p-0" aria-label="Akun">
                        <Avatar size="sm" color="accent">
                          <Avatar.Fallback>{initials}</Avatar.Fallback>
                        </Avatar>
                      </Button>
                    </Dropdown.Trigger>
                    <Dropdown.Popover placement="right">
                      <Dropdown.Menu aria-label="User menu">
                        <Dropdown.Item id="user-info" textValue={displayName}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{displayName}</span>
                            <span className="text-xs text-default-500">{displayEmail}</span>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item id="profile">
                          <User className="w-4 h-4 mr-2 inline" />
                          Profil
                        </Dropdown.Item>
                        <Dropdown.Item id="settings">
                          <Settings className="w-4 h-4 mr-2 inline" />
                          Pengaturan
                        </Dropdown.Item>
                        <Dropdown.Item id="logout" className="text-danger" onAction={handleLogout}>
                          <LogOut className="w-4 h-4 mr-2 inline" />
                          Keluar
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                </div>
              </Card.Content>
            </Card>
          </aside>

          <section className="flex-1 min-w-0">
            <Card className="rounded-[24px] border border-border/50 bg-surface/90 backdrop-blur-xl min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)]">
              <Card.Content className="p-4 sm:p-5 lg:p-6 flex flex-col h-full">
                <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md rounded-2xl border border-border/50 px-3.5 py-2.5 sm:px-4 mb-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Button
                        variant="secondary"
                        isIconOnly
                        size="sm"
                        className="lg:hidden rounded-xl"
                        aria-label="Menu"
                        onPress={() => setMobileNavOpen(!mobileNavOpen)}
                      >
                        <Menu className="w-4 h-4" />
                      </Button>
                      <div className="min-w-0">
                        <p className="text-xs text-default-500">Finance Workspace</p>
                        <h2 className="text-base sm:text-lg font-semibold truncate">
                          {activeNav?.label ?? 'Dashboard'}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Chip size="sm" variant="soft" color="success" className="hidden sm:inline-flex">
                        <Chip.Label>Online</Chip.Label>
                      </Chip>
                      <Button
                        variant="secondary"
                        isIconOnly
                        size="sm"
                        aria-label="Notifikasi"
                        className="relative rounded-xl lg:hidden"
                      >
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
                      </Button>
                      <Dropdown>
                        <Dropdown.Trigger>
                          <Button isIconOnly variant="ghost" className="rounded-xl p-0 hidden lg:flex" aria-label="Akun">
                            <Avatar size="sm" color="accent">
                              <Avatar.Fallback>{initials}</Avatar.Fallback>
                            </Avatar>
                          </Button>
                        </Dropdown.Trigger>
                        <Dropdown.Popover placement="bottom end">
                          <Dropdown.Menu aria-label="User menu header">
                            <Dropdown.Item id="header-user-info" textValue={displayName}>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{displayName}</span>
                                <span className="text-xs text-default-500">{displayEmail}</span>
                              </div>
                            </Dropdown.Item>
                            <Dropdown.Item id="header-profile">
                              <User className="w-4 h-4 mr-2 inline" />
                              Profil
                            </Dropdown.Item>
                            <Dropdown.Item id="header-settings">
                              <Settings className="w-4 h-4 mr-2 inline" />
                              Pengaturan
                            </Dropdown.Item>
                            <Dropdown.Item id="header-logout" className="text-danger" onAction={handleLogout}>
                              <LogOut className="w-4 h-4 mr-2 inline" />
                              Keluar
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown.Popover>
                      </Dropdown>
                    </div>
                  </div>
                </header>

                <main className="flex-1 overflow-auto pb-24 lg:pb-2">
                  <Outlet />
                </main>
              </Card.Content>
            </Card>
          </section>
        </div>
      </div>

      <Card className="fixed bottom-3 left-3 right-3 z-30 rounded-3xl border border-border/50 bg-surface/92 backdrop-blur-xl lg:hidden">
        <Card.Content className="p-2">
          <div className="grid grid-cols-6 gap-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? currentPath === '/dashboard' || currentPath === '/dashboard/'
                : currentPath.startsWith(item.to)
              const Icon = item.icon

              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    fullWidth
                    isIconOnly
                    variant={isActive ? 'primary' : 'ghost'}
                    className={`h-11 rounded-2xl ${
                      isActive ? 'bg-accent text-accent-foreground shadow-md shadow-accent/25' : ''
                    }`}
                    aria-label={item.label}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                </Link>
              )
            })}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
