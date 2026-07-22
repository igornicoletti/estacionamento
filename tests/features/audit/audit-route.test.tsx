import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const auditEventsRows = [
  {
    id: "44444444-4444-4444-4444-444444444444",
    occurred_at: "2026-07-02T14:42:11Z",
    scope: "system",
    event: "client_synced",
    actor: "sistema",
    actor_user_id: null,
    target: "client_sync",
    target_user_id: null,
    success: false,
    severity: "critical",
    reason:
      "error sending request for url (https://hubapi.redemontecarlo.com.br/erp/cliente-veiculos/): client error (Connect): invalid peer certificate: NotValidForName",
    request_id: null,
    metadata: {
      mode: "incremental",
      runId: "0c0fdebe-44ba-444e-b68d-ba60566d8ac2",
      status: "failed",
      trigger: "manual",
    },
  },
  {
    id: "11111111-1111-1111-1111-111111111111",
    occurred_at: "2026-07-02T13:42:11Z",
    scope: "system",
    event: "user_created",
    actor: "Administrador Teste",
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
    event: "unit_synced",
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

  it("sanitizes sync audit details before rendering them", async () => {
    const { AuditRoute } = await import("@/features/audit")

    render(<AuditRoute />)

    await waitFor(() => {
      expect(screen.getByText("Sincronização de clientes")).toBeInTheDocument()
    })

    expect(screen.queryByText("client_sync")).not.toBeInTheDocument()

    const systemButtons = await screen.findAllByRole("button", { name: "Sistema" })

    fireEvent.click(systemButtons[0])

    expect(
      screen.getAllByText(
        "Não foi possível conectar ao serviço externo por falha na validação do certificado."
      ).length
    ).toBeGreaterThan(0)
    expect(screen.getByText("Modo")).toBeInTheDocument()
    expect(screen.getByText("Incremental")).toBeInTheDocument()
    expect(screen.getByText("Gatilho")).toBeInTheDocument()
    expect(screen.getByText("Manual")).toBeInTheDocument()
    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getAllByText("Falha").length).toBeGreaterThan(0)
    expect(screen.queryByText("NotValidForName")).not.toBeInTheDocument()
    expect(screen.queryByText("0c0fdebe-44ba-444e-b68d-ba60566d8ac2")).not.toBeInTheDocument()
  })

  it("renders audit filters in column order with counters", async () => {
    const { AuditRoute } = await import("@/features/audit")

    const { baseElement } = render(<AuditRoute />)

    await waitFor(() => {
      expect(screen.getByText("Rede Monte Carlo")).toBeInTheDocument()
    })

    expect(screen.getAllByLabelText("Responsável").length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText("Escopos").length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText("Eventos").length).toBeGreaterThan(0)
    expect(screen.queryByLabelText("Severidade")).not.toBeInTheDocument()

    const responsibleFilter = screen.getByRole("combobox", {
      name: "Responsável",
    })

    fireEvent.click(responsibleFilter)
    fireEvent.keyDown(responsibleFilter, { key: "ArrowDown" })

    await waitFor(() => {
      const content = baseElement.querySelector('[data-slot="combobox-content"]')
      const items = Array.from(
        content?.querySelectorAll('[data-slot="combobox-item"]') ?? []
      )
      const administratorOption = items.find((item) =>
        item.textContent?.includes("Administrador Teste")
      )

      expect(administratorOption?.textContent).toContain("1")
    })
  })

  it("opens event details from the responsible column", async () => {
    const { AuditRoute } = await import("@/features/audit")

    render(<AuditRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Administrador Teste",
    })

    fireEvent.click(trigger)

    expect(screen.getByRole("heading", { name: "Detalhes do evento" })).toBeInTheDocument()
    expect(
      screen.getByText("Consulte as informações registradas para o evento selecionado.")
    ).toBeInTheDocument()
    expect(screen.getByText("Motivo")).toBeInTheDocument()
    expect(screen.getByText("Perfil")).toBeInTheDocument()
    expect(screen.getByText("Operador")).toBeInTheDocument()
    expect(
      screen.queryByText("11111111-1111-1111-1111-111111111111")
    ).not.toBeInTheDocument()
    expect(screen.queryByText("operator")).not.toBeInTheDocument()
  })
})
