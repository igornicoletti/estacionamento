import { beforeEach, describe, expect, it, vi } from "vitest"

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib")>()

  return {
    ...actual,
    getSupabaseBrowserClient: () => ({ rpc: rpcMock }),
  }
})

import { savePriceTable } from "@/features/prices/services/prices-service"

describe("prices write contract", () => {
  beforeEach(() => {
    rpcMock.mockReset()
    rpcMock.mockResolvedValue({ data: null, error: null })
  })

  it("maps the product global scope to the database network enum", async () => {
    await savePriceTable({
      amount: 30,
      cycleHours: 24,
      endsAt: null,
      graceMinutes: 15,
      notes: null,
      scope: "global",
      startsAt: "2026-08-01T12:00:00.000Z",
      status: "active",
      toleranceMinutes: 10,
      unitId: null,
      unitName: null,
    })

    expect(rpcMock).toHaveBeenCalledWith(
      "create_commercial_price_table",
      expect.objectContaining({
        p_scope: "network",
        p_status: "active",
      }),
    )
  })
})
