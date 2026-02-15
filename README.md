# Smeduverse Finance

Frontend aplikasi keuangan sekolah berbasis **React 19 + TanStack Router (SPA)**.

## Stack

- Vite 7
- TanStack Router (file-based routing)
- TanStack Query
- HeroUI v3 (beta)
- Tailwind CSS v4

## Development

```bash
npm install
npm run dev
```

Aplikasi berjalan di client (browser) sebagai SPA.

## Production Build

```bash
npm run build
npm run preview
```

Build Vite sudah dioptimalkan untuk deployment produksi (chunk splitting vendor, minify, dan static asset caching lewat konfigurasi Vercel).

## Vercel Deployment

Project ini siap deploy ke Vercel sebagai SPA:

- Output build: `dist`
- SPA fallback: semua route di-rewrite ke `index.html`
- Static assets (`/assets/*`) dikonfigurasi immutable cache

Cukup import repository ke Vercel, lalu deploy dengan pengaturan default (konfigurasi sudah ada di `vercel.json`).

## Routing

Route didefinisikan di `src/routes` dan route tree digenerate otomatis ke `src/routeTree.gen.ts` oleh plugin TanStack Router saat development/build.
