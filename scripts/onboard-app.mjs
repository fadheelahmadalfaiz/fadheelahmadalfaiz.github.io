#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const WORKFLOW_PATH = ".github/workflows/release.yml"
const TEMPLATE = path.join(ROOT, "templates", "app-release.yml")

const args = process.argv.slice(2)
const repoArg = args.find((arg) => !arg.startsWith("--"))
const installWorkflow = !args.includes("--no-workflow")
const addTopic = !args.includes("--no-topic")
const dryRun = args.includes("--dry-run")

if (!repoArg || !/^[^/]+\/[^/]+$/.test(repoArg)) {
  console.error(
    "Usage: node scripts/onboard-app.mjs <owner/repo> [--no-workflow] [--no-topic] [--dry-run]"
  )
  process.exit(1)
}

function ghToken() {
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim()
  } catch {
    return ""
  }
}

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ghToken()
if (!token) {
  console.error("Butuh GITHUB_TOKEN/GH_TOKEN atau `gh auth login`.")
  process.exit(1)
}

async function api(method, pathname, body, { allow404 = false } = {}) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "faiz-app-onboarding",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 404 && allow404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`${method} ${pathname} -> ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 300)}` : ""}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function main() {
  const repo = await api("GET", `/repos/${repoArg}`)
  if (repo.private) {
    console.error(`${repo.full_name} private. Katalog hanya membaca repo publik.`)
    process.exit(1)
  }
  if (repo.fork) {
    console.warn(`Peringatan: ${repo.full_name} adalah fork.`)
  }

  if (dryRun) {
    console.log(`Dry run untuk ${repo.full_name} (branch ${repo.default_branch}):`)
    if (addTopic) console.log("- tambah topic faiz-app")
    if (installWorkflow) console.log(`- tulis ${WORKFLOW_PATH} dari template`)
    return
  }

  if (addTopic) {
    const current = await api("GET", `/repos/${repoArg}/topics`)
    const names = [...new Set([...(current.names || []), "faiz-app"])]
    await api("PUT", `/repos/${repoArg}/topics`, { names })
    console.log(`+ topic faiz-app ditambahkan ke ${repo.full_name}`)
  }

  if (installWorkflow) {
    const template = await readFile(TEMPLATE, "utf8")
    const existing = await api(
      "GET",
      `/repos/${repoArg}/contents/${WORKFLOW_PATH}?ref=${encodeURIComponent(repo.default_branch)}`,
      undefined,
      { allow404: true }
    )
    await api("PUT", `/repos/${repoArg}/contents/${WORKFLOW_PATH}`, {
      message: "ci: add automatic app release workflow",
      content: Buffer.from(template, "utf8").toString("base64"),
      branch: repo.default_branch,
      ...(existing?.sha ? { sha: existing.sha } : {}),
    })
    console.log(`+ workflow release ditulis ke ${repo.full_name}`)
  }

  console.log("")
  console.log("Selesai. Langkah berikutnya:")
  console.log("1. Tambahkan signing secrets di repo (opsional, agar APK release):")
  console.log("   ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD")
  console.log("2. Opsional: tambahkan HUB_DISPATCH_TOKEN (PAT repo scope) agar hub langsung refresh.")
  console.log("3. Push ke main atau jalankan workflow `Release app`.")
  console.log(`4. Cek https://fadheelahmadalfaiz.github.io/apps/<slug>/ setelah build selesai.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
