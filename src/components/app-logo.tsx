import { useState } from "react"

import { cn } from "@/lib/utils"

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export function AppLogo({
  name,
  logo,
  className,
}: {
  name: string
  logo: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!logo || failed) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-gradient-to-br from-violet-500/30 to-sky-500/20 text-sm font-bold text-violet-100",
          className
        )}
      >
        {initials(name)}
      </div>
    )
  }

  return (
    <img
      src={logo}
      alt=""
      width={48}
      height={48}
      decoding="async"
      className={cn("rounded-xl border border-border object-cover", className)}
      onError={() => setFailed(true)}
    />
  )
}
