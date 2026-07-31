import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const assetsDirectory = path.join(root, "dist", "assets")
const budgets = {
  cssFileBytes: 200 * 1024,
  jsFileBytes: 300 * 1024,
  totalAssetsBytes: 2 * 1024 * 1024,
}

if (!fs.existsSync(assetsDirectory)) {
  throw new Error("dist/assets não existe. Execute pnpm build antes do orçamento.")
}

const files = fs.readdirSync(assetsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => {
    const filePath = path.join(assetsDirectory, entry.name)
    return { name: entry.name, bytes: fs.statSync(filePath).size }
  })

const violations = []
for (const file of files) {
  if (file.name.endsWith(".js") && file.bytes > budgets.jsFileBytes) {
    violations.push(`${file.name}: ${file.bytes} > ${budgets.jsFileBytes} bytes`)
  }
  if (file.name.endsWith(".css") && file.bytes > budgets.cssFileBytes) {
    violations.push(`${file.name}: ${file.bytes} > ${budgets.cssFileBytes} bytes`)
  }
}

const totalAssetsBytes = files.reduce((total, file) => total + file.bytes, 0)
if (totalAssetsBytes > budgets.totalAssetsBytes) {
  violations.push(
    `dist/assets total: ${totalAssetsBytes} > ${budgets.totalAssetsBytes} bytes`
  )
}

if (violations.length > 0) {
  throw new Error(`Bundle budget excedido:\n${violations.join("\n")}`)
}

console.log(JSON.stringify({ budgets, files: files.length, totalAssetsBytes }, null, 2))
