#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUTPUT = path.join(ROOT, "src", "data", "apps.generated.json")
const OVERRIDES_FILE = path.join(ROOT, "src", "data", "app-overrides.json")

const OWNER = process.env.CATALOG_OWNER || "fadheelahmadalfaiz"
const TOPIC = process.env.CATALOG_TOPIC || "faiz-app"
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ""
const API = "https://api.github.com"
const USER_AGENT = "faiz-app-catalog"

const REPO_SUFFIXES = [
  "-app",
  "_app",
  "-android",
  "_android",
  "-mobile",
  "_mobile",
  "-build",
  "_build",
  "-release",
  "_release",
  "-apk",
  "_apk",
  "-flutter",
  "_flutter",
  "-ios",
  "_ios",
]

const LOGO_CANDIDATES = [
  "assets/icon/app_icon.png",
  "assets/icon.png",
  "assets/logo.png",
  "docs/assets/logo.png",
  "logo.png",
  "logo.jpg",
  "icon.png",
  "public/logo.png",
  "public/icon.png",
  "app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
  "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png",
  "web/icons/Icon-512.png",
  "web/favicon.png",
]

function rawUrl(repo, branch, file) {
  return `https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/${file
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`
}

function apiHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": USER_AGENT,
    ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
  }
}

async function api(pathname, { allow404 = false } = {}) {
  const res = await fetch(`${API}${pathname}`, { headers: apiHeaders() })
  if (res.status === 404 && allow404) return null
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    const error = new Error(
      `GitHub API ${pathname} -> ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 200)}` : ""}`
    )
    error.status = res.status
    throw error
  }
  return res.json()
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function urlExists(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
    })
    return res.ok
  } catch {
    return false
  }
}

async function listRepos() {
  const repos = []
  for (let page = 1; page <= 20; page += 1) {
    const batch = await api(
      `/users/${encodeURIComponent(OWNER)}/repos?per_page=100&page=${page}&type=owner&sort=updated`
    )
    repos.push(...batch)
    if (batch.length < 100) break
  }
  return repos
}

async function getMetadata(repo) {
  for (const file of [".github/faiz-app.json", "faiz-app.json"]) {
    const data = await fetchJson(rawUrl(repo.full_name, repo.default_branch, file))
    if (data && typeof data === "object" && !Array.isArray(data)) return data
  }
  return null
}

async function detectLogo(repo) {
  for (const file of LOGO_CANDIDATES) {
    const url = rawUrl(repo.full_name, repo.default_branch, file)
    if (await urlExists(url)) return url
  }
  return null
}

async function detectStack(repo, meta) {
  if (typeof meta.stack === "string" && meta.stack.trim()) return meta.stack.trim()
  if (repo.language === "Dart") return "Flutter"
  if (repo.language === "Kotlin" || repo.language === "Java") return "Android"
  if (repo.language === "TypeScript" || repo.language === "JavaScript") {
    const pkg = await fetchJson(rawUrl(repo.full_name, repo.default_branch, "package.json"))
    if (pkg) {
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
      if (deps.expo) return "Expo"
      if (deps["react-native"]) return "React Native"
    }
  }
  return null
}

function kindFromName(name) {
  const lower = name.toLowerCase()
  if (lower.endsWith(".apk")) return "apk"
  if (lower.endsWith(".aab")) return "aab"
  return "other"
}

function mapRelease(raw, fullName) {
  const assets = (raw.assets || [])
    .map((asset) => ({
      name: asset.name || "download",
      size: Number(asset.size) || 0,
      url: asset.browser_download_url,
      kind: kindFromName(asset.name || ""),
    }))
    .filter((asset) => asset.url)

  return {
    tag: raw.tag_name || raw.name || "—",
    name: raw.name || "",
    publishedAt: raw.published_at || raw.created_at || null,
    url: raw.html_url || `https://github.com/${fullName}/releases`,
    assets,
  }
}

function pickPrimary(assets) {
  const apks = assets.filter((asset) => asset.kind === "apk")
  if (!apks.length) return assets.find((asset) => asset.kind === "aab") || null

  const universal = apks.find((asset) => /universal/i.test(asset.name))
  if (universal) return universal

  const plain = apks.find(
    (asset) => !/(arm64|armeabi|x86|x86_64|split|abi)/i.test(asset.name)
  )
  return plain || apks[0]
}

function stripRepoName(name) {
  let value = name
  let changed = true
  while (changed) {
    changed = false
    for (const suffix of REPO_SUFFIXES) {
      if (value.toLowerCase().endsWith(suffix) && value.length > suffix.length) {
        value = value.slice(0, -suffix.length)
        changed = true
      }
    }
  }
  return value
}

function slugify(value) {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "app"
  )
}

