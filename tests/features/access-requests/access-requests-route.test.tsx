import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
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

const pendingPhoneChangeRows = [
  {
    auth_user_id: "22222222-2222-2222-2222-222222222222",
    id: "33333333-3333-3333-3333-333333333333",
    name: "Mariana Souza",
    pending_phone_masked: "(11) 99999-0000",
    phone_masked: "(11) 98888-7777",
    updated_at: "2026-07-05T10:45:00Z",
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

function createPendingPhoneChangesQueryChain(rows: typeof pendingPhoneChangeRows) {
  const chain = {
    select: () => chain,
    not: () => chain,
    order: () => Promise.resolve({ data: rows, error: null }),
  }

  return chain
}

describe("AccessRequestsRoute", () => {
  beforeEach(() => {
    invokeMock.mockReset()
    fromMock.mockReset()
    fromMock.mockImplementation((table: string) => {
      if (table === "access_recovery_requests") {
        return createRecoveryRequestsQueryChain(recoveryRequestsRows)
      }

      if (table === "app_users") {
        return createPendingPhoneChangesQueryChain(pendingPhoneChangeRows)
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
      expect(screen.getByText("(11) 98765-4321")).toBeInTheDocument()
    })
  })

  it("submits a recovery review action", async () => {
    invokeMock.mockResolvedValue({ data: { message: "ok" }, error: null })

    const { AccessRequestsRoute } = await import("@/features/access-requests")

    render(
      <MemoryRouter>
        <AccessRequestsRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("(11) 98765-4321")).toBeInTheDocument()
    })

    fireEvent.pointerDown(screen.getAllByLabelText("Abrir ações da linha")[0])
    fireEvent.click(await screen.findByRole("menuitem", { name: "Aprovar" }))

    const reviewReasonField = await screen.findByLabelText("Motivo da análise")
    fireEvent.change(reviewReasonField, {
      target: { value: "Solicitação validada pela equipe administrativa." },
    })
    fireEvent.click(
      screen.getByRole("button", { name: "Aprovar solicitação" })
    )

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("admin-recovery-review", {
        body: {
          decision: "approved",
          requestId: "11111111-1111-1111-1111-111111111111",
          reviewReason: "Solicitação validada pela equipe administrativa.",
        },
      })
    })
  })
})
