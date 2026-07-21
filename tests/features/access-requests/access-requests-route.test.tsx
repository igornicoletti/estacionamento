import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

const invokeMock = vi.fn()
const fromMock = vi.fn()

const recoveryRequestsRows = [
  {
    created_at: "2026-07-05T09:30:00Z",
    description: "Troquei de aparelho e perdi o acesso ao autenticador.",
    email: "pessoa@empresa.com",
    email_matches_account: false,
    id: "11111111-1111-1111-1111-111111111111",
    phone_matches_account: false,
    phone_masked: "(11) 98765-4321",
    reason: "lost_phone",
    target_account_found: true,
    target_user_name: "Fulano Cadastrado",
  },
  {
    created_at: "2026-07-04T09:30:00Z",
    description: "Erro no aplicativo autenticador",
    email: "",
    id: "22222222-2222-2222-2222-222222222222",
    phone_display: "Daniel",
    phone_masked: "Dado indisponível",
    reason: "other",
    target_account_found: null,
  },
]

vi.mock("@/lib/supabase-browser", () => {
  return {
    getSupabaseBrowserClient: () => ({
      from: fromMock,
      functions: {
        invoke: invokeMock,
      },
    }),
  }
})

function createRecoveryRequestsQueryChain(rows: typeof recoveryRequestsRows) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => Promise.resolve({ data: rows, error: null }),
  }

  return chain
}

function LocationProbe() {
  const location = useLocation()

  return (
    <span data-testid="location">
      {location.pathname}
      {location.search}
    </span>
  )
}

describe("AccessRequestsRoute", () => {
  beforeEach(async () => {
    const { clearAsyncSnapshotCache } = await import("@/hooks/use-async-snapshot")

    clearAsyncSnapshotCache()
    invokeMock.mockReset()
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => {
      if (table === "access_recovery_requests") {
        return createRecoveryRequestsQueryChain(recoveryRequestsRows)
      }

      throw new Error(`Unexpected table: ${table}`)
    })
  })

  it("renders pending recovery rows", async () => {
    const { AccessRequestsRoute } = await import("@/features/access-requests")

    render(
      <MemoryRouter>
        <AccessRequestsRoute />
      </MemoryRouter>
    )

    expect(
      screen.getByRole("heading", { name: "Solicitações de acesso" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("(11) *****-4321")).toBeInTheDocument()
    })
    expect(screen.getByText("Solicitante")).toBeInTheDocument()
    expect(screen.getAllByText("pessoa@empresa.com").length).toBeGreaterThan(0)
    expect(screen.getByText("Fulano Cadastrado")).toBeInTheDocument()
    expect(screen.getByText("Erro no aplicativo autenticador")).toBeInTheDocument()
    expect(screen.getByText("Contato divergente")).toBeInTheDocument()
    expect(screen.getAllByText("Não verificado").length).toBeGreaterThan(0)
    expect(screen.queryByText("Descrição")).not.toBeInTheDocument()
    expect(screen.queryByText("Da***el")).not.toBeInTheDocument()
  }, 15_000)

  it("filters access requests by reason with counters", async () => {
    const { AccessRequestsRoute } = await import("@/features/access-requests")

    const { baseElement } = render(
      <MemoryRouter>
        <AccessRequestsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Erro no aplicativo autenticador")).toBeInTheDocument()
    })

    const reasonFilter = screen.getByRole("combobox", { name: "Motivos" })

    fireEvent.click(reasonFilter)
    fireEvent.keyDown(reasonFilter, { key: "ArrowDown" })

    await waitFor(() => {
      const content = baseElement.querySelector('[data-slot="combobox-content"]')
      const items = Array.from(
        content?.querySelectorAll('[data-slot="combobox-item"]') ?? []
      )
      const otherReason = items.find((item) =>
        item.textContent?.includes("Outro motivo")
      )

      expect(otherReason?.textContent).toContain("1")
    })
  }, 15_000)

  it("submits a recovery review action", async () => {
    invokeMock.mockResolvedValue({ data: { message: "ok" }, error: null })

    const { AccessRequestsRoute } = await import("@/features/access-requests")

    render(
      <MemoryRouter>
        <AccessRequestsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("(11) *****-4321")).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])
    fireEvent.click(await screen.findByRole("menuitem", { name: "Aprovar" }))

    const temporaryPasswordField = await screen.findByLabelText(/Senha temporária/)
    fireEvent.change(temporaryPasswordField, {
      target: { value: "SenhaTemporaria123!" },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Aprovar solicitação" })
    )

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("admin-recovery-review", {
        body: {
          decision: "approved",
          requestId: "11111111-1111-1111-1111-111111111111",
          temporaryPassword: "SenhaTemporaria123!",
        },
      })
    })
  })

  it("submits a recovery denial action after destructive confirmation", async () => {
    invokeMock.mockResolvedValue({ data: { message: "ok" }, error: null })

    const { AccessRequestsRoute } = await import("@/features/access-requests")

    render(
      <MemoryRouter>
        <AccessRequestsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("(11) *****-4321")).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])
    fireEvent.click(await screen.findByRole("menuitem", { name: "Negar" }))

    expect(screen.getByRole("heading", { name: "Negar solicitação" })).toBeInTheDocument()
    expect(invokeMock).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }))

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("admin-recovery-review", {
        body: {
          decision: "denied",
          requestId: "11111111-1111-1111-1111-111111111111",
        },
      })
    })
  })

  it("redirects the legacy route to the users access requests tab", async () => {
    const { AccessRequestsRedirectRoute } = await import("@/features/access-requests")

    render(
      <MemoryRouter initialEntries={["/solicitacoes-acesso"]}>
        <Routes>
          <Route
            path="/solicitacoes-acesso"
            element={<AccessRequestsRedirectRoute />}
          />
          <Route path="/usuarios" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/usuarios?tab=solicitacoes"
    )
  })
})
