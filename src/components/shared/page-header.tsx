import type { ReactNode } from 'react'
import { pageHeaderClass } from '@/lib/page-styles'

interface PageHeaderProps {
  title: string
  description: string
  children?: ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className={pageHeaderClass}>
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-default-500 mt-1">{description}</p>
      </div>
      {children}
    </div>
  )
}
