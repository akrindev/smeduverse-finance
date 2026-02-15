import { Link } from '@tanstack/react-router'
import { Button, Card, Tooltip } from '@heroui/react'
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { navItems } from '@/lib/nav-items'

interface DashboardSidebarProps {
  sidebarExpanded: boolean
  onToggleExpand: () => void
  currentPath: string
  currentSearch?: Record<string, any>
}

export function DashboardSidebar({
  sidebarExpanded,
  onToggleExpand,
  currentPath,
  currentSearch,
}: DashboardSidebarProps) {
  return (
    <aside
      data-testid="dashboard-sidebar"
      className={`hidden lg:flex lg:flex-col lg:shrink-0 transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'lg:w-[200px]' : 'lg:w-[72px]'
      }`}
    >
      <Card className="h-[calc(100vh-3rem)] overflow-hidden">
        <Card.Content
          className={`h-full flex flex-col transition-all duration-300 ${
            sidebarExpanded ? '' : 'items-center'
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
              const isPathMatch = item.exact
                ? currentPath === '/dashboard' || currentPath === '/dashboard/'
                : currentPath.startsWith(item.to)

              let isActive = isPathMatch

              if (isPathMatch && item.to !== '/dashboard') {
                if (item.search) {
                  isActive = Object.entries(item.search).every(
                    ([key, value]) => currentSearch?.[key] === value,
                  )
                } else {
                  // If generic item, check if there's a more specific item that matches
                  const hasSpecificMatch = navItems.some(
                    (other) =>
                      other !== item &&
                      other.to === item.to &&
                      other.search &&
                      Object.entries(other.search).every(
                        ([k, v]) => currentSearch?.[k] === v,
                      ),
                  )
                  isActive = !hasSpecificMatch
                }
              }

              const Icon = item.icon

              const linkClasses = `flex h-11 items-center gap-3 rounded-2xl px-3 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                isActive
                  ? 'bg-accent text-accent-foreground shadow-md shadow-accent/25'
                  : 'text-default-foreground hover:bg-default/60'
              }`

              return sidebarExpanded ? (
                <Link key={`${item.to}-${JSON.stringify(item.search)}`} to={item.to} search={item.search} className={linkClasses}>
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-sm truncate">{item.label}</span>
                </Link>
              ) : (
                <Tooltip key={`${item.to}-${JSON.stringify(item.search)}`}>
                  <Tooltip.Trigger>
                    <Link
                      to={item.to}
                      search={item.search}
                      className={`flex w-11 h-11 items-center justify-center rounded-2xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                        isActive
                          ? 'bg-accent text-accent-foreground shadow-md shadow-accent/25'
                          : 'text-default-foreground hover:bg-default/60'
                      }`}
                      aria-label={item.label}
                    >
                      <Icon className="w-[18px] h-[18px]" />
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
          </div>
        </Card.Content>
      </Card>
    </aside>
  )
}
