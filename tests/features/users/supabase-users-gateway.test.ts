import { beforeEach, describe, expect, it, vi } from "vitest"

const appUserId = "11111111-1111-4111-8111-111111111111"
const authUserId = "22222222-2222-4222-8222-222222222222"

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  invoke: vi.fn(),
  rpc: vi.fn(),
}))

describe("Supabase users gateway", () => {
  beforeEach(() => {
    vi.resetModules()
    supabaseMock.from.mockReset()
    supabaseMock.invoke.mockReset()
    supabaseMock.rpc.mockReset()
    vi.doMock("@/lib/supabase-browser", () => ({
      getSupabaseBrowserClient: () => ({
        from: supabaseMock.from,
        functions: { invoke: supabaseMock.invoke },
        rpc: supabaseMock.rpc,
      }),
    }))
  })

  it("joins the validated directory, access and passkey sources", async () => {
    const usersQuery = {
      order: vi.fn().mockResolvedValue({
        data: [
          {
            app_user_units: [{ unit_id: "2" }],
            auth_user_id: authUserId,
            cpf_display: "529.982.247-25",
            cpf_masked: "***.***.***-25",
            email: "user@example.com",
            id: appUserId,
            locked_until: null,
            name: "Usuário Válido",
            phone_display: "(11) 98888-7777",
            phone_masked: "(11) *****-7777",
            role: "operator",
            status: "active",
          },
        ],
        error: null,
      }),
      select: vi.fn(),
    }
    usersQuery.select.mockReturnValue(usersQuery)
    supabaseMock.from.mockReturnValue(usersQuery)
    supabaseMock.rpc.mockResolvedValue({
      data: [
        {
          auth_user_id: authUserId,
          last_sign_in_at: "2026-08-01T03:00:00.000Z",
        },
      ],
      error: null,
    })
    supabaseMock.invoke.mockResolvedValue({
      data: {
        factors: [{ auth_user_id: authUserId, passkey_count: 2 }],
        ok: true,
      },
      error: null,
    })

    const { createSupabaseUsersGateway } = await import(
      "@/features/users/gateways/supabase-users-gateway"
    )
    const users = await createSupabaseUsersGateway().list()

    expect(usersQuery.order).toHaveBeenCalledWith("name", { ascending: true })
    expect(supabaseMock.rpc).toHaveBeenCalledWith("list_app_user_last_access")
    expect(supabaseMock.invoke).toHaveBeenCalledWith(
      "admin-user-auth-factors",
      { body: {} }
    )
    expect(users).toEqual([
      expect.objectContaining({
        authUserId,
        id: appUserId,
        lastAccessAt: "2026-08-01T03:00:00.000Z",
        passkeyCount: 2,
        passkeyStatus: "active",
        unitId: "2",
      }),
    ])
  })

  it("sends only the approved create command and validates the mutation result", async () => {
    supabaseMock.invoke.mockResolvedValue({
      data: { authUserId, id: appUserId, ok: true },
      error: null,
    })

    const { createSupabaseUsersGateway } = await import(
      "@/features/users/gateways/supabase-users-gateway"
    )
    const result = await createSupabaseUsersGateway().create({
      cpf: "52998224725",
      email: null,
      name: "Usuário Válido",
      phone: "11988887777",
      role: "owner",
      temporaryPassword: "SenhaForte123!",
      unitId: null,
    })

    expect(supabaseMock.invoke).toHaveBeenCalledWith("admin-user-create", {
      body: {
        cpf: "52998224725",
        email: undefined,
        hasOwnEmail: false,
        name: "Usuário Válido",
        phone: "11988887777",
        role: "owner",
        temporaryPassword: "SenhaForte123!",
        unitId: undefined,
      },
    })
    expect(result).toEqual({ authUserId, id: appUserId })
  })

  it("fails closed when any required list source is unavailable", async () => {
    const usersQuery = {
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      select: vi.fn(),
    }
    usersQuery.select.mockReturnValue(usersQuery)
    supabaseMock.from.mockReturnValue(usersQuery)
    supabaseMock.rpc.mockResolvedValue({
      data: null,
      error: new Error("rpc unavailable"),
    })
    supabaseMock.invoke.mockResolvedValue({
      data: { factors: [], ok: true },
      error: null,
    })

    const { createSupabaseUsersGateway } = await import(
      "@/features/users/gateways/supabase-users-gateway"
    )

    await expect(createSupabaseUsersGateway().list()).rejects.toThrow(
      "Não foi possível carregar os usuários."
    )
  })
})
