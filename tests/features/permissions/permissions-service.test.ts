import { beforeEach, describe, expect, it, vi } from "vitest"

const permissionMatrixRow = {
  description: null,
  groupKey: "users",
  groupLabel: "Usuários",
  id: "users.read",
  isCritical: true,
  key: "users.read",
  label: "Consultar usuários",
  roles: ["owner"],
  source: "system",
}

const rawPermissionRow = {
  description: null,
  key: "users.read",
  label: "Consultar usuários",
}

const rawRolePermissionRow = {
  permission_key: "users.read",
  role_key: "owner",
}

function createSupabaseMock() {
  const functionsInvoke = vi.fn()
  const getValidatedSupabaseAccessToken = vi.fn()
  const from = vi.fn((table: string) => {
    if (table === "app_permissions") {
      return {
        select: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [rawPermissionRow],
              error: null,
            })
          ),
        })),
      }
    }

    if (table === "app_role_permissions") {
      return {
        select: vi.fn(() =>
          Promise.resolve({
            data: [rawRolePermissionRow],
            error: null,
          })
        ),
      }
    }

    throw new Error(`Unexpected table ${table}`)
  })
  const supabase = {
    from,
    functions: {
      invoke: functionsInvoke,
    },
  }

  return {
    from,
    functionsInvoke,
    getValidatedSupabaseAccessToken,
    supabase,
  }
}

async function importServiceWithSupabase(
  mock: ReturnType<typeof createSupabaseMock>
) {
  vi.doMock("@/lib", () => ({
    getSupabaseBrowserClient: () => mock.supabase,
    getValidatedSupabaseAccessToken: mock.getValidatedSupabaseAccessToken,
  }))

  return import("@/features/permissions/services/permissions-service")
}

describe("permissions service", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("uses the protected Edge Function with a validated user JWT", async () => {
    const mock = createSupabaseMock()
    mock.getValidatedSupabaseAccessToken.mockResolvedValue("session-token")
    mock.functionsInvoke.mockResolvedValue({
      data: { permissions: [permissionMatrixRow] },
      error: null,
    })
    const { listPermissionMatrix } = await importServiceWithSupabase(mock)

    const permissions = await listPermissionMatrix()

    expect(mock.functionsInvoke).toHaveBeenCalledWith("list-permission-matrix", {
      body: {},
      headers: {
        Authorization: "Bearer session-token",
      },
    })
    expect(mock.from).not.toHaveBeenCalled()
    expect(permissions).toHaveLength(1)
    expect(permissions[0]?.roleAccess.owner).toBe(true)
  })

  it("does not call the protected Edge Function when no validated session exists", async () => {
    const mock = createSupabaseMock()
    mock.getValidatedSupabaseAccessToken.mockResolvedValue(null)
    const { listPermissionMatrix } = await importServiceWithSupabase(mock)

    const permissions = await listPermissionMatrix()

    expect(mock.functionsInvoke).not.toHaveBeenCalled()
    expect(mock.from).toHaveBeenCalledWith("app_permissions")
    expect(mock.from).toHaveBeenCalledWith("app_role_permissions")
    expect(permissions).toHaveLength(1)
    expect(permissions[0]?.roleAccess.owner).toBe(true)
  })
})
