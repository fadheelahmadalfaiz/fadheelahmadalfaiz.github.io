import catalog from "./apps.generated.json"

export type AssetKind = "apk" | "aab" | "other"

export type AppAsset = {
  name: string
  size: number
  url: string
  kind: AssetKind
}

export type AppRelease = {
  tag: string
  name: string
  publishedAt: string | null
  url: string
  assets: AppAsset[]
}

export type AppItem = {
  slug: string
  name: string
  description: string
  logo: string | null
  repo: string
  homepage: string | null
  stack: string | null
  platforms: string[]
  release: AppRelease | null
  primaryAsset: AppAsset | null
  updatedAt: string | null
}

type Catalog = {
  generatedAt: string
  owner: string
  topic: string
  apps: AppItem[]
}

const data = catalog as unknown as Catalog

export const catalogGeneratedAt = data.generatedAt
export const catalogOwner = data.owner || "fadheelahmadalfaiz"
export const apps = data.apps

export function getApp(slug: string): AppItem | undefined {
  return apps.find((app) => app.slug === slug)
}
