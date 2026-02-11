import { Link } from '@tanstack/react-router'
import { Button, Card } from '@heroui/react'
import { navItems } from '@/lib/nav-items'

interface MobileBottomNavProps {
  currentPath: string
}

export function MobileBottomNav({ currentPath }: MobileBottomNavProps) {
  return (
    <Card className="fixed bottom-2 left-2 right-2 z-30 rounded-2xl border border-border/50 bg-surface/92 backdrop-blur-xl lg:hidden">
      <Card.Content className="p-1.5">
        <div className="grid grid-cols-7 gap-0.5">
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
                  className={`h-9 rounded-xl ${isActive ? 'bg-accent text-accent-foreground shadow-md shadow-accent/25' : ''}`}
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
  )
}
