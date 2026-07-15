import { useCallback, useEffect, useState } from "react"
import { ArrowLeft, Download, ExternalLink, Loader2 } from "lucide-react"
import { Link, useParams } from "react-router-dom"

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
import { getApp } from "@/data/apps"
import { formatBytes, formatDateId } from "@/lib/utils"
import { fetchLatestApk } from "@/lib/github-release"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready"
      tag: string
      date: string
      file: string
      size: string
      url: string
    }

export function AppDownloadPage() {
  const { slug = "" } = useParams()
  const app = getApp(slug)
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const load = useCallback(async () => {
    if (!app) return
    setState({ status: "loading" })
    try {
      const { release, apk } = await fetchLatestApk(app.releaseRepo)
      setState({
        status: "ready",
        tag: release.tag_name || release.name || "—",
        date: formatDateId(release.published_at || release.created_at),
        file: apk.name,
        size: formatBytes(apk.size),
        url: apk.browser_download_url,
      })
      document.title = `${app.name} — ${release.tag_name || "Download APK"}`
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Terjadi kesalahan tidak dikenal.",
      })
    }
  }, [app])

  useEffect(() => {
    if (app) {
      document.title = `${app.name} — Download APK`
      void load()
    }
  }, [app, load])

  if (!app) {
    return (
      <SiteShell>
        <Card>
          <CardHeader>
            <CardTitle>App tidak ditemukan</CardTitle>
            <CardDescription>
              Path <code>/{slug}</code> tidak terdaftar.
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

  return (
    <SiteShell>
      <Button variant="ghost" size="sm" className="-ml-2 self-start" asChild>
        <Link to="/">
          <ArrowLeft />
          Semua apps
        </Link>
      </Button>

      <header className="mt-4 flex items-center gap-3">
        <img
          src={app.logo}
          alt=""
          width={52}
          height={52}
          className="h-13 w-13 size-[52px] rounded-xl border border-border object-cover shadow-sm"
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight">{app.name}</h1>
          <p className="text-sm text-muted-foreground">
            Build &amp; release channel
          </p>
        </div>
      </header>

      <Card className="mt-6">
        <CardHeader>
          <Badge variant="violet" className="mb-2 w-fit gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-violet-400" />
            Latest release
          </Badge>
          <CardTitle className="text-2xl tracking-tight">Download APK</CardTitle>
          <CardDescription>
            Ambil build Android terbaru dari GitHub Actions / Releases.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {state.status === "loading" ? (
            <div className="space-y-3" role="status" aria-live="polite">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full rounded-full" />
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Memuat release terbaru…
              </div>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div role="alert" className="space-y-3 text-center">
              <p className="font-semibold text-destructive">Gagal memuat release</p>
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <Button variant="outline" onClick={() => void load()}>
                Coba lagi
              </Button>
            </div>
          ) : null}

          {state.status === "ready" ? (
            <>
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <MetaRow label="Versi" value={state.tag} />
                <Separator className="my-2" />
                <MetaRow label="Dipublish" value={state.date} />
                <Separator className="my-2" />
                <MetaRow label="File" value={state.file} />
                <Separator className="my-2" />
                <MetaRow label="Ukuran" value={state.size} />
              </div>

              <div className="space-y-2">
                <Button size="lg" className="w-full" asChild>
                  <a href={state.url} download={state.file}>
                    <Download />
                    Download APK
                  </a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={`https://github.com/${app.releaseRepo}/releases`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Lihat semua rilis
                    <ExternalLink />
                  </a>
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Build repo:{" "}
                <a
                  className="text-violet-300 underline-offset-2 hover:underline"
                  href={`https://github.com/${app.releaseRepo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {app.releaseRepo}
                </a>
              </p>
            </>
          ) : null}
        </CardContent>
      </Card>

      <footer className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        Auto-updated dari GitHub Releases ·{" "}
        <a
          className="underline underline-offset-2"
          href={`https://github.com/${app.releaseRepo}/actions`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Actions
        </a>
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
