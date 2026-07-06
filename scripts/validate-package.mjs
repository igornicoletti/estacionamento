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

    if (entry.isDirectory()) {
      return walk(relative)
    }

    return relative
  })
}

const files = walk().sort()
const sourceFiles = files.filter((file) => /\.(ts|tsx|json|md|mjs|css|html)$/.test(file))
const srcCodeFiles = files.filter((file) => file.startsWith("src/") && /\.(ts|tsx)$/.test(file))
const testCodeFiles = files.filter((file) => file.startsWith("tests/") && /\.(ts|tsx)$/.test(file))
const projectCodeFiles = files.filter(
  (file) =>
    file === "vite.config.ts" ||
    file === "eslint.config.js" ||
    ((file.startsWith("src/") || file.startsWith("tests/")) && /\.(ts|tsx|js)$/.test(file))
)
const routeFiles = files.filter((file) => file.includes("/routes/") && file.endsWith("-route.tsx"))
const tableRouteFiles = files.filter(
  (file) => file.startsWith("src/features/data-table/routes/") && file.endsWith("-route.tsx")
)

function requireFile(filePath) {
  if (!exists(filePath)) {
    errors.push(`Missing file: ${filePath}`)
  }
}

function forbidFile(filePath) {
  if (exists(filePath)) {
    errors.push(`File should not remain at old location: ${filePath}`)
  }
}

function requireContent(filePath, needle, label) {
  if (!read(filePath).includes(needle)) {
    errors.push(`Missing ${label} in ${filePath}`)
  }
}

