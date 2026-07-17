import { beforeEach, describe, expect, it, vi } from "vitest"

const invokeMock = vi.fn()

vi.mock("@/lib/supabase-browser", () => {
  return {
    getSupabaseBrowserClient: () => ({
      functions: {
        invoke: invokeMock,
      },
    }),
  }
})

describe("access-requests-service", () => {
  beforeEach(() => {
    vi.resetModules()
    invokeMock.mockReset()
    invokeMock.mockResolvedValue({ data: { message: "ok" }, error: null })
  })

  it("invokes the recovery review edge function with a temporary password", async () => {
    const service = await import(
      "@/features/access-requests/services/access-requests-service"
    )

    await service.reviewRecoveryRequest(
      "11111111-1111-1111-1111-111111111111",
      "approved",
      "SenhaTemporaria123!"
    )

    expect(invokeMock).toHaveBeenCalledWith("admin-recovery-review", {
      body: {
        decision: "approved",
        requestId: "11111111-1111-1111-1111-111111111111",
        temporaryPassword: "SenhaTemporaria123!",
      },
    })
  })
})
