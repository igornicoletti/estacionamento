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

describe("client-sync-service", () => {
  beforeEach(() => {
    vi.resetModules()
    invokeMock.mockReset()
  })

  it("blocks concurrent sync requests", async () => {
    invokeMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                runId: "run-1",
                status: "success",
                message: "ok",
              },
              error: null,
            })
          }, 20)
        })
    )

    const service = await import("@/features/clients/services/client-sync-service")

    const first = service.triggerClientsSync("incremental")
    const second = service.triggerClientsSync("incremental")

    await expect(second).rejects.toThrow("sync_in_progress")
    await expect(first).resolves.toMatchObject({ status: "success" })
  })
})
