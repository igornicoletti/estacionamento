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

function createSupabaseMock() {
  const functionsInvoke = vi.fn()
  const getValidatedSupabaseAccessToken = vi.fn()
  const readResponseErrorMessage = vi.fn()
  const supabase = {
    functions: {
      invoke: functionsInvoke,
    },
  }

  return {
    functionsInvoke,
    getValidatedSupabaseAccessToken,
    readResponseErrorMessage,
    supabase,
  }
}

async function importServiceWithSupabase(
  mock: ReturnType<typeof createSupabaseMock>
) {
  vi.doMock("@/lib", () => ({
    getSupabaseBrowserClient: () => mock.supabase,
    getValidatedSupabaseAccessToken: mock.getValidatedSupabaseAccessToken,
    readResponseErrorMessage: mock.readResponseErrorMessage,
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
    expect(permissions).toHaveLength(1)
    expect(permissions[0]?.roleAccess.owner).toBe(true)
  })

  it("does not query permissions without a validated user session", async () => {
    const mock = createSupabaseMock()
    mock.getValidatedSupabaseAccessToken.mockResolvedValue(null)
    const { listPermissionMatrix } = await importServiceWithSupabase(mock)

    await expect(listPermissionMatrix()).rejects.toThrow(
      "Sua sessão expirou. Faça login novamente para continuar."
    )

    expect(mock.functionsInvoke).not.toHaveBeenCalled()
  })

  it("maps protected function failures to user-facing copy", async () => {
    const mock = createSupabaseMock()
    mock.getValidatedSupabaseAccessToken.mockResolvedValue("session-token")
    mock.readResponseErrorMessage.mockResolvedValue(
      "Não foi possível continuar com os dados informados."
    )
    mock.functionsInvoke.mockResolvedValue({
      data: null,
      error: new Error("Edge Function returned a non-2xx status code"),
    })
    const { listPermissionMatrix } = await importServiceWithSupabase(mock)

    await expect(listPermissionMatrix()).rejects.toThrow(
      "Não foi possível continuar com os dados informados."
    )
  })
})
