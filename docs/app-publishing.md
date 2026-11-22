# App publishing guide

This site is a thin catalog over GitHub Releases. The source of truth for every download is a public repo's latest release asset.

## 1. Auto-listing rules

`scripts/generate-catalog.mjs` lists a public repo when at least one is true:

- its latest release contains an `.apk` or `.aab` asset,
- it has the `faiz-app` topic,
- it has a `.github/faiz-app.json` file.

Forks, archived repos, disabled repos, private repos, and the hub repo itself are ignored.

Slug is derived from the repo name (`chroniq-app` → `chroniq`, `substracker-app` → `substracker`). Override it in metadata or in `src/data/app-overrides.json`.

## 2. Publish a release manually

```bash
gh release create v1.0.0 ./app-release.apk --title "v1.0.0" --notes "Catatan rilis"
```

The next hub sync picks it up. The download page always uses the **latest** release (`/releases/latest`).

## 3. Build automatically with the reusable workflow

Add `.github/workflows/release.yml` to the app repo:

```yaml
name: Release app

on:
  push:
    branches: [main]
    paths-ignore:
      - "**/*.md"
      - "docs/**"
      - ".github/**"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  release:
    uses: fadheelahmadalfaiz/fadheelahmadalfaiz.github.io/.github/workflows/build-app.yml@main
    permissions:
      contents: write
    with:
      platform: auto
      build_type: release
    secrets: inherit
```

Or run:

```bash
node scripts/onboard-app.mjs owner/repo
```

The helper adds the `faiz-app` topic and writes the caller workflow through the GitHub API. It does not commit to the hub repo.

### Reusable workflow inputs

| Input | Default | Description |
| --- | --- | --- |
| `project_path` | `.` | Project directory inside the repo |
| `platform` | `auto` | `auto`, `flutter`, `android`, `react-native`, `expo` |
| `build_type` | `release` | `release` or `debug` |
| `tag_prefix` | `build` | Release tag prefix (`build-<run_number>`) |
| `flutter_version` | `3.38.9` | Flutter SDK version |
| `java_version` | `17` | JDK version |
| `node_version` | `22` | Node version for RN/Expo |
| `publish_release` | `true` | Create a GitHub Release |
| `build_aab` | `true` | Also build an AAB for Flutter |

### Auto-detection order

1. `pubspec.yaml` → Flutter
2. `package.json` with `expo` → Expo
3. `package.json` with `react-native` → React Native
4. `gradlew` + `settings.gradle(.kts)` → Android
5. `android/gradlew` → Android

Set `platform` explicitly for monorepos or unusual layouts.

### Build behavior

- Flutter: `flutter build apk --release` + `flutter build appbundle --release`.
- Android/RN/Expo: `assembleRelease`; unsigned output is signed with `apksigner` when keystore secrets exist.
- No keystore on Android/RN/Expo: falls back to `assembleDebug` so the APK is still installable.
- The APK (and Flutter AAB) is uploaded as a workflow artifact and attached to a GitHub Release.
- React Native's default template signs release builds with the debug key. Configure Gradle signing in the app repo for a production key.

## 4. Metadata file

`.github/faiz-app.json`:

```json
{
  "slug": "chroniq",
  "name": "Chroniq",
  "description": "Alarm presisi per tanggal.",
  "logo": "docs/assets/chroniq-logo.png",
  "homepage": "https://example.com",
  "stack": "Android",
  "platforms": ["android"],
  "hidden": false
}
```

- `logo`: absolute URL, hub-relative path (`/logo.png`), or repo-relative path.
- `hidden`: `true` removes the repo from the catalog.
- `platforms`: free-form labels; `android` is the common value.
- Without metadata, the script uses the repo description, language, release assets, and a few common icon paths.

## 5. Instant refresh

By default the hub refreshes every 2 hours. For an immediate refresh after a release, add a `HUB_DISPATCH_TOKEN` secret to the app repo:

1. Create a fine-grained PAT or classic PAT with `repo` scope.
2. Save it as `HUB_DISPATCH_TOKEN` in the app repo.
3. The reusable workflow sends:

```text
POST https://api.github.com/repos/fadheelahmadalfaiz/fadheelahmadalfaiz.github.io/dispatches
{"event_type":"app-release"}
```

If the secret is absent, the schedule catches up.

## 6. Signing secrets

Add in the app repo (Settings → Secrets and variables → Actions):

```text
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

Generate the base64 value:

```bash
base64 -w0 upload-keystore.jks
```

PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("upload-keystore.jks"))
```

For Flutter, the workflow also writes `android/key.properties` when the secrets exist. The project must read that file in its Gradle signing config (the standard Flutter template supports it when configured).

## 7. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| App not listed | Repo is private/fork/archived, or latest release has no APK/AAB. Add `faiz-app` topic or metadata to list it early. |
| App listed but "Belum ada build" | No release yet. Run the release workflow. |
| Build detects wrong platform | Set `platform` explicitly in the caller workflow. For bare React Native with custom native code, use `react-native` even if the `expo` package is present. |
| Android build produces debug APK | No keystore secrets. Add them or set `build_type: debug` intentionally. |
| Hub does not refresh immediately | `HUB_DISPATCH_TOKEN` missing/invalid. Wait for the 2-hour schedule or run the hub workflow manually. |
| Catalog generation fails in CI | The workflow keeps the committed `src/data/apps.generated.json` snapshot when discovery fails. Check the Actions log. |
| Scheduled sync stops | GitHub disables scheduled workflows after 60 days without repo activity. Push any commit or run the workflow manually to re-enable. |

## 8. Security notes

- Only public repos are discovered.
- The reusable workflow builds app code with a read-only `GITHUB_TOKEN`; only the release job gets `contents: write`.
- Do not pass hub secrets into app build jobs.
- A public repo's code runs on the runner. Treat write access to app repos as trust.
- APKs are served from GitHub Releases, not from the Pages artifact.
