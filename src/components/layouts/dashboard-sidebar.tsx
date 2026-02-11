import { Link } from '@tanstack/react-router'
import { Button, Card, Tooltip } from '@heroui/react'
import { Bell, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { navItems } from '@/lib/nav-items'
import { UserMenu } from '@/components/layouts/user-menu'

interface DashboardSidebarProps {
  sidebarExpanded: boolean
  onToggleExpand: () => void
  currentPath: string
  displayName: string
  displayEmail: string
  initials: string
  onLogout: () => void
}

export function DashboardSidebar({
  sidebarExpanded,
  onToggleExpand,
  currentPath,
  displayName,
  displayEmail,
  initials,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <aside
      data-testid="dashboard-sidebar"
      className={`hidden lg:flex lg:flex-col lg:shrink-0 transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'lg:w-[200px]' : 'lg:w-[72px]'
      }`}
    >
      <Card className="h-[calc(100vh-3rem)] rounded-[24px] border border-border/50 bg-surface/90 backdrop-blur-xl overflow-hidden">
        <Card.Content
          className={`h-full py-5 flex flex-col transition-all duration-300 ${
            sidebarExpanded ? 'px-3' : 'px-2.5 items-center'
          }`}
        >
          <div className={`flex items-center ${sidebarExpanded ? 'gap-3 px-1' : 'justify-center'}`}>
            <div className="w-11 h-11 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center shadow-lg shadow-accent/25 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {sidebarExpanded && <span className="font-semibold text-sm text-foreground truncate">Finance</span>}
          </div>

          <div className={`mt-8 flex flex-col gap-1.5 flex-1 ${sidebarExpanded ? '' : 'items-center'}`}>
            {navItems.map((item) => {
              const isActive = item.exact
                ? currentPath === '/dashboard' || currentPath === '/dashboard/'
                : currentPath.startsWith(item.to)
              const Icon = item.icon

              return sidebarExpanded ? (
                <Link key={item.to} to={item.to}>
                  <Button
                    data-testid="sidebar-nav-item"
                    fullWidth
                    variant={isActive ? 'primary' : 'ghost'}
                    className={`h-11 rounded-2xl justify-start gap-3 px-3 ${
                      isActive
                        ? 'bg-accent text-accent-foreground shadow-md shadow-accent/25'
                        : 'text-default-foreground hover:bg-default/60'
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="text-sm truncate">{item.label}</span>
                  </Button>
                </Link>
              ) : (
                <Tooltip key={item.to}>
                  <Tooltip.Trigger>
                    <Link to={item.to}>
                      <Button
                        data-testid="sidebar-nav-item"
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

          <div className={`flex flex-col gap-2 mt-auto ${sidebarExpanded ? '' : 'items-center'}`}>
            <Tooltip>
              <Tooltip.Trigger>
                <Button
                  isIconOnly
                  variant="ghost"
                  className="w-11 h-11 rounded-2xl text-default-foreground hover:bg-default/60"
                  aria-label={sidebarExpanded ? 'Tutup sidebar' : 'Buka sidebar'}
                  onPress={onToggleExpand}
                >
                  {sidebarExpanded ? <ChevronLeft className="w-[18px] h-[18px]" /> : <ChevronRight className="w-[18px] h-[18px]" />}
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>{sidebarExpanded ? 'Tutup sidebar' : 'Buka sidebar'}</Tooltip.Content>
            </Tooltip>

            <Button
              isIconOnly
              variant="ghost"
              className="w-11 h-11 rounded-2xl text-default-foreground hover:bg-default/60 relative"
              aria-label="Notifikasi"
            >
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
            </Button>

            <UserMenu
              displayName={displayName}
              displayEmail={displayEmail}
              initials={initials}
              placement="right"
              onLogout={onLogout}
              className="w-11 h-11 rounded-2xl p-0"
            />
          </div>
        </Card.Content>
      </Card>
    </aside>
  )
}
