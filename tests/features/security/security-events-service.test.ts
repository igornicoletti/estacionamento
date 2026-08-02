import { beforeEach, describe, expect, it, vi } from "vitest"

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({ rpc: rpcMock }),
}))

import { getCurrentSecurityEvents } from "@/features/security/services/security-events-service"

const validRow = {
  event_code: "password_changed",
  event_id: "00000000-0000-4000-8000-000000000001",
  occurred_at: "2026-08-01T12:00:00.000Z",
  severity: "info",
  success: true,
}

describe("security events service", () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it("maps allowlisted audit rows to user-facing events", async () => {
    rpcMock.mockResolvedValue({ data: [validRow], error: null })

    await expect(getCurrentSecurityEvents()).resolves.toEqual([
      {
        description: "A senha de acesso da conta foi alterada.",
        id: validRow.event_id,
        occurredAt: validRow.occurred_at,
        title: "Senha alterada",
        tone: "success",
      },
    ])
    expect(rpcMock).toHaveBeenCalledWith("get_current_security_events")
  })

  it("fails closed for unknown or oversized audit payloads", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ ...validRow, event_code: "client_synced" }],
      error: null,
    })

    await expect(getCurrentSecurityEvents()).rejects.toThrow(
      "Não foi possível carregar os eventos recentes."
    )

    rpcMock.mockResolvedValueOnce({
      data: Array.from({ length: 6 }, (_, index) => ({
        ...validRow,
        event_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      })),
      error: null,
    })

    await expect(getCurrentSecurityEvents()).rejects.toThrow(
      "Não foi possível carregar os eventos recentes."
    )
  })
})
