import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const errors = []

const ignoredDirectories = new Set([
  ".git",
  "coverage",
  "dist",
  "node_modules",
])

const normalizePath = (filePath) => filePath.replaceAll(path.sep, "/")
const absolutePath = (filePath) => path.join(root, filePath)
const exists = (filePath) => fs.existsSync(absolutePath(filePath))
const read = (filePath) => fs.readFileSync(absolutePath(filePath), "utf8")
const parseJson = (filePath) => JSON.parse(read(filePath))

function walk(directory = ".") {
  const absolute = absolutePath(directory)

  if (!fs.existsSync(absolute)) {
    return []
  }

  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      return []
    }

    const relative = normalizePath(path.join(directory, entry.name)).replace(/^\.\//, "")

    return entry.isDirectory() ? walk(relative) : relative
  })
}

function requireFile(filePath) {
  if (!exists(filePath)) {
    errors.push(`Missing file: ${filePath}`)
  }
}

function requireContent(filePath, needle, label) {
  if (!read(filePath).includes(needle)) {
    errors.push(`Missing ${label} in ${filePath}`)
  }
}

function resolveCandidate(base) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.json`,
    `${base}.css`,
    path.posix.join(base, "index.ts"),
    path.posix.join(base, "index.tsx"),
  ]

  return candidates.some((candidate) => exists(candidate))
}

function resolveImport(fromFile, specifier) {
  if (specifier.startsWith("@/")) {
    return resolveCandidate(`src/${specifier.slice(2)}`)
  }

  if (!specifier.startsWith(".")) {
    return true
  }

  return resolveCandidate(
    normalizePath(path.join(path.posix.dirname(fromFile), specifier))
  )
}

const files = walk().sort()
const srcCodeFiles = files.filter((file) => file.startsWith("src/") && /\.(ts|tsx)$/.test(file))
const projectCodeFiles = files.filter(
  (file) =>
    file === "vite.config.ts" ||
    file === "eslint.config.js" ||
    ((file.startsWith("src/") || file.startsWith("tests/")) && /\.(ts|tsx|js)$/.test(file))
)
const migrationFiles = files.filter((file) => file.startsWith("supabase/migrations/"))

for (const requiredFile of [
  "README.md",
  "components.json",
  "package.json",
  "src/App.tsx",
  "src/main.tsx",
  "src/config/env.ts",
  "src/components/data-table/data-table.tsx",
  "src/components/data-table/data-table-toolbar.tsx",
  "src/components/data-table/data-table-scroll-container.tsx",
  "src/components/ui/table.tsx",
  "src/features/auth/components/auth-inactivity-guard.tsx",
  "src/features/auth/components/auth-session-expired-dialog.tsx",
  "src/features/auth/hooks/auth-use-inactivity-logout.ts",
  "src/features/users/routes/users-route.tsx",
  "src/features/users/services/users-service.ts",
  "src/features/users/columns/users-columns.tsx",
  "supabase/functions/admin-user-auth-factors/index.ts",
  "supabase/functions/admin-user-create/index.ts",
  "supabase/functions/admin-user-update/index.ts",
  "supabase/migrations/0001_auth_domain_schema.sql",
  "supabase/migrations/0002_auth_rls_policies.sql",
]) {
  requireFile(requiredFile)
}

const packageJson = parseJson("package.json")
for (const dependency of [
  "@supabase/supabase-js",
  "@tanstack/react-table",
  "lucide-react",
  "radix-ui",
  "react",
  "react-dom",
  "react-router",
  "sonner",
  "zod",
]) {
  if (!packageJson.dependencies?.[dependency]) {
    errors.push(`Missing runtime dependency: ${dependency}`)
  }
}

const componentsConfig = parseJson("components.json")
if (componentsConfig.aliases?.ui !== "@/components/ui") {
  errors.push("components.json must map ui alias to @/components/ui")
}

if (componentsConfig.aliases?.utils !== "@/lib/utils") {
  errors.push("components.json must map utils alias to @/lib/utils")
}

for (const file of projectCodeFiles) {
  const content = read(file)
  const staticImports = content.matchAll(/from\s+["']([^"']+)["']/g)
  const dynamicImports = content.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)

  for (const match of [...staticImports, ...dynamicImports]) {
    const specifier = match[1]

    if (!resolveImport(file, specifier)) {
      errors.push(`Broken import in ${file}: ${specifier}`)
    }
  }
}

const misplacedTests = files.filter((file) => file.startsWith("src/") && /\.test\.(ts|tsx)$/.test(file))
if (misplacedTests.length > 0) {
  errors.push(`Tests must live under tests/: ${misplacedTests.join(", ")}`)
}

const manualTableFiles = srcCodeFiles
  .filter((file) => file !== "src/components/ui/table.tsx")
  .filter((file) => file !== "src/components/ui/calendar.tsx")
  .filter((file) => !file.startsWith("src/components/data-table/"))
  .filter((file) => /<(table|thead|tbody|tr|td|th)(\s|>)/.test(read(file)))

if (manualTableFiles.length > 0) {
  errors.push(`Manual table markup must use shared table components: ${manualTableFiles.join(", ")}`)
}

const frontendSecretLeaks = srcCodeFiles
  .filter((file) => file !== "src/config/env.ts")
  .filter((file) => /SUPABASE_SERVICE_ROLE_KEY|sb_secret_|service_role/.test(read(file)))

if (frontendSecretLeaks.length > 0) {
  errors.push(`Potential Supabase secret leakage in frontend files: ${frontendSecretLeaks.join(", ")}`)
}

requireContent(
  "src/features/auth/hooks/auth-use-inactivity-logout.ts",
  "45 * 60_000",
  "45 minute inactivity timeout"
)
requireContent(
  "src/features/auth/components/auth-inactivity-guard.tsx",
  "markInactivitySessionExpired()",
  "inactivity-expired session flag"
)
if (read("src/features/auth/components/auth-inactivity-guard.tsx").includes("notify.")) {
  errors.push("Inactivity timeout must not use toast notifications")
}

for (const [file, needles] of [
  [
    "src/components/data-table/data-table.tsx",
    [
      "DataTableStateRow",
      "sourceRowCount",
      "enableExport",
      "max-h-[min(70svh,42rem)]",
      "--data-table-scroll-viewport-width",
    ],
  ],
  [
    "src/components/data-table/data-table-toolbar.tsx",
    ["enableExport", "exportRowsToXlsx"],
  ],
  [
    "src/components/data-table/data-table-scroll-container.tsx",
    ["ResizeObserver", "--data-table-scroll-viewport-width"],
  ],
  [
    "src/components/ui/table.tsx",
    ["relative w-full", "[&:has([role=checkbox])]:pr-0"],
  ],
  [
    "src/features/users/services/users-service.ts",
    ["cpf_display", "phone_display", "admin-user-auth-factors", "passkey_count"],
  ],
  [
    "src/features/users/routes/users-route.tsx",
    ["emptyOption", "admin.users.export", "admin.users.resetPasskey"],
  ],
  [
    "src/features/users/columns/users-columns.tsx",
    ["canResetPasskey", "canRevokeSessions", "resolveLastAccessLabel", "passkeyStatus", "Passkey"],
  ],
  [
    "src/features/notifications/services/notifications-service.ts",
    ["notification_deliveries", "notification_events", "set_notification_read_status"],
  ],
  [
    "supabase/migrations/20260708182449_notifications_passkey_auth_hardening.sql",
    ["notification_events", "notification_deliveries", "enable row level security", "grant select on table public.notification_events to authenticated"],
  ],
]) {
  const content = read(file)

  for (const needle of needles) {
    if (!content.includes(needle)) {
      errors.push(`Missing invariant "${needle}" in ${file}`)
    }
  }
}

const notificationsService = read("src/features/notifications/services/notifications-service.ts")
if (/initialNotifications|inMemoryNotifications|resetNotificationsMockState/.test(notificationsService)) {
  errors.push("Notifications service must not ship mocked notification content")
}

const remainingMfaReferences = srcCodeFiles
  .filter((file) => !file.includes("auth-mfa"))
  .filter((file) => /\bmfaStatus\b|Autenticação multifator|settingsCopy\.mfa|unitsCopy\.table\.mfa/.test(read(file)))

if (remainingMfaReferences.length > 0) {
  errors.push(`Passkey UI must not use MFA status semantics: ${remainingMfaReferences.join(", ")}`)
}

const piiMigration = migrationFiles.find((file) =>
  file.endsWith("_user_display_pii_and_auth_grants.sql")
)

if (!piiMigration) {
  errors.push("Missing user display PII and auth grants migration")
} else {
  const migrationContent = read(piiMigration)

  for (const needle of ["cpf_display", "phone_display", "revoke execute on function public.current_user_role() from public"]) {
    if (!migrationContent.includes(needle)) {
      errors.push(`Migration ${piiMigration} missing ${needle}`)
    }
  }
}

if (errors.length > 0) {
  console.error(`VALIDATION FAILED:\n${errors.join("\n")}`)
  process.exit(1)
}

console.log("FINAL PACKAGE VALIDATION PASSED")
console.log(JSON.stringify({
  files: files.length,
  srcCodeFiles: srcCodeFiles.length,
  migrations: migrationFiles.length,
}, null, 2))
