import { beforeEach, describe, expect, it, vi } from "vitest"

import { createPermissionMatrixPayload } from "../../helpers/permissions-memory-gateway"

const supabaseMock = vi.hoisted(() => ({
  getClient: vi.fn(),
  invoke: vi.fn(),
}))

describe("Supabase permissions gateway", () => {
  beforeEach(() => {
    vi.resetModules()
    supabaseMock.getClient.mockReset()
    supabaseMock.invoke.mockReset()
    supabaseMock.getClient.mockReturnValue({
      functions: { invoke: supabaseMock.invoke },
    })
    vi.doMock("@/lib/supabase-browser", () => ({
      getSupabaseBrowserClient: supabaseMock.getClient,
    }))
  })

  it("invokes the protected function and validates its payload", async () => {
    const payload = createPermissionMatrixPayload()
    supabaseMock.invoke.mockResolvedValue({ data: payload, error: null })
    const { createSupabasePermissionsGateway } = await import(
      "@/features/permissions/gateways/supabase-permissions-gateway"
    )

    await expect(
      createSupabasePermissionsGateway().listMatrix()
    ).resolves.toEqual(payload)
    expect(supabaseMock.invoke).toHaveBeenCalledWith(
      "list-permission-matrix",
      { body: {} }
    )
  })

  it("fails closed when the function payload is invalid", async () => {
    supabaseMock.invoke.mockResolvedValue({
      data: { ok: true, permissions: [], roles: [] },
      error: null,
    })
    const { createSupabasePermissionsGateway } = await import(
      "@/features/permissions/gateways/supabase-permissions-gateway"
    )

    await expect(
      createSupabasePermissionsGateway().listMatrix()
    ).rejects.toThrow("A resposta da matriz de permissões é inválida.")
  })

  it("does not synthesize data when the Supabase client is absent", async () => {
    supabaseMock.getClient.mockReturnValue(null)
    const { createSupabasePermissionsGateway } = await import(
      "@/features/permissions/gateways/supabase-permissions-gateway"
    )

    await expect(
      createSupabasePermissionsGateway().listMatrix()
    ).rejects.toThrow("O serviço de permissões não está configurado.")
  })
})
