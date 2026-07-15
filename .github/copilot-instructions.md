# Copilot instructions for this repo

Vite + React 19 + TypeScript app validating a generic, reusable `DataTable` (TanStack Table + shadcn/ui) while the surrounding product (sidebar, auth, forms, Supabase integration) evolves around it. Package manager is **pnpm**. Docs and code comments are largely in **Portuguese** — match that when editing existing files.

## Commands

```bash
pnpm dev         # vite dev server (port 5173, strictPort)
pnpm build       # tsc -b && vite build
pnpm typecheck   # tsc -b
pnpm lint        # eslint .
pnpm test        # vitest run (all tests)
pnpm test:watch  # vitest watch mode
pnpm validate    # scripts/validate-package.mjs
```

Run a single test file: `pnpm vitest run tests/auth/auth-flow.test.ts`
Run tests matching a name: `pnpm vitest run -t "some test name"`

Vitest config lives in `vite.config.ts` (not a separate vitest.config): `environment: jsdom`, `globals: true`, setup file `tests/setup.ts`. Alias `@` → `src` (defined in both `vite.config.ts` and `tsconfig.json`).

## Architecture

- `src/components/data-table/` — the generic table engine. Must stay domain-agnostic: **never** import mocks, routes, or domain-specific columns here.
- `src/components/sidebar/` — app shell/header built on shadcn/ui.
- `src/components/toast/` — central notification API; sanitizes and translates messages before display.
- `src/components/ui/` — shadcn/ui primitives (some files like `carousel.tsx`, `chart.tsx` are eslint-ignored, generated/vendor code).
- `src/app/router/route-registry.ts` — single source of truth for route metadata; routes are lazy-loaded (`React.lazy`/`Suspense`) and wrapped in `ProtectedRoute` (Supabase session + business profile `active` + capability check).
- `src/features/auth/authorization/authorization-policy.ts` — centralized authorization policy: role hierarchy, permission mappings, role → permission resolution, unit scope logic.
- `src/features/<name>/` — one directory per domain feature (`auth`, `units`, `clients`, `users`, `audit`, `permissions`, `prices`, `rules`, `settings`, `notifications`), each typically with `columns/`, `components/`, `hooks/`, `routes/`, `services/`, `types/`, `utils/`.

### Gateway pattern (data-access features)

Each data-backed feature follows: **Gateway interface** (`XxxGateway` contract) → **mock gateway** (in-memory, used for dev since data is currently mocked) → **factory functions** `getXxxGateway()` / `configureXxxGateway()` / `resetXxxGateway()` → **service** (business logic consuming the gateway) → **normalizer** (sanitizes ERP/external payloads into safe types). See `src/features/units/services/units-gateway.ts` and `unit-yard-gateway.ts` for the reference shape. Real Supabase-backed gateways are pending for most features — check `docs/PROJECT_STATUS.md` for which ones.

### Authorization

Roles (`owner`, `admin`, `auditor`, `manager`, `operator`) and per-route capability requirements are defined in `src/features/auth/authorization/authorization-policy.ts`. Protected routes check a capability string (e.g. `admin.units.read`) against the user's role, not just authentication.

### Supabase

- `supabase/migrations/` — schema, RLS policies, audit, rate limiting, recovery flows (sequential numbered SQL files).
- `supabase/functions/` — Edge Functions (public auth endpoints vs JWT-protected admin/profile endpoints). This directory is excluded from ESLint.
- Passkey/WebAuthn and units-sync (ERP integration) setup require specific env vars (`VITE_APP_ORIGIN`, `VITE_WEBAUTHN_RP_ID`, ERP secrets) — see checklists in `README.md` before touching auth or units-sync code.

## Conventions

- CPF (Brazilian ID) is used as login input but the full CPF must never be persisted to frontend state, URL, JWT, or audit logs — only partially masked/derived forms.
- Each table has exactly one search field via `globalSearch`; no checkbox row-selection column in current tables. Table footer text: `Exibindo X de X item/itens`.
- Vehicles are a contextual resource under Clients (`/clientes/:id`) — there is no direct `/veiculos` route.
- Dev-only auth bypasses must be guarded with `import.meta.env.DEV` so they tree-shake out of production builds; never escalate privileges via session helpers.
- Fire-and-forget async work (e.g., audit event appends) should be `await`ed with a catch, not left detached, to avoid silent failures.
- Tests live outside `src/`, under `tests/`, mirroring the source area they cover (`tests/auth/`, `tests/components/data-table/`, `tests/components/toast/`, etc.), using Vitest + Testing Library.
- Check `docs/PROJECT_STATUS.md` for the current state of each feature (which gateways are mocked vs real, test coverage, pending work) before assuming a feature is fully implemented.
