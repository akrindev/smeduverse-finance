import { navItems } from '@/lib/nav-items'
import { Card } from '@heroui/react'
import { Link } from '@tanstack/react-router'

interface MobileBottomNavProps {
  currentPath: string
  currentSearch?: Record<string, any>
}

export function MobileBottomNav({ currentPath, currentSearch }: MobileBottomNavProps) {
  return (
    <Card className="lg:hidden right-2 bottom-2 left-2 z-30 fixed bg-surface/92 backdrop-blur-xl border border-border/50 rounded-2xl">
      <Card.Content className="">
        <div
          className="gap-0.5 grid"
          style={{
            gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))`,
          }}
        >
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

            return (
              <Link
                key={`${item.to}-${JSON.stringify(item.search)}`}
                to={item.to}
                search={item.search}
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
