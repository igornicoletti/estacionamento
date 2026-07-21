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
    id: "11111111-1111-1111-1111-111111111111",
    phone_masked: "(11) 98765-4321",
    reason: "lost_phone",
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
    expect(
      screen.getByRole("button", { name: "Negar solicitação" })
    ).toBeEnabled()

    fireEvent.click(
      screen.getByRole("button", { name: "Negar solicitação" })
    )

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
