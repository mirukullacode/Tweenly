// Builds public/r/*.json with URLs pointing at the deployed site.
// registry.json keeps http://localhost:3000 for local dev; set NEXT_PUBLIC_SITE_URL in production.
import { execSync } from "node:child_process"
import { readFileSync, rmSync, writeFileSync } from "node:fs"

const url = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
const tmp = ".registry.build.json"

writeFileSync(tmp, readFileSync("registry.json", "utf8").replaceAll("http://localhost:3000", url))
try {
  execSync(`npx shadcn build ${tmp}`, { stdio: "inherit" })
} finally {
  rmSync(tmp, { force: true })
}
console.log(`Registry built for ${url}`)
