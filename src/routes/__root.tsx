import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Toast } from '@heroui/react'
import { useEffect } from 'react'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark'
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)
  }, [])

  return (
    <>
      <Outlet />
      <Toast.Provider placement="top end" />
    </>
  )
}
