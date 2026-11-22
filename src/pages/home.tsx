import { ChevronRight, ExternalLink, Globe } from "lucide-react"
import { Link } from "react-router-dom"

import { AppLogo } from "@/components/app-logo"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SiteShell } from "@/components/site-shell"
import { apps, catalogGeneratedAt, catalogOwner } from "@/data/apps"
import { formatDateId } from "@/lib/utils"

export function HomePage() {
  return (
    <SiteShell>
      <header className="flex flex-col items-center text-center">
        <Avatar className="h-[6.5rem] w-[6.5rem]">
          <AvatarImage
            src="https://avatars.githubusercontent.com/u/147017460?v=4"
            alt="Fadheel Ahmad Alfaiz"
          />
        </Avatar>
        <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
          Fadheel Ahmad Alfaiz
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Builder · apps, tools &amp; side projects
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={`https://github.com/${catalogOwner}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="https://izz.my.id" target="_blank" rel="noopener noreferrer">
              <Globe />
              izz.my.id
            </a>
          </Button>
        </div>
      </header>

      <section className="mt-8 flex-1">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Apps
          </h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {apps.length}
          </span>
          <Separator className="flex-1" />
        </div>

        {apps.length ? (
          <div className="grid gap-3">
            {apps.map((app) => (
              <Link
                key={app.slug}
                to={`/apps/${app.slug}/`}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="transition-colors hover:bg-accent/40">
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
                    <AppLogo
                      name={app.name}
                      logo={app.logo}
                      className="h-12 w-12 shrink-0"
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <CardTitle className="truncate text-base">{app.name}</CardTitle>
                      <CardDescription className="mt-0.5 line-clamp-2">
                        {app.description}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {app.stack ? (
                          <Badge variant="secondary">{app.stack}</Badge>
                        ) : null}
                        {app.release ? (
                          <Badge variant="success" className="gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            {app.release.tag}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Belum ada build</Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transform-none motion-reduce:transition-none" />
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Belum ada app</CardTitle>
              <CardDescription>
                Katalog akan terisi otomatis setelah ada repo publik dengan release
                APK/AAB.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <p className="mt-4 text-center text-[0.7rem] text-muted-foreground">
          Disinkronkan otomatis dari GitHub Releases ·{" "}
          <time dateTime={catalogGeneratedAt}>{formatDateId(catalogGeneratedAt)}</time>
        </p>
      </section>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        Built with{" "}
        <a
          className="underline underline-offset-2"
          href="https://ui.shadcn.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          shadcn/ui
        </a>{" "}
        +{" "}
        <a
          className="underline underline-offset-2"
          href="https://www.radix-ui.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Radix
        </a>
        <span className="mx-1.5 text-border">·</span>
        <a
          className="inline-flex items-center gap-1 underline underline-offset-2"
          href="https://github.com/fadheelahmadalfaiz/fadheelahmadalfaiz.github.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </footer>
    </SiteShell>
  )
}
