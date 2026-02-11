import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Toast } from '@heroui/react'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toast.Provider placement="top end" />
    </>
  )
}
