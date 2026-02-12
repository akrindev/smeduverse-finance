import { Link } from '@tanstack/react-router'
import { Card } from '@heroui/react'
import { navItems } from '@/lib/nav-items'

interface MobileBottomNavProps {
  currentPath: string
}

export function MobileBottomNav({ currentPath }: MobileBottomNavProps) {
  return (
    <Card className="fixed bottom-2 left-2 right-2 z-30 rounded-2xl border border-border/50 bg-surface/92 backdrop-blur-xl lg:hidden">
      <Card.Content className="p-1.5">
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
          }}
        >
          {navItems.map((item) => {
            const isActive = item.exact
              ? currentPath === '/dashboard' || currentPath === '/dashboard/'
              : currentPath.startsWith(item.to)
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center h-10 rounded-xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  isActive ? 'bg-accent text-accent-foreground shadow-md shadow-accent/25' : 'text-default-foreground'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-4 h-4" />
              </Link>
            )
          })}
        </div>
      </Card.Content>
    </Card>
  )
}
