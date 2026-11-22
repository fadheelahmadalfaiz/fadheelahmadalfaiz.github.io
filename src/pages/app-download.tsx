import { useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Clock,
  Download,
  ExternalLink,
  FileArchive,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { AppLogo } from "@/components/app-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteShell } from "@/components/site-shell"
import {
  catalogGeneratedAt,
  getApp,
  type AppAsset,
  type AppRelease,
} from "@/data/apps"
import { fetchLatestRelease } from "@/lib/github-release"
import { formatBytes, formatDateId } from "@/lib/utils"

function pickPrimary(assets: AppAsset[]) {
  const apks = assets.filter((asset) => asset.kind === "apk")
  if (!apks.length) return assets.find((asset) => asset.kind === "aab") ?? null

  const universal = apks.find((asset) => /universal/i.test(asset.name))
  if (universal) return universal

  const plain = apks.find(
    (asset) => !/(arm64|armeabi|x86|x86_64|split|abi)/i.test(asset.name)
  )
  return plain ?? apks[0]
}

function downloadLabel(asset: AppAsset | null) {
  if (asset?.kind === "aab") return "Download AAB"
  if (asset?.kind === "apk") return "Download APK"
  return "Download"
}

export function AppDownloadPage() {
  const { slug = "" } = useParams()
  const app = getApp(slug)
  const initialRelease = app?.release ?? null
  const [release, setRelease] = useState<AppRelease | null>(initialRelease)
  const [loading, setLoading] = useState(!initialRelease)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!app) return
    setLoading(true)
    setError(null)
    try {
      const fresh = await fetchLatestRelease(app.repo)
      setRelease(fresh)
    } catch (err) {
      if (!initialRelease) {
        setError(err instanceof Error ? err.message : "Gagal memuat release.")
      }
    } finally {
      setLoading(false)
    }
  }, [app, initialRelease])

  useEffect(() => {
    if (!app) return
    void load()
  }, [app, load])

  useEffect(() => {
    if (!app) {
      document.title = "App tidak ditemukan"
      return
    }
    document.title = release
      ? `${app.name} — ${release.tag}`
      : `${app.name} — Download`
  }, [app, release])

  if (!app) {
    return (
      <SiteShell>
        <Card>
          <CardHeader>
            <CardTitle>App tidak ditemukan</CardTitle>
            <CardDescription>
              Path <code>/apps/{slug}/</code> tidak terdaftar di katalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/">Kembali ke hub</Link>
            </Button>
          </CardContent>
        </Card>
      </SiteShell>
    )
  }

  const primary = release ? pickPrimary(release.assets) : null
  const otherAssets = release
    ? release.assets.filter((asset) => asset.url !== primary?.url)
    : []
  const platformLabels = app.platforms.map((platform) =>
    platform.toLowerCase() === "android" ? "Android" : platform
  )
  const subtitle =
    [...new Set([app.stack, ...platformLabels].filter(Boolean))].join(" · ") ||
    "Android app"

  return (
    <SiteShell>
      <Button variant="ghost" size="sm" className="-ml-2 min-h-11 self-start" asChild>
        <Link to="/">
          <ArrowLeft />
          Semua apps
        </Link>
      </Button>

      <header className="mt-4 flex items-center gap-3">
        <AppLogo
          name={app.name}
          logo={app.logo}
          className="h-[52px] w-[52px] shrink-0"
        />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">{app.name}</h1>
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </header>

      {app.description ? (
        <p className="mt-3 text-pretty text-sm text-muted-foreground">
          {app.description}
        </p>
      ) : null}

      {release ? (
        <Card className="mt-6">
          <CardHeader>
            <Badge variant="violet" className="mb-2 w-fit gap-1.5">
              {loading ? (
                <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <span className="size-1.5 animate-pulse rounded-full bg-violet-400 motion-reduce:animate-none" />
              )}
              Latest release
            </Badge>
            <CardTitle className="text-2xl tracking-tight">
              {primary ? downloadLabel(primary) : "Release"}
            </CardTitle>
            <CardDescription>
              Build Android terbaru dari GitHub Releases.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <dl className="rounded-lg border border-border bg-background/50 p-3">
              <MetaRow label="Versi" value={release.tag} />
              <Separator className="my-2" />
              <MetaRow label="Dipublish" value={formatDateId(release.publishedAt)} />
              <Separator className="my-2" />
              <MetaRow label="File" value={primary?.name ?? "—"} />
              <Separator className="my-2" />
              <MetaRow label="Ukuran" value={formatBytes(primary?.size ?? 0)} />
            </dl>

            {primary ? (
              <Button size="lg" className="w-full" asChild>
                <a href={primary.url} download={primary.name}>
                  <Download />
                  {downloadLabel(primary)}
                </a>
              </Button>
            ) : (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
                Release ini tidak punya file APK/AAB.
              </p>
            )}

            {otherAssets.length ? (
              <div className="space-y-2">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  File lain
                </p>
                {otherAssets.map((asset) => (
                  <a
                    key={asset.url}
                    href={asset.url}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <FileArchive
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="truncate">{asset.name}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatBytes(asset.size)}
                    </span>
                  </a>
                ))}
              </div>
            ) : null}

            <div className="grid gap-2">
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={`https://github.com/${app.repo}/releases`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lihat semua rilis
                  <ExternalLink />
                </a>
              </Button>
              {app.homepage ? (
                <Button variant="ghost" className="w-full" asChild>
                  <a href={app.homepage} target="_blank" rel="noopener noreferrer">
                    Website
                    <ExternalLink />
                  </a>
                </Button>
              ) : null}
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11"
                onClick={() => void load()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <RefreshCw aria-hidden="true" />
                )}
                Cek update
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!release && loading ? (
        <Card className="mt-6" aria-busy="true">
          <CardHeader>
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="mt-2 h-8 w-44" />
          </CardHeader>
          <CardContent className="space-y-3" role="status" aria-live="polite">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-12 w-full rounded-full" />
            <div className="flex items-center justify-center gap-2 py-1 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Memuat release terbaru…
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!release && !loading && error ? (
        <Card className="mt-6">
          <CardContent className="pt-6" role="alert">
            <div className="space-y-3 text-center">
              <p className="font-semibold text-destructive">Gagal memuat release</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => void load()}>
                Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!release && !loading && !error ? (
        <Card className="mt-6">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <Clock className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl">Belum ada build</CardTitle>
            <CardDescription>
              Repo <span className="font-mono text-xs">{app.repo}</span> sudah
              terdaftar, tapi belum punya release APK/AAB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" asChild>
              <a
                href={`https://github.com/${app.repo}/actions`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka Actions
                <ExternalLink />
              </a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a
                href={`https://github.com/${app.repo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka repo
                <ExternalLink />
              </a>
            </Button>
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11"
                onClick={() => void load()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <RefreshCw aria-hidden="true" />
                )}
                Cek update
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <footer className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        Auto-updated dari GitHub Releases ·{" "}
        <a
          className="underline underline-offset-2"
          href={`https://github.com/${app.repo}/actions`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Actions
        </a>
        <span className="mx-1.5 text-border">·</span>
        <span>Katalog {formatDateId(catalogGeneratedAt)}</span>
      </footer>
    </SiteShell>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-all text-right font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
