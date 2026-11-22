# fadheelahmadalfaiz.github.io

Personal link hub + app download pages.

Stack: **Vite + React + TypeScript + Tailwind CSS + shadcn/ui (Radix primitives)**.

## Live

| Path | Page |
| --- | --- |
| `/` | Profile + app list |
| `/apps/chroniq/` | Chroniq APK download |
| `/apps/faizherbals/` | Faiz Herbals APK download |
| `/apps/substracker/` | SubsTracker APK download |

## How the app catalog works

The app list is **generated automatically**, not typed by hand.

At build time, `scripts/generate-catalog.mjs`:

1. Lists public, non-fork repos owned by `fadheelahmadalfaiz`.
2. Reads the latest GitHub Release of each repo.
3. Includes a repo when **any** of these is true:
   - the latest release has an `.apk` or `.aab` asset,
   - the repo has the `faiz-app` topic,
   - the repo has a `.github/faiz-app.json` metadata file.
4. Writes `src/data/apps.generated.json`, which is bundled into the site.

The deployed site is refreshed:

- on every push to `main`,
- every 2 hours via schedule,
- immediately when an app repo sends a `repository_dispatch` event named `app-release`.

APKs are **not stored in this repo or in the Pages artifact**. Downloads point to the app repo's GitHub Release assets, so the site stays small.

## Add a new app

### Option A — repo already publishes an APK/AAB

Publish a GitHub Release with an `.apk` or `.aab` asset. The next catalog sync lists it automatically at `/apps/<slug>/`.

### Option B — use the shared build workflow

1. Make the app repo public.
2. Copy [`templates/app-release.yml`](../templates/app-release.yml) to the app repo as `.github/workflows/release.yml`.
3. Push to `main` (or run the `Release app` workflow manually).

Or run the onboarding helper:

```bash
node scripts/onboard-app.mjs owner/repo
```

The helper adds the `faiz-app` topic and writes the caller workflow. It needs a token with `repo` and `workflow` scopes (`gh auth token` is used automatically).

The reusable workflow supports:

- Flutter (`pubspec.yaml`),
- Android / Jetpack Compose (`gradlew` + `settings.gradle`),
- React Native (`package.json` + `android/gradlew`),
- Expo (`package.json` + `expo`).

### List an app before its first release

Add the topic `faiz-app` to the repo, or add `.github/faiz-app.json`. The app appears with a "Belum ada build" state until a release exists.

## Optional app metadata

Create `.github/faiz-app.json` in the app repo:

```json
{
  "slug": "chroniq",
  "name": "Chroniq",
  "description": "Alarm presisi per tanggal dengan full-screen ringing.",
  "logo": "docs/assets/chroniq-logo.png",
  "homepage": "https://example.com",
  "stack": "Android",
  "platforms": ["android"]
}
```

All fields are optional. A relative `logo` is resolved against the repo's default branch; an absolute URL or a path starting with `/` is used as-is. Without a logo, the site tries common Android/Flutter icon paths and falls back to initials.

Branding for existing apps can be overridden in [`src/data/app-overrides.json`](../src/data/app-overrides.json) without touching the app repo.

## Signing

The reusable workflow reads these optional secrets from the app repo:

| Secret | Purpose |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `.jks` keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias |
| `ANDROID_KEY_PASSWORD` | Key password |
| `HUB_DISPATCH_TOKEN` | PAT with `repo` scope, to trigger an instant hub refresh |

If no keystore is configured:

- Flutter release builds use Flutter's default signing (installable, but not Play-ready).
- Android/React Native/Expo builds fall back to a debug APK so the download still works.

## Local development

```bash
npm ci
npm run catalog   # regenerate src/data/apps.generated.json
npm run dev
```

```bash
npm run build     # tsc + vite build
npm run lint
```

`npm run catalog` uses `GITHUB_TOKEN` when available. Without it, GitHub's unauthenticated rate limit applies.

## Project layout

| Path | Purpose |
| --- | --- |
| `scripts/generate-catalog.mjs` | Auto-discovery + catalog generator |
| `src/data/apps.generated.json` | Generated snapshot committed as a fallback |
| `src/data/app-overrides.json` | Manual branding overrides |
| `src/pages/home.tsx` | App list |
| `src/pages/app-download.tsx` | Download page |
| `.github/workflows/deploy-pages.yml` | Catalog sync + Pages deploy |
| `.github/workflows/build-app.yml` | Reusable app build/release workflow |
| `templates/app-release.yml` | Caller workflow for app repos |
| `scripts/onboard-app.mjs` | Adds topic + caller workflow to a repo |

See [`docs/app-publishing.md`](docs/app-publishing.md) for the full publishing guide.
