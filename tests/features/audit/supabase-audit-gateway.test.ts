import { beforeEach, describe, expect, it, vi } from "vitest"

import { createAuditEventRow } from "../../helpers/audit-memory-gateway"

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
}))

describe("Supabase audit gateway", () => {
  beforeEach(() => {
    vi.resetModules()
    supabaseMock.from.mockReset()
    vi.doMock("@/lib/supabase-browser", () => ({
      getSupabaseBrowserClient: () => ({ from: supabaseMock.from }),
    }))
  })

  it("uses a deterministic bounded query and converts the extra row into truncation", async () => {
    const rows = Array.from({ length: 501 }, (_, index) =>
      createAuditEventRow({
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      })
    )
    const query = {
      order: vi.fn(),
      range: vi.fn().mockResolvedValue({ data: rows, error: null }),
      select: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    supabaseMock.from.mockReturnValue(query)

    const { createSupabaseAuditGateway } = await import(
      "@/features/audit/gateways/supabase-audit-gateway"
    )
    const result = await createSupabaseAuditGateway().listEvents()

    expect(supabaseMock.from).toHaveBeenCalledWith("audit_events")
    expect(query.order).toHaveBeenNthCalledWith(1, "occurred_at", {
      ascending: false,
    })
    expect(query.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: false,
    })
    expect(query.range).toHaveBeenCalledWith(0, 500)
    expect(result.rows).toHaveLength(500)
    expect(result.isTruncated).toBe(true)
  })

  it("fails closed when Supabase returns an invalid payload", async () => {
    const query = {
      order: vi.fn(),
      range: vi.fn().mockResolvedValue({
        data: [{ ...createAuditEventRow(), occurred_at: "invalid" }],
        error: null,
      }),
      select: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.order.mockReturnValue(query)
    supabaseMock.from.mockReturnValue(query)

    const { createSupabaseAuditGateway } = await import(
      "@/features/audit/gateways/supabase-audit-gateway"
    )

    await expect(createSupabaseAuditGateway().listEvents()).rejects.toThrow(
      "Não foi possível carregar a trilha de auditoria."
    )
  })
})
