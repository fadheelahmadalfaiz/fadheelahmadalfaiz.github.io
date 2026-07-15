export type AppItem = {
  slug: string
  name: string
  description: string
  logo: string
  releaseRepo: string
  badge?: string
}

export const apps: AppItem[] = [
  {
    slug: "faizherbals",
    name: "Faiz Herbals",
    description: "Download APK terbaru (Android)",
    logo: "/logo-faizherbals.jpg",
    releaseRepo: "fadheelahmadalfaiz/faizherbals-build",
    badge: "Latest build",
  },
]

export function getApp(slug: string): AppItem | undefined {
  return apps.find((a) => a.slug === slug)
}