function titleize(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

function resolveLogo(value, repo) {
  if (typeof value !== "string" || !value.trim()) return null
  const logo = value.trim()
  if (/^https?:\/\//i.test(logo)) return logo
  if (logo.startsWith("/")) return logo
  return rawUrl(repo.full_name, repo.default_branch, logo.replace(/^\.?\//, ""))
}

function safeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

function detectPlatforms(repo, release, meta) {
  if (Array.isArray(meta.platforms) && meta.platforms.length) {
    return [...new Set(meta.platforms.filter((item) => typeof item === "string"))]
  }

  const platforms = new Set()
  if (release?.assets.some((asset) => asset.kind === "apk" || asset.kind === "aab")) {
    platforms.add("android")
  }
  if (repo.language === "Dart" || repo.language === "Kotlin" || repo.language === "Java") {
    platforms.add("android")
  }
  return [...platforms]
}

async function buildApp(repo, meta, release) {
  const hasMobileAsset = Boolean(
    release?.assets.some((asset) => asset.kind === "apk" || asset.kind === "aab")
  )
  const topics = Array.isArray(repo.topics) ? repo.topics : []
  const hasTopic = topics.includes(TOPIC)
  const hasMeta = Object.keys(meta).length > 0

  if (!hasMobileAsset && !hasTopic && !hasMeta) return null

  const baseName = stripRepoName(repo.name)
  const metaSlug = typeof meta.slug === "string" ? meta.slug.trim() : ""
  const metaName = typeof meta.name === "string" ? meta.name.trim() : ""
  const metaDescription =
    typeof meta.description === "string" ? meta.description.trim() : ""
  const slug = slugify(metaSlug || baseName)
  const name = metaName || titleize(baseName)
  const stack = await detectStack(repo, meta)
  const description =
    metaDescription ||
    String(repo.description || "").trim() ||
    `Aplikasi ${stack || "Android"} dari repo ${repo.name}.`
  const logo = resolveLogo(meta.logo, repo) || (await detectLogo(repo))
  const catalogRelease = hasMobileAsset ? release : null

  return {
    slug,
    name,
    description,
    logo,
    repo: repo.full_name,
    homepage: safeHttpUrl(meta.homepage) || safeHttpUrl(repo.homepage),
    stack,
    platforms: detectPlatforms(repo, catalogRelease, meta),
    release: catalogRelease,
    primaryAsset: catalogRelease ? pickPrimary(catalogRelease.assets) : null,
    updatedAt: catalogRelease?.publishedAt || repo.pushed_at || null,
  }
}

function uniqueSlug(apps, app) {
  let slug = app.slug
  let counter = 2
  while (apps.some((item) => item.slug === slug && item.repo !== app.repo)) {
    slug = `${app.slug}-${counter}`
    counter += 1
  }
  return { ...app, slug }
}

function sortApps(apps) {
  return apps.sort((a, b) => {
    const aReleased = a.release ? 1 : 0
    const bReleased = b.release ? 1 : 0
    if (aReleased !== bReleased) return bReleased - aReleased
    const aDate = a.release?.publishedAt || a.updatedAt || ""
    const bDate = b.release?.publishedAt || b.updatedAt || ""
    return bDate.localeCompare(aDate)
  })
}

async function loadOverrides() {
  try {
    return JSON.parse(await readFile(OVERRIDES_FILE, "utf8"))
  } catch {
    return {}
  }
}

async function main() {
  console.log(`Discovering public apps for ${OWNER}...`)
  const [repos, overrides] = await Promise.all([listRepos(), loadOverrides()])
  const candidates = repos.filter(
    (repo) =>
      !repo.private &&
      !repo.fork &&
      !repo.archived &&
      !repo.disabled &&
      repo.name !== `${OWNER}.github.io`
  )

  console.log(`Found ${candidates.length} public repos.`)

  const apps = []
  let failures = 0

  for (const repo of candidates) {
    try {
      const [releaseRaw, meta] = await Promise.all([
        api(`/repos/${repo.full_name}/releases/latest`, { allow404: true }),
        getMetadata(repo),
      ])
      const release = releaseRaw ? mapRelease(releaseRaw, repo.full_name) : null
      const override = overrides[repo.full_name] || {}
      const mergedMeta = { ...(meta || {}), ...override }

      if (mergedMeta.hidden === true) {
        console.log(`- ${repo.full_name}: hidden by override`)
        continue
      }

      const app = await buildApp(repo, mergedMeta, release)
      if (!app) continue

      apps.push(uniqueSlug(apps, app))
      const asset = app.primaryAsset
      const detail = asset
        ? `${asset.kind.toUpperCase()} ${(asset.size / 1024 / 1024).toFixed(1)} MB`
        : "no release yet"
      console.log(`+ ${repo.full_name} -> /apps/${app.slug}/ (${detail})`)
    } catch (error) {
      failures += 1
      console.warn(`! ${repo.full_name}: ${error.message}`)
    }
  }

  if (!apps.length && failures > 0) {
    console.warn("No apps discovered and some requests failed; keeping the existing catalog.")
    return
  }

  const catalog = {
    generatedAt: new Date().toISOString(),
    owner: OWNER,
    topic: TOPIC,
    apps: sortApps(apps),
  }

  await writeFile(OUTPUT, `${JSON.stringify(catalog, null, 2)}\n`, "utf8")
  console.log(`Wrote ${catalog.apps.length} apps to ${path.relative(ROOT, OUTPUT)}`)
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error)
  try {
    await readFile(OUTPUT)
    console.warn("Keeping the existing catalog because discovery failed.")
  } catch {
    process.exitCode = 1
  }
})
