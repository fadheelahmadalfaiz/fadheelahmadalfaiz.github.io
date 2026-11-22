# Changelog

## 2026-11-22 — Auto app catalog + auto build

- Added `scripts/generate-catalog.mjs` to discover public app repos and generate `src/data/apps.generated.json`.
- Catalog includes any public repo whose latest release has an APK/AAB, has the `faiz-app` topic, or has `.github/faiz-app.json`.
- Added `src/data/app-overrides.json` for branding overrides (Faiz Herbals, Chroniq, SubsTracker).
- Reworked home page and download page to use the generated catalog, show multiple release assets, and handle "no build yet" states.
- Added `.github/workflows/build-app.yml` reusable workflow for Flutter, Android/Jetpack, React Native, and Expo.
- Added `templates/app-release.yml` caller workflow and `scripts/onboard-app.mjs` onboarding helper.
- Updated `.github/workflows/deploy-pages.yml` to regenerate the catalog every 2 hours, on push, and on `repository_dispatch: app-release`.
- Added `docs/app-publishing.md` and updated `README.md`.
