import { Button, Chip } from '@heroui/react'
import { Bell, Menu } from 'lucide-react'
import { UserMenu } from '@/components/layouts/user-menu'

interface DashboardHeaderProps {
  activeLabel: string
  displayName: string
  displayEmail: string
  initials: string
  onLogout: () => void
  onMenuPress: () => void
}

export function DashboardHeader({
  activeLabel,
  displayName,
  displayEmail,
  initials,
  onLogout,
  onMenuPress,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md rounded-2xl border border-border/50 px-3.5 py-2.5 sm:px-4 mb-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="secondary"
            isIconOnly
            size="sm"
            className="lg:hidden rounded-xl"
            aria-label="Menu"
            onPress={onMenuPress}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs text-default-500">Finance Workspace</p>
            <h2 className="text-base sm:text-lg font-semibold truncate">{activeLabel}</h2>
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
          <UserMenu
            displayName={displayName}
            displayEmail={displayEmail}
            initials={initials}
            placement="bottom end"
            onLogout={onLogout}
            className="rounded-xl p-0 hidden lg:flex"
          />
        </div>
      </div>
    </header>
  )
}
