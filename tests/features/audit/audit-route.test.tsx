import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const auditEventsRows = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    occurred_at: "2026-07-02T13:42:11Z",
    scope: "system",
    event: "user_created",
    actor: "Igor Nicoletti",
    actor_user_id: "user-1",
    target: "Usuário",
    target_user_id: "user-2",
    success: true,
    severity: "info",
    reason: null,
    request_id: null,
    metadata: { role: "operator" },
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    occurred_at: "2026-07-02T13:05:47Z",
    scope: "login",
    event: "account_locked",
    actor: "Rede Monte Carlo",
    actor_user_id: null,
    target: "Usuário bloqueado",
    target_user_id: "user-3",
    success: false,
    severity: "warning",
    reason: "Excedeu o número de tentativas.",
    request_id: null,
    metadata: null,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    occurred_at: "2026-07-02T11:20:19Z",
    scope: "system",
    event: "unit.synced",
    actor: "sistema",
    actor_user_id: null,
    target: "Unidade",
    target_user_id: null,
    success: true,
    severity: "info",
    reason: null,
    request_id: "run-9",
    metadata: { mode: "incremental" },
  },
]

const fromMock = vi.fn()

vi.mock("@/lib/supabase-browser", () => {
  return {
    getSupabaseBrowserClient: () => ({
      from: fromMock,
    }),
  }
})

function createAuditEventsQueryChain(rows: typeof auditEventsRows) {
  const chain = {
    select: () => chain,
    order: () => chain,
    limit: () => Promise.resolve({ data: rows, error: null }),
  }

  return chain
}

describe("AuditRoute", () => {
  beforeEach(() => {
    fromMock.mockReset()
    fromMock.mockReturnValue(createAuditEventsQueryChain(auditEventsRows))
  })

  it("renders the audit header and loads real events from audit_events", async () => {
    const { AuditRoute } = await import("@/features/audit")

    render(<AuditRoute />)

    expect(
      screen.getByRole("heading", { name: "Auditoria" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Rede Monte Carlo")).toBeInTheDocument()
    })

    expect(fromMock).toHaveBeenCalledWith("audit_events")
  }, 15_000)

  it("opens event details from the responsible column", async () => {
    const { AuditRoute } = await import("@/features/audit")

    render(<AuditRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Igor Nicoletti",
    })

    fireEvent.click(trigger)

    expect(screen.getByText("Motivo")).toBeInTheDocument()
    expect(screen.getByText("Usuário criado · Igor Nicoletti")).toBeInTheDocument()
    expect(
      screen.queryByText("11111111-1111-1111-1111-111111111111")
    ).not.toBeInTheDocument()
  })
})
