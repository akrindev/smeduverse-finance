import { createBrowserHistory, createRouter } from '@tanstack/react-router'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'

import { routeTree } from './routeTree.gen'

export const getRouter = () => {
  const rqContext = TanstackQuery.getContext()

  const router = createRouter({
    routeTree,
    history: createBrowserHistory(),
    context: {
      ...rqContext,
    },
    defaultPreload: 'intent',
  })

  return router
}
