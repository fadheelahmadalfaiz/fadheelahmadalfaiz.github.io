# fadheelahmadalfaiz.github.io

Personal link hub + app download pages (Linktree-style).

UI/UX inspired by [Magic UI](https://magicui.design) (dot pattern, meteors, shine border, shimmer button, blur fade, gradient/shiny text) as static CSS — no React build required for GitHub Pages.

## Live URLs

| Path | Page |
| --- | --- |
| `/` | Profile + app list |
| `/apps/faizherbals/` | Faiz Herbals APK download |

## Architecture

- **UI hub**: this repo (GitHub Pages user site)
- **APK source**: [fadheelahmadalfaiz/faizherbals-build](https://github.com/fadheelahmadalfaiz/faizherbals-build) Releases

Download pages fetch `GET /repos/{owner}/{repo}/releases/latest` in the browser.

## Add another app

1. Create `apps/<slug>/index.html` (copy from `apps/faizherbals/`)
2. Change `REPO` constant + branding copy
3. Add a card in root `index.html` → `href="/apps/<slug>/"`
