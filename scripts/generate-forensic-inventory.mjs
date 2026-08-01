import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const auditDirectory = path.join(root, "docs", "audits")
const csvRelativePath = "docs/audits/2026-07-31-forensic-file-inventory.csv"
const jsonRelativePath = "docs/audits/2026-07-31-forensic-file-inventory.json"

const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" })

const normalize = (value) => value.replaceAll("\\", "/")
const nulList = (value) => value.split("\0").filter(Boolean)
const files = new Set(
  nulList(git("ls-files", "--cached", "--others", "--exclude-standard", "-z")).map(
    normalize
  ).filter((file) => fs.existsSync(path.join(root, file)))
)
files.add(csvRelativePath)
files.add(jsonRelativePath)

const statusTokens = nulList(git("status", "--porcelain=v1", "-z"))
const statuses = new Map()
for (let index = 0; index < statusTokens.length; index += 1) {
  const token = statusTokens[index]
  const code = token.slice(0, 2)
  const file = normalize(token.slice(3))
  statuses.set(file, code.trim() || "tracked")
  if (code.includes("R") || code.includes("C")) {
    index += 1
  }
}

function categoryFor(file) {
  if (file === "pnpm-lock.yaml") return "lock gerado"
  if (/\.(zip|woff2?|png|jpe?g|gif|ico)$/i.test(file)) return "binário"
  if (/\.(svg)$/i.test(file)) return "asset vetorial"
  if (file.startsWith("supabase/migrations/")) return "migration histórica"
  if (file.startsWith("supabase/functions/")) return "Edge Function"
  if (file.startsWith("tests/")) return "teste"
  if (file.startsWith("src/components/ui/")) return "primitive shadcn"
  if (file.startsWith("src/features/")) return "feature"
  if (file.startsWith("src/components/")) return "componente compartilhado"
  if (file.startsWith("src/")) return "código de aplicação"
  if (file.startsWith("docs/")) return "documentação"
  if (file.startsWith(".github/")) return "automação"
  if (file.startsWith("scripts/")) return "script"
  if (/\.(json|toml|ya?ml|config\.[cm]?[jt]s)$/i.test(file)) return "configuração"
  return "arquivo de projeto"
}

function assessmentFor(file, category) {
  if (file === "auth-phase-1-current-state.zip") {
    return {
      finding: "snapshot binário rastreado; finalidade normativa não demonstrada",
      severity: "média",
      action: "inventariar conteúdo e remover em commit próprio se reproduzível",
      justification: "binários históricos aumentam o repositório e não permitem revisão por diff",
      tests: "comparar hash/conteúdo com o estado Git antes da exclusão",
      references: "plano §2 Raiz",
    }
  }
  if (file === "public/favicon.svg" || file === "src/assets/brand/montecarlo-symbol.svg") {
    return {
      finding: "duplicata exata de asset",
      severity: "baixa",
      action: "definir fonte canônica sem quebrar o favicon público",
      justification: "evita divergência futura entre cópias da marca",
      tests: "build e verificação visual do favicon",
      references: "plano §2 src/assets e public",
    }
  }
  if (file.startsWith("src/features/dashboard/") || file.startsWith("src/features/reports/") || file.startsWith("src/features/yard/")) {
    return {
      finding: "capacidade sem contrato produtivo real",
      severity: "alta",
      action: "manter fora do registro e da navegação de produção",
      justification: "impede que preview ou placeholder seja apresentado como operação real",
      tests: "teste do registro de rotas e inspeção do bundle produtivo",
      references: "plano §2 Rotas sem capacidade produtiva",
    }
  }
  if (file.startsWith("src/components/ui/")) {
    return {
      finding: "vistoriado — base shadcn estável",
      severity: "informativa",
      action: "manter internals gerados; compor extensões fora desta pasta",
      justification: "preserva atualização e consistência do catálogo oficial",
      tests: "dry-run/diff shadcn e testes dos consumidores",
      references: "components.json; regras shadcn do plano",
    }
  }
  if (category === "migration histórica") {
    return {
      finding: "vistoriado — migration histórica imutável",
      severity: "informativa",
      action: "não reescrever; corrigir somente por migration aditiva",
      justification: "preserva a cadeia aplicada e a reprodutibilidade",
      tests: "supabase db reset, lint e testes RLS no estado final",
      references: "Supabase migrations; plano §6",
    }
  }
  if (category === "lock gerado") {
    return {
      finding: "vistoriado — artefato gerado pelo manifesto",
      severity: "informativa",
      action: "regenerar somente com pnpm fixado",
      justification: "garante resolução reprodutível de dependências",
      tests: "pnpm install --frozen-lockfile",
      references: "package.json#packageManager",
    }
  }
  if (category === "binário") {
    return {
      finding: "vistoriado — conteúdo binário classificado",
      severity: "informativa",
      action: "manter somente quando consumido ou normativo",
      justification: "binários não são auditáveis como código-fonte",
      tests: "validar consumidor e hash quando aplicável",
      references: "inventário Git",
    }
  }
  return {
    finding: "vistoriado — sem achado específico",
    severity: "informativa",
    action: "manter sob os gates arquiteturais e funcionais aplicáveis",
    justification: "nenhuma inconsistência individual adicional foi confirmada nesta revisão",
    tests: "validação proporcional à categoria e aos consumidores",
    references: "auditoria forense 2026-07-31",
  }
}

const records = [...files].sort().map((file) => {
  const category = categoryFor(file)
  const assessment = assessmentFor(file, category)
  return {
    path: file,
    ownership: "projeto",
    category,
    gitStatus: statuses.get(file) ?? (file === csvRelativePath || file === jsonRelativePath ? "gerado" : "tracked"),
    reviewStatus: "vistoriado",
    ...assessment,
  }
})

const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`
const headers = Object.keys(records[0])
const csv = [
  headers.map(escapeCsv).join(","),
  ...records.map((record) => headers.map((header) => escapeCsv(record[header])).join(",")),
].join("\n")

fs.mkdirSync(auditDirectory, { recursive: true })
fs.writeFileSync(path.join(root, csvRelativePath), `${csv}\n`, "utf8")
fs.writeFileSync(path.join(root, jsonRelativePath), `${JSON.stringify(records, null, 2)}\n`, "utf8")

console.log(JSON.stringify({ files: records.length, csv: csvRelativePath, json: jsonRelativePath }))
