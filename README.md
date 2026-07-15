# fadheelahmadalfaiz.github.io

Personal link hub + app download pages.

Stack: **Vite + React + TypeScript + Tailwind CSS + shadcn/ui (Radix primitives)**.

## Live

| Path | Page |
| --- | --- |
| `/` | Profile + app list |
| `/apps/faizherbals/` | Faiz Herbals APK download |

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Architecture

- UI: this repo (GitHub Pages user site)
- APK source of truth: [fadheelahmadalfaiz/faizherbals-build](https://github.com/fadheelahmadalfaiz/faizherbals-build) Releases
- Logo asset: `public/logo-faizherbals.jpg` (copied from private app repo assets)

## Add another app

1. Put logo in `public/`
2. Append entry in `src/data/apps.ts`
3. Route `/apps/:slug/` is already handled by `AppDownloadPage`
