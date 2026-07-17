import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { UsersRoute } from "@/features/users"

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

describe("UsersRoute", () => {
  beforeEach(async () => {
    const { clearAsyncSnapshotCache } = await import("@/hooks/use-async-snapshot")

    clearAsyncSnapshotCache()
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

  it("renders the users table and hides raw identifiers in details", async () => {
    render(
      <MemoryRouter>
        <UsersRoute />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Usuários" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Usuario Teste")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Usuario Teste" }))

    expect(screen.getByRole("heading", { name: "Usuario Teste" })).toBeInTheDocument()
    expect(screen.queryByText("ID")).not.toBeInTheDocument()
    expect(screen.queryByText("USR-001")).not.toBeInTheDocument()
    expect(screen.getAllByText("111.444.777-35").length).toBeGreaterThan(0)
    expect(screen.queryByText("***.***.***-25")).not.toBeInTheDocument()
    expect(screen.queryByText("MFA")).not.toBeInTheDocument()
    expect(screen.getAllByText("Passkey").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Ativa").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Inativa").length).toBeGreaterThan(0)
  })

  it("exibe validacoes obrigatorias ao submeter dialogo de cadastro vazio", async () => {
    render(
      <MemoryRouter>
        <UsersRoute />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Usuario Teste")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }))

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Novo usuário" })).toBeInTheDocument()
    })

    const form = document.getElementById("users-dialog-form")
    expect(form).toBeTruthy()

    fireEvent.submit(form as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByText("Informe o nome do usuário.")).toBeInTheDocument()
    })
  })

  it("exibe solicitações de acesso na aba de usuários", async () => {
    render(
      <MemoryRouter initialEntries={["/usuarios?tab=solicitacoes"]}>
        <UsersRoute />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Usuários" })).toBeInTheDocument()
    expect(
      screen.getByRole("tab", { name: "Solicitações de acesso" })
    ).toHaveAttribute("aria-selected", "true")

    await waitFor(() => {
      expect(screen.getByText("(11) 98765-4321")).toBeInTheDocument()
    })
  })
})
