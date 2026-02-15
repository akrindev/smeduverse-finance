import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import { defineConfig, loadEnv } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

const vendorChunkGroups: Array<[chunkName: string, matchers: string[]]> = [
  ['react-vendor', ['react', 'react-dom', 'scheduler']],
  ['router-vendor', ['@tanstack/react-router', '@tanstack/router-core']],
  ['query-vendor', ['@tanstack/react-query']],
  ['table-vendor', ['@tanstack/react-table']],
  ['heroui-vendor', ['@heroui/react', '@heroui/styles', 'framer-motion']],
  [
    'react-aria-vendor',
    [
      'react-aria-components',
      '@react-aria',
      '@react-stately',
      '@react-types',
      '@react-spectrum',
      '@internationalized',
    ],
  ],
  ['icons-vendor', ['lucide-react']],
  ['form-vendor', ['@tanstack/react-form', 'react-hook-form', 'zod']],
  ['utility-vendor', ['axios', 'zustand', 'web-vitals']],
]

const resolveVendorChunk = (id: string) => {
  if (!id.includes('/node_modules/')) {
    return undefined
  }

  for (const [chunkName, matchers] of vendorChunkGroups) {
    if (matchers.some((matcher) => id.includes(`/node_modules/${matcher}/`))) {
      return chunkName
    }
  }

  return 'vendor'
}

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    appType: 'spa',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
        '/sanctum': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      target: 'es2022',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: resolveVendorChunk,
        },
      },
    },
    plugins: [
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tailwindcss(),
      tanstackRouter({
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts',
        autoCodeSplitting: true,
      }),
      viteReact({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
    ],
  }
})

export default config
