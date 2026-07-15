import type { ReactNode } from "react"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bg-stage" aria-hidden="true" />
      <div className="dot-pattern" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        {children}
      </div>
    </>
  )
}
