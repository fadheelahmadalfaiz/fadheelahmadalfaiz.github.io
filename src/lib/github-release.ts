import type { AppAsset, AppRelease } from "@/data/apps"

type GitHubAsset = {
  name?: string
  size?: number
  browser_download_url?: string
}

type GitHubRelease = {
  tag_name?: string
  name?: string
  html_url?: string
  published_at?: string
  created_at?: string
  assets?: GitHubAsset[]
}

function assetKind(name: string): AppAsset["kind"] {
  const lower = name.toLowerCase()
  if (lower.endsWith(".apk")) return "apk"
  if (lower.endsWith(".aab")) return "aab"
  return "other"
}

export async function fetchLatestRelease(repo: string): Promise<AppRelease | null> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  })

  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}). Coba lagi nanti.`)
  }

  const release = (await res.json()) as GitHubRelease
  const assets = (release.assets || [])
    .map((asset) => ({
      name: asset.name || "download",
      size: Number(asset.size) || 0,
      url: asset.browser_download_url || "",
      kind: assetKind(asset.name || ""),
    }))
    .filter((asset) => asset.url)

  if (!assets.some((asset) => asset.kind === "apk" || asset.kind === "aab")) {
    throw new Error("Release terbaru tidak berisi APK atau AAB.")
  }

  return {
    tag: release.tag_name || release.name || "—",
    name: release.name || "",
    publishedAt: release.published_at || release.created_at || null,
    url: release.html_url || `https://github.com/${repo}/releases`,
    assets,
  }
}
