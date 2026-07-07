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

  it("invokes the phone-change review edge function", async () => {
    const service = await import(
      "@/features/access-requests/services/access-requests-service"
    )

    await service.reviewPhoneChange(
      "22222222-2222-2222-2222-222222222222",
      "approved"
    )

    expect(invokeMock).toHaveBeenCalledWith("admin-phone-change-review", {
      body: {
        decision: "approved",
        targetUserId: "22222222-2222-2222-2222-222222222222",
      },
    })
  })
})
