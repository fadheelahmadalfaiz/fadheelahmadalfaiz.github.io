export type ReleaseAsset = {
  name: string
  size: number
  browser_download_url: string
}

export type LatestRelease = {
  tag_name: string
  name?: string
  published_at?: string
  created_at?: string
  assets: ReleaseAsset[]
}

export async function fetchLatestApk(repo: string): Promise<{
  release: LatestRelease
  apk: ReleaseAsset
}> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  })

  if (res.status === 404) {
    throw new Error("Belum ada release. Jalankan workflow build dulu.")
  }
  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}). Coba lagi nanti.`)
  }

  const release = (await res.json()) as LatestRelease
  const apk = (release.assets || []).find((a) => /\.apk$/i.test(a.name || ""))

  if (!apk?.browser_download_url) {
    throw new Error("Release terbaru tidak berisi file APK.")
  }

  return { release, apk }
}