function resolveImport(fromFile, specifier) {
  if (specifier.startsWith("@/")) {
    return resolveCandidate(`src/${specifier.slice(2)}`)
  }

  if (!specifier.startsWith(".")) {
    return true
  }

  const base = normalizePath(path.join(path.posix.dirname(fromFile), specifier))
  return resolveCandidate(base)
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

for (const requiredFile of [
  "README.md",
  "index.html",
  "vite.config.ts",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "components.json",
  "docs/VALIDATION.md",
  "docs/FINAL_AUDIT.md",
  "docs/AUTH_IMPLEMENTATION_AUDIT.md",
  "docs/AUTH_SECURITY_MODEL.md",
  "docs/AUTH_RECOVERY_FLOW.md",
  "docs/AUTH_DIRECTORY_ARCHITECTURE.md",
  "docs/AUTH_TEST_PLAN.md",
  "tests/setup.ts",
  "tests/auth/auth-validation.test.ts",
  "tests/components/data-table/data-table.test.tsx",
  "tests/components/data-table/data-table-filter-utils.test.ts",
  "tests/components/toast/toast-utils.test.ts",
  "tests/features/audit/audit-table.test.tsx",
  "tests/features/profile/profile-route.test.tsx",
  "tests/mocks/table-data/schema.test.ts",
  "src/main.tsx",
  "src/App.tsx",
  "src/index.css",
  "src/vite-env.d.ts",
  "src/app/layouts/app-shell.tsx",
  "src/app/layouts/auth-shell.tsx",
  "src/app/layouts/index.ts",
  "src/app/router/auth-route.tsx",
  "src/app/router/app-router.tsx",
  "src/app/router/public-route.tsx",
  "src/app/router/index.ts",
  "src/app/router/protected-route.tsx",
  "src/app/router/route-definitions.ts",
  "src/app/router/route-loading.tsx",
  "src/app/router/routes.tsx",
  "src/app/router/not-found-route.tsx",
  "src/components/toast/toast-app.tsx",
  "src/components/toast/index.ts",
  "src/components/toast/toast-copy.ts",
  "src/components/toast/toast-utils.ts",
  "src/components/toast/toast.ts",
  "src/components/ui/alert.tsx",
  "src/components/sidebar/index.ts",
  "src/components/sidebar/sidebar-app.tsx",
  "src/components/sidebar/sidebar-brand.tsx",
  "src/components/sidebar/sidebar-config.ts",
  "src/components/sidebar/sidebar-footer.tsx",
  "src/components/sidebar/sidebar-header.tsx",
  "src/components/sidebar/sidebar-nav-group.tsx",
  "src/components/sidebar/sidebar-navigation.tsx",
  "src/components/sidebar/sidebar-notifications-popover.tsx",
  "src/components/sidebar/sidebar-profile.tsx",
  "src/components/sidebar/sidebar-user-menu.tsx",
  "src/hooks/use-mobile.ts",
  "src/config/auth-config.ts",
  "src/config/auth-permissions.ts",
  "src/config/env.ts",
  "src/config/index.ts",
  "src/lib/cpf.ts",
  "src/lib/errors.ts",
  "src/lib/formatters.ts",
  "src/lib/phone.ts",
  "src/lib/result.ts",
  "src/lib/supabase-browser.ts",
  "src/lib/index.ts",
  "src/lib/utils.ts",
  "src/features/auth/index.ts",
  "src/features/auth/auth-copy.ts",
  "src/features/auth/components/index.ts",
  "src/features/auth/hooks/index.ts",
  "src/features/auth/routes/auth-login-route.tsx",
  "src/features/auth/routes/auth-recovery-route.tsx",
  "src/features/auth/routes/index.ts",
  "src/features/auth/schemas/index.ts",
  "src/features/auth/services/index.ts",
  "src/features/auth/types/index.ts",
  "src/features/audit/index.ts",
  "src/features/audit/audit-copy.ts",
  "src/features/audit/audit-details.ts",
  "src/features/audit/columns/audit-columns.tsx",
  "src/features/audit/columns/index.ts",
  "src/features/audit/routes/audit-route.tsx",
  "src/features/audit/table-config.ts",
  "src/features/profile/index.ts",
  "src/features/profile/profile-copy.ts",
  "src/features/profile/components/profile-action-row.tsx",
  "src/features/profile/components/profile-avatar-upload.tsx",
  "src/features/profile/components/profile-identity-form.tsx",
  "src/features/profile/components/profile-mfa-change-form.tsx",
  "src/features/profile/components/profile-passkey-list.tsx",
  "src/features/profile/components/profile-password-form.tsx",
  "src/features/profile/components/profile-session-list.tsx",
  "src/features/profile/routes/profile-route.tsx",
  "src/features/profile/schemas/profile-identity-schema.ts",
  "src/features/profile/schemas/profile-mfa-change-schema.ts",
  "src/features/profile/schemas/profile-password-schema.ts",
  "src/features/profile/services/profile-api.ts",
  "src/features/users/index.ts",
  "src/features/users/user-copy.ts",
  "src/features/users/components/user-create-form.tsx",
  "src/components/data-table/data-table-details.tsx",
  "src/components/data-table/data-table.tsx",
  "src/components/data-table/index.ts",
  "src/features/data-table/components/table-page.tsx",
  "src/features/data-table/table-details.ts",
  "src/features/data-table/table-config.ts",
  "src/features/data-table/columns/client-columns.tsx",
  "src/features/data-table/columns/vehicle-columns.tsx",
  "src/features/data-table/columns/user-columns.tsx",
  "src/features/data-table/columns/unit-columns.tsx",
  "src/features/data-table/routes/clients/clients-route.tsx",
  "src/features/data-table/routes/clients/client-vehicles-route.tsx",
  "src/features/data-table/routes/clients/index.ts",
  "src/features/data-table/routes/users/users-route.tsx",
  "src/features/data-table/routes/users/index.ts",
  "src/features/data-table/routes/units/units-route.tsx",
  "src/features/data-table/routes/units/index.ts",
  "src/mocks/table-data/schema.ts",
  "src/mocks/table-data/sanitizers.ts",
  "src/mocks/table-data/loaders.ts",
  "src/mocks/table-data/clients.json",
  "src/mocks/table-data/vehicles.json",
  "src/mocks/table-data/users.json",
  "src/mocks/table-data/units.json",
  "supabase/config.toml",
  "supabase/migrations/0001_auth_domain_schema.sql",
  "supabase/migrations/0002_auth_rls_policies.sql",
  "supabase/migrations/0003_auth_audit_rate_limit.sql",
  "supabase/migrations/0004_auth_recovery_requests.sql",
  "supabase/migrations/0005_auth_session_revocation.sql",
  "supabase/functions/_shared/index.ts",
  "supabase/functions/auth-start/index.ts",
  "supabase/functions/auth-password/index.ts",
  "supabase/functions/auth-complete-passkey/index.ts",
  "supabase/functions/auth-register-passkey/index.ts",
  "supabase/functions/auth-recovery-request/index.ts",
  "supabase/functions/admin-user-create/index.ts",
  "supabase/functions/admin-user-reset-password/index.ts",
  "supabase/functions/admin-user-reset-passkey/index.ts",
  "supabase/functions/admin-user-clear-lock/index.ts",
  "supabase/functions/admin-user-revoke-sessions/index.ts",
]) {
  requireFile(requiredFile)
}

for (const uiComponent of [
  "alert",
  "avatar",
  "badge",
  "button",
  "checkbox",
  "combobox",
  "collapsible",
  "command",
  "dialog",
  "dropdown-menu",
  "empty",
  "field",
  "input",
  "input-group",
  "kbd",
  "popover",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "spinner",
  "table",
  "tabs",
  "tooltip",
  "textarea",
]) {
  requireFile(`src/components/ui/${uiComponent}.tsx`)
}

for (const oldPath of [
  "VALIDATION.md",
  "FINAL_AUDIT.md",
  "src/test/setup.ts",
  "src/features/data-table/components/table-config.ts",
  "src/features/data-table/components/table-details.ts",
  "src/features/data-table/components/user-nav.tsx",
  "src/features/data-table-demo/components/generic-table-demo.tsx",
  "src/features/data-table-demo",
  "src/routes",
  "src/features/data-table-demo/columns/task-columns.tsx",
  "src/routes/tasks/tasks-route.tsx",
  "src/routes/tasks/index.ts",
  "src/mocks/table-data/tasks.json",
  "src/features/data-table/routes/vehicles/vehicles-route.tsx",
  "src/features/data-table/routes/vehicles/index.ts",
  "src/features/profile/components/profile-contact-form.tsx",
  "src/features/profile/schemas/profile-contact-schema.ts",
]) {
  forbidFile(oldPath)
}

for (const legacyDirectory of ["@", "components", "data", "src/test"]) {
  if (exists(legacyDirectory)) {
    errors.push(`Legacy root directory should not remain: ${legacyDirectory}`)
  }
}

const misplacedTests = files.filter((file) => file.startsWith("src/") && /\.test\.(ts|tsx)$/.test(file))
if (misplacedTests.length > 0) {
  errors.push(`Tests must live under tests/: ${misplacedTests.join(", ")}`)
}

const packageJson = parseJson("package.json")
for (const dependency of [
  "@base-ui/react",
  "@hookform/resolvers",
  "@supabase/supabase-js",
  "@tanstack/react-table",
  "class-variance-authority",
  "clsx",
  "cmdk",
  "lucide-react",
  "radix-ui",
  "react",
  "react-dom",
  "react-hook-form",
  "react-router",
  "sonner",
  "tailwind-merge",
  "tw-animate-css",
  "zod",
]) {
  if (!packageJson.dependencies?.[dependency]) {
    errors.push(`Missing runtime dependency: ${dependency}`)
  }
}

for (const dependency of [
  "@tailwindcss/vite",
  "@vitejs/plugin-react",
  "typescript",
  "vite",
  "vitest",
  "eslint",
  "typescript-eslint",
  "@testing-library/react",
  "@testing-library/jest-dom",
  "jsdom",
]) {
  if (!packageJson.devDependencies?.[dependency]) {
    errors.push(`Missing dev dependency: ${dependency}`)
  }
}

const componentsConfig = parseJson("components.json")
if (componentsConfig.aliases?.ui !== "@/components/ui") {
  errors.push("components.json must map ui alias to @/components/ui")
}

if (componentsConfig.aliases?.components !== "@/components") {
  errors.push("components.json must map components alias to @/components")
}

if (componentsConfig.aliases?.utils !== "@/lib/utils") {
  errors.push("components.json must map utils alias to @/lib/utils")
}

if (componentsConfig.tailwind?.css !== "src/index.css") {
  errors.push("components.json must point Tailwind CSS to src/index.css")
}

const tsconfig = parseJson("tsconfig.json")
if (tsconfig.compilerOptions?.paths?.["@/*"]?.[0] !== "./src/*") {
  errors.push("tsconfig.json must expose @/* as ./src/* for shadcn and editor tooling")
}

for (const tsconfigPath of ["tsconfig.json", "tsconfig.app.json", "tsconfig.node.json"]) {
  const config = parseJson(tsconfigPath)

  if (config.compilerOptions?.strict !== true) {
    errors.push(`${tsconfigPath} must enable strict mode`)
  }

  if (config.compilerOptions?.forceConsistentCasingInFileNames !== true) {
    errors.push(`${tsconfigPath} must enable forceConsistentCasingInFileNames`)
  }
}

const nodeConfig = parseJson("tsconfig.node.json")
if (nodeConfig.compilerOptions?.target !== "ES2022") {
  errors.push("tsconfig.node.json target must be ES2022")
}

if (!nodeConfig.compilerOptions?.lib?.includes("ES2022")) {
  errors.push("tsconfig.node.json lib must include ES2022")
}

for (const file of projectCodeFiles) {
  const content = read(file)

  if (/@\/registry\/new-york-v4|registry\/new-york-v4|from\s+["']next["']|components\/shared|components\/models/.test(content)) {
    errors.push(`Legacy framework or shadcn path found in ${file}`)
  }

  const staticImports = content.matchAll(/from\s+["']([^"']+)["']/g)
  const dynamicImports = content.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)

  for (const match of [...staticImports, ...dynamicImports]) {
    const specifier = match[1]

    if (!resolveImport(file, specifier)) {
      errors.push(`Broken import in ${file}: ${specifier}`)
    }
  }
}

for (const file of srcCodeFiles) {
  const content = read(file)

  if (/\bany\b/.test(content)) {
    errors.push(`Forbidden explicit any found in ${file}`)
  }

  if (/@ts-ignore|@ts-expect-error|TODO|FIXME/.test(content)) {
    errors.push(`Temporary suppression or pending marker found in ${file}`)
  }

  if (/console\.|debugger/.test(content)) {
    errors.push(`Debug statement found in ${file}`)
  }
}

const forbiddenFeatureTerms = [
  "tarefas",
  "Tarefas",
  "TASK-",
  "taskColumns",
  "taskSchema",
  "getTasks",
  "taskGlobalSearch",
  "taskFilterFields",
]

for (const file of sourceFiles.filter((sourceFile) => sourceFile !== "scripts/validate-package.mjs")) {
  const content = read(file)

  for (const term of forbiddenFeatureTerms) {
    if (content.includes(term)) {
      errors.push(`Removed feature term "${term}" found in ${file}`)
    }
  }
}

const dataTableExports = srcCodeFiles.filter((file) =>
  /export function DataTable\b/.test(read(file))
)

if (
  dataTableExports.length !== 1 ||
  dataTableExports[0] !== "src/components/data-table/data-table.tsx"
) {
  errors.push(`Expected one DataTable export in shared core, found: ${dataTableExports.join(", ")}`)
}

const sharedCoreLeaks = srcCodeFiles
  .filter((file) => file.startsWith("src/components/data-table/"))
  .filter((file) => /@\/mocks\/|@\/features\/|\b(Vehicle|Client|User|Unit)\b/.test(read(file)))

if (sharedCoreLeaks.length > 0) {
  errors.push(`Shared data-table core leaks demo/domain imports: ${sharedCoreLeaks.join(", ")}`)
}

const manualTableFiles = srcCodeFiles
  .filter((file) => file !== "src/components/ui/table.tsx")
  .filter((file) => !file.startsWith("src/components/data-table/"))
  .filter((file) => /<(table|thead|tbody|tr|td|th)(\s|>)/.test(read(file)))

if (manualTableFiles.length > 0) {
  errors.push(`Manual table markup must use the shared DataTable core: ${manualTableFiles.join(", ")}`)
}

if (tableRouteFiles.length !== 4) {
  errors.push(`Expected 4 table route files, found ${tableRouteFiles.length}: ${tableRouteFiles.join(", ")}`)
}

const dataTableUsages = tableRouteFiles.reduce((count, file) => {
  const content = read(file)

  if (!content.includes("globalSearch={")) {
    errors.push(`Route table must define a globalSearch prop: ${file}`)
  }

  if (/searchFields=|toolbarActions=|enableRowSelection|Adicionar|Add/.test(content)) {
    errors.push(`Route table should keep one search input, no add action, and no row selection: ${file}`)
  }

  return count + [...content.matchAll(/<DataTable\b/g)].length
}, 0)

if (dataTableUsages !== 4) {
  errors.push(`Expected one DataTable usage per table route, found ${dataTableUsages}`)
}

const routeDefinitionsContent = read("src/app/router/route-definitions.ts")
for (const routePath of ["unidades", "clientes", "usuarios"]) {
  if (!routeDefinitionsContent.includes(`path: "${routePath}"`)) {
    errors.push(`Missing route definition path: ${routePath}`)
  }
}

if (routeDefinitionsContent.includes('path: "veiculos"')) {
  errors.push("Vehicles must not remain as a direct route definition")
}

if (!routeDefinitionsContent.includes("defaultRouteHref")) {
  errors.push("Route definitions must export defaultRouteHref")
}

const routesContent = read("src/app/router/routes.tsx")
for (const routeFeature of ["appRouteDefinitions.map", "React.lazy", "React.Suspense", "ProtectedRoute", "AuthRoute", "AuthShell"]) {
  if (!routesContent.includes(routeFeature)) {
    errors.push(`Router must keep future-ready route feature: ${routeFeature}`)
  }
}

const protectedRouteContent = read("src/app/router/protected-route.tsx")
if (!protectedRouteContent.includes('profile?.status !== "active"')) {
  errors.push("Protected routes must require active app user status")
}

if (!read("src/config/env.ts").includes("shouldBypassAuthInDev")) {
  errors.push("Dev auth bypass must be centralized in config/env.ts")
}

const sidebarNavGroupContent = read("src/components/sidebar/sidebar-nav-group.tsx")
if (!sidebarNavGroupContent.includes("data-[state=active]:bg-sidebar-accent")) {
  errors.push("Sidebar active route styling must use data-[state=active]")
}

if (/data-active:bg-sidebar-accent/.test(sidebarNavGroupContent)) {
  errors.push("SidebarNavGroup must not style active routes with data-active")
}

if (!read("src/components/sidebar/sidebar-profile.tsx").includes("userRoleLabels")) {
  errors.push("Sidebar profile pill must display the authenticated profile role")
}

const authConfigContent = read("src/config/auth-config.ts")
if (!authConfigContent.includes("estacionamento.redemontecarlo.com.br")) {
  errors.push("Auth config must define the production RP ID")
}

const authLoginContent = read("src/features/auth/routes/auth-login-route.tsx")
for (const authNeedle of ["AuthCpfField", "AuthPasswordField", "AuthPasskeyAction", "AuthSubmitButton", "zodResolver"]) {
  if (!authLoginContent.includes(authNeedle)) {
    errors.push(`Auth login route missing feature: ${authNeedle}`)
  }
}

if (authLoginContent.includes("Entrar com passkey")) {
  errors.push("Login must not render a second submit-style passkey action in the first step")
}

const authRecoveryContent = read("src/features/auth/components/auth-recovery-form.tsx")
if (authRecoveryContent.includes("recovery-email") || authRecoveryContent.includes("Email, se possuir")) {
  errors.push("Recovery form must not render the optional email field")
}

if (!authRecoveryContent.includes('selectedReason === "other"')) {
  errors.push("Recovery form must render description only when reason is Outro")
}

const supabaseSchemaContent = read("supabase/migrations/0001_auth_domain_schema.sql")
for (const authTable of ["app_users", "auth_flow_attempts", "auth_rate_limits", "phone_verification_attempts", "email_verification_attempts"]) {
  if (!supabaseSchemaContent.includes(authTable)) {
    errors.push(`Supabase auth schema missing table: ${authTable}`)
  }
}

const supabaseRlsContent = read("supabase/migrations/0002_auth_rls_policies.sql")
if (!supabaseRlsContent.includes("enable row level security")) {
  errors.push("Supabase auth migrations must enable RLS")
}

const supabaseAuditContent = read("supabase/migrations/0003_auth_audit_rate_limit.sql")
if (!supabaseAuditContent.includes("audit_events")) {
  errors.push("Supabase migrations must create audit_events")
}

const notFoundContent = read("src/app/router/not-found-route.tsx")
if (!notFoundContent.includes("appRouteDefinitions")) {
  errors.push("Not found route must read options from appRouteDefinitions")
}

const tableConfigContent = read("src/features/data-table/table-config.ts")
for (const [label, needle] of [
  ["vehicle global search", 'columnIds: ["plate", "driver", "unit"]'],
  ["client global search", 'columnIds: ["id", "name", "documentMasked", "phoneMasked", "city", "state"]'],
  ["user global search", 'columnIds: ["id", "name", "cpfMasked", "phoneMasked", "unit"]'],
  ["unit global search", 'columnIds: ["id", "name", "legalName", "cnpjMasked", "cepMasked", "city", "state"]'],
]) {
  if (!tableConfigContent.includes(needle)) {
    errors.push(`Global search must cover multiple relevant columns for ${label}`)
  }
}

for (const featureColumn of [
  "src/features/data-table/columns/client-columns.tsx",
  "src/features/data-table/columns/vehicle-columns.tsx",
  "src/features/data-table/columns/user-columns.tsx",
  "src/features/data-table/columns/unit-columns.tsx",
]) {
  const content = read(featureColumn)

  if (content.includes("createBadgeColumn")) {
    errors.push(`Unit/city/state display should not use badge columns: ${featureColumn}`)
  }

  if (content.includes("createSelectColumn")) {
    errors.push(`Current table routes must not include checkbox select columns: ${featureColumn}`)
  }
}

const userColumnsContent = read("src/features/data-table/columns/user-columns.tsx")
const unitColumnsContent = read("src/features/data-table/columns/unit-columns.tsx")
const clientColumnsContent = read("src/features/data-table/columns/client-columns.tsx")
const auditColumnsContent = read("src/features/audit/columns/audit-columns.tsx")

if (!userColumnsContent.includes('accessorKey: "cpfMasked"') || !userColumnsContent.includes('title: "CPF"')) {
  errors.push("Users table must render CPF as a dedicated column")
}

if (!unitColumnsContent.includes('accessorKey: "cnpjMasked"') || !unitColumnsContent.includes('title: "CNPJ"')) {
  errors.push("Units table must render CNPJ as a dedicated column")
}

if (!clientColumnsContent.includes('accessorKey: "documentMasked"') || !clientColumnsContent.includes('title: "Documento"')) {
  errors.push("Clients table must render document as a dedicated column")
}

if (!clientColumnsContent.includes('id: "vehicles"') || !clientColumnsContent.includes('to={getVehiclesHref(row.original)}')) {
  errors.push("Clients table must expose a vehicles column linked to /clientes/:id")
}

if (/secondary=\{row\.original\.(cpfMasked|cnpjMasked)\}/.test(`${userColumnsContent}\n${unitColumnsContent}`)) {
  errors.push("CPF and CNPJ must not be stacked as secondary text inside another column")
}

if (/perto do limite/i.test(unitColumnsContent)) {
  errors.push("Occupancy column must not display the perto do limite badge text")
}

for (const auditNeedle of [
  "createActionsColumn",
  "createDataTableDetailsAction",
  "DataTableDetailsTextTrigger",
  "getAuditDetails(row.original)",
]) {
  if (!auditColumnsContent.includes(auditNeedle)) {
    errors.push(`Audit tables must reuse centralized details/actions: ${auditNeedle}`)
  }
}

if (!read("src/features/audit/audit-details.ts").includes("DataTableDetailsConfig")) {
  errors.push("Audit details must use the shared DataTableDetailsConfig contract")
}

const optionTypesContent = read("src/components/data-table/data-table-types.ts")
const optionCellContent = read("src/components/data-table/data-table-option-cell.tsx")
const tableDataOptionsContent = read("src/mocks/table-data/data.tsx")

if (/icon\s*\?:/.test(optionTypesContent)) {
  errors.push("DataTableFilterOption must not expose icon")
}

for (const [label, content] of [
  ["faceted filter", read("src/components/data-table/data-table-faceted-filter.tsx")],
  ["option cell", optionCellContent],
]) {
  if (/option\.icon|currentOption\.icon|PlusCircleIcon|PlusCircle/.test(content)) {
    errors.push(`Table ${label} must not render option icons`)
  }
}

if (/\bicon\s*:/.test(tableDataOptionsContent)) {
  errors.push("Mock table filter options must not define icon entries")
}

if (!read("src/mocks/table-data/constants.ts").includes('mfaStatusValues = ["active", "inactive"]')) {
  errors.push("MFA statuses must be active/inactive only")
}

for (const mfaFile of [
  "src/mocks/table-data/constants.ts",
  "src/mocks/table-data/data.tsx",
  "src/mocks/table-data/users.json",
  "src/features/data-table/table-config.ts",
  "src/features/data-table/table-details.ts",
]) {
  const content = read(mfaFile)

  for (const invalidMfaTerm of ['"enabled"', '"required"', '"not_required"']) {
    if (content.includes(invalidMfaTerm)) {
      errors.push(`Invalid MFA term ${invalidMfaTerm} found in ${mfaFile}`)
    }
  }
}

const profileRouteContent = read("src/features/profile/routes/profile-route.tsx")
for (const profileNeedle of [
  "ProfileAvatarUpload",
  "ProfileIdentityForm",
  "ProfileMfaChangeForm",
  "ProfilePasswordForm",
  "Separator",
  'className="bg-secondary"',
]) {
  if (!profileRouteContent.includes(profileNeedle)) {
    errors.push(`Profile route missing expected shared pattern: ${profileNeedle}`)
  }
}

if (profileRouteContent.includes("ProfileContactForm")) {
  errors.push("Profile route must not expose the old phone change form")
}

if (profileRouteContent.includes("profile-current-password")) {
  errors.push("Profile route must not expose password fields outside the dialog form")
}

requireContent("src/features/data-table/columns/vehicle-columns.tsx", 'accessorKey: "unit"', "vehicle unit column")
requireContent("src/features/data-table/columns/user-columns.tsx", 'accessorKey: "unit"', "user unit column")
requireContent("src/features/data-table/columns/unit-columns.tsx", 'accessorKey: "city"', "unit city text column")
requireContent("src/features/data-table/columns/unit-columns.tsx", 'accessorKey: "state"', "unit state text column")

const indexHtml = read("index.html")
if (!indexHtml.includes('<html lang="pt-BR">')) {
  errors.push("index.html must use pt-BR language")
}

if (/class=["']dark["']/.test(indexHtml)) {
  errors.push("index.html must default to light mode without the dark class")
}

const cssContent = read("src/index.css")
if (!cssContent.includes("--primary: oklch(0.7188 0.1679 216.84);")) {
  errors.push("src/index.css must use the brand blue as primary")
}

if (!cssContent.includes("shadow-primary/5") && !cssContent.includes("216.84 / 0.035")) {
  errors.push("src/index.css must soften blue-tinted shadows")
}

const displayTextFiles = files.filter((file) => /\.(ts|tsx|md|html)$/.test(file))
for (const file of displayTextFiles) {
  const content = read(file)

  if (/Pending first access|pending first access/.test(content)) {
    errors.push(`Pending first access must be displayed as Pendente: ${file}`)
  }
}

const clients = parseJson("src/mocks/table-data/clients.json")
const vehicles = parseJson("src/mocks/table-data/vehicles.json")
const users = parseJson("src/mocks/table-data/users.json")
const units = parseJson("src/mocks/table-data/units.json")

for (const [name, value] of Object.entries({ clients, vehicles, users, units })) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${name} must be a non-empty array`)
  }
}

const clientIds = new Set(clients.map((client) => client.id))
const unitNames = new Set(units.map((unit) => unit.name))
for (const vehicle of vehicles) {
  if (!clientIds.has(vehicle.clientId)) {
    errors.push(`Vehicle ${vehicle.id} references missing client ${vehicle.clientId}`)
  }

  if (!unitNames.has(vehicle.unit)) {
    errors.push(`Vehicle ${vehicle.id} references missing unit ${vehicle.unit}`)
  }
}

for (const user of users) {
  if (user.unit !== null && !unitNames.has(user.unit)) {
    errors.push(`User ${user.id} references missing unit ${user.unit}`)
  }
}

const patterns = [
  ["Client id", clients, /^CLI-\d{3}$/, "id"],
  ["Client CNPJ", clients, /^\*\*\.\*\*\*\.\*\*\*\/\d{4}-\d{2}$|^\d{14}$/, "documentMasked"],
  ["Client phone", clients, /^\d{10,11}$|^\(\d{2}\) \d{4,5}-\d{4}$/, "phoneMasked"],
  ["Vehicle id", vehicles, /^VEH-\d{3}$/, "id"],
  ["Vehicle client id", vehicles, /^CLI-\d{3}$/, "clientId"],
  ["User id", users, /^USR-\d{3}$/, "id"],
  ["Unit id", units, /^UNIT-\d{3}$/, "id"],
  ["Vehicle plate", vehicles, /^[A-Z]{3}\d[A-Z0-9]\d{2}$/, "plate"],
  ["User CPF", users, /^\*\*\*\.\*\*\*\.\d{3}-\d{2}$|^\d{11}$/, "cpfMasked"],
  ["User phone", users, /^\d{10,11}$|^\(\d{2}\) \d{4,5}-\d{4}$/, "phoneMasked"],
  ["Unit CNPJ", units, /^\*\*\.\*\*\*\.\*\*\*\/\d{4}-\d{2}$|^\d{14}$/, "cnpjMasked"],
  ["Unit CEP", units, /^\d{8}$|^\d{5}-\d{3}$/, "cepMasked"],
]

for (const [label, rows, regex, key] of patterns) {
  for (const row of rows) {
    if (!regex.test(row[key])) {
      errors.push(`${label} failed for row ${JSON.stringify(row)}`)
    }
  }
}

for (const unit of units) {
  if (unit.occupied > unit.capacity) {
    errors.push(`Unit ${unit.id} occupied exceeds capacity`)
  }

  if (unit.patio === "no_patio" && (unit.capacity !== 0 || unit.occupied !== 0)) {
    errors.push(`Unit ${unit.id} has no patio but non-zero capacity/occupied`)
  }
}

const requiredDataTableExports = [
  "DataTableLoadingSkeleton",
  "DataTableEmptyState",
  "DataTableSearchInput",
  "DataTableScrollContainer",
  "DataTableStateRow",
  "dataTableCopy",
  "normalizeSearchValue",
  "normalizeFilterText",
  "createActionsColumn",
  "createSelectColumn",
  "createOptionColumn",
  "createBadgeColumn",
  "createDateTimeColumn",
  "createTextColumn",
]

const indexContent = read("src/components/data-table/index.ts")
for (const requiredExport of requiredDataTableExports) {
  if (!indexContent.includes(requiredExport)) {
    errors.push(`Missing data-table barrel export: ${requiredExport}`)
  }
}

const dataTableContent = read("src/components/data-table/data-table.tsx")
const emptyStateContent = read("src/components/data-table/data-table-empty-state.tsx")
const skeletonContent = read("src/components/data-table/data-table-loading-skeleton.tsx")
const searchInputContent = read("src/components/data-table/data-table-search-input.tsx")
const toolbarContent = read("src/components/data-table/data-table-toolbar.tsx")
const facetedFilterContent = read("src/components/data-table/data-table-faceted-filter.tsx")
const scrollContainerContent = read("src/components/data-table/data-table-scroll-container.tsx")
const selectColumnContent = read("src/components/data-table/data-table-select-column.tsx")
const rowActionsContent = read("src/components/data-table/data-table-row-actions.tsx")
const actionsColumnContent = read("src/components/data-table/data-table-actions-column.tsx")
const viewOptionsContent = read("src/components/data-table/data-table-view-options.tsx")
const columnHeaderContent = read("src/components/data-table/data-table-column-header.tsx")
const paginationContent = read("src/components/data-table/data-table-pagination.tsx")

const requiredTableFeatures = [
  ["aria busy", dataTableContent, 'aria-busy="true"'],
  ["controlled row selection", dataTableContent, "onRowSelectionChange"],
  ["manual pagination metadata gate", dataTableContent, "manualPaginationMeta"],
  ["client-side pagination model", dataTableContent, "getPaginationRowModel"],
  ["global search outside TanStack globalFilter", dataTableContent, "tableData = React.useMemo"],
  ["filter sanitization", dataTableContent, "sanitizeColumnFilters"],
  ["search input preserves whitespace while typing", dataTableContent, "return nextValue"],
  ["initial skeleton decision", dataTableContent, "shouldRenderInitialSkeleton"],
  ["preserved rows during refetch", dataTableContent, "shouldPreserveRowsDuringLoading"],
  ["filtered empty recovery", dataTableContent, "onAction={handleClearFilters}"],
  ["safe error retry", dataTableContent, "onRetry?: () => void"],
  ["scroll container", dataTableContent, "DataTableScrollContainer"],
  ["shadcn table import", dataTableContent, "@/components/ui/table"],
  ["shadcn empty component", emptyStateContent, "@/components/ui/empty"],
  ["empty media/title/description", emptyStateContent, "EmptyMedia"],
  ["shadcn skeleton", skeletonContent, "@/components/ui/skeleton"],
  ["structural skeleton rows", skeletonContent, "TableRow"],
  ["input group search", searchInputContent, "@/components/ui/input-group"],
  ["spinner search feedback", searchInputContent, "@/components/ui/spinner"],
  ["global search raw value", toolbarContent, "value={globalFilterValue}"],
  ["clear filters action", toolbarContent, "onClearFilters"],
  ["faceted option dedupe", facetedFilterContent, "dedupeFilterOptions"],
  ["faceted clear centered", facetedFilterContent, "[&>svg:last-child]:hidden"],
  ["drag scroll pointer support", scrollContainerContent, "onPointerDown"],
  ["drag scroll targets shadcn table container", scrollContainerContent, "[data-slot='table-container']"],
  ["drag scroll suppression", scrollContainerContent, "data-no-drag-scroll"],
  ["select page rows core retained", selectColumnContent, "toggleAllPageRowsSelected"],
  ["row actions dedupe", rowActionsContent, "dedupeRowActions"],
  ["actions column no hiding", actionsColumnContent, "enableHiding: false"],
  ["view options hides when empty", viewOptionsContent, "if (!hideableColumns.length)"],
  ["view options label removed", viewOptionsContent, "dataTableCopy.viewOptions.trigger"],
  ["view options uses configured labels", viewOptionsContent, "getColumnLabel(column)"],
  ["text column labels", read("src/components/data-table/data-table-text-column.tsx"), "label: title"],
  ["option column labels", read("src/components/data-table/data-table-option-column.tsx"), "label: title"],
  ["date column labels", read("src/components/data-table/data-table-date-time-column.tsx"), "label: title"],
  ["three-state column sorting", columnHeaderContent, "column.clearSorting()"],
  ["header menu removed", columnHeaderContent, "onClick={handleSortClick}"],
  ["displayed row count", paginationContent, "displayedRowsText"],
]

for (const [label, content, needle] of requiredTableFeatures) {
  if (!content.includes(needle)) {
    errors.push(`Missing table feature: ${label}`)
  }
}

if (columnHeaderContent.includes("DropdownMenu")) {
  errors.push("Column headers must sort directly on click without dropdown menus")
}

if (viewOptionsContent.includes("DropdownMenuLabel")) {
  errors.push("Column view options must not show the Alternar colunas label")
}

if (toolbarContent.includes("onGlobalFilterChange?.(normalizeSearchValue(value))")) {
  errors.push("Global search must not normalize on each keystroke")
}

if (dataTableContent.includes("globalFilter:")) {
  errors.push("DataTable must not register data-level global search as TanStack globalFilter state")
}

const toastUtilsContent = read("src/components/toast/toast-utils.ts")
const toastApiContent = read("src/components/toast/toast.ts")
const toastAppContent = read("src/components/toast/toast-app.tsx")
for (const [label, content, needle] of [
  ["toast sanitizer", toastUtilsContent, "sanitizeToastText"],
  ["toast translator", toastUtilsContent, "toastCopy.translations"],
  ["central notify api", toastApiContent, "export const notify"],
  ["sonner toaster", toastAppContent, "Toaster"],
  ["toaster mounted", read("src/app/layouts/app-shell.tsx"), "ToastApp"],
]) {
  if (!content.includes(needle)) {
    errors.push(`Missing toast feature: ${label}`)
  }
}

if (!cssContent.includes('@import "tw-animate-css";')) {
  errors.push("Tailwind CSS entry must import tw-animate-css for shadcn animations")
}

if (errors.length > 0) {
  console.error(`VALIDATION FAILED:\n${errors.join("\n")}`)
  process.exit(1)
}

console.log("FINAL PACKAGE VALIDATION PASSED")
console.log(JSON.stringify({
  files: sourceFiles.length,
  srcCodeFiles: srcCodeFiles.length,
  testCodeFiles: testCodeFiles.length,
  uiComponents: 26,
  routes: tableRouteFiles,
  models: 4,
  data: {
    clients: clients.length,
    vehicles: vehicles.length,
    users: users.length,
    units: units.length,
  },
  dataTableExports,
  dataTableUsages,
}, null, 2))
