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

  it("cadastra um usuário com perfil global pelo formulário", async () => {
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

    fireEvent.change(screen.getByLabelText("Nome*"), {
      target: { value: "Nova Administradora" },
    })
    fireEvent.change(screen.getByLabelText("CPF*"), {
      target: { value: "52998224725" },
    })
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "nova.admin@example.com" },
    })
    fireEvent.change(screen.getByLabelText("Telefone*"), {
      target: { value: "11988887777" },
    })
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Perfil" }), {
      key: "ArrowDown",
    })
    fireEvent.click(await screen.findByRole("option", { name: "Administrador" }))
    fireEvent.change(screen.getByLabelText("Senha de primeiro acesso*"), {
      target: { value: "SenhaForte123!" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }))

    await waitFor(() => {
      expect(screen.getByText("Nova Administradora")).toBeInTheDocument()
    })
    expect(
      screen.queryByRole("heading", { name: "Novo usuário" })
    ).not.toBeInTheDocument()
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
      expect(screen.getByText("(11) *****-4321")).toBeInTheDocument()
    })
    expect(screen.getByText("Solicitante")).toBeInTheDocument()
    expect(screen.getByText("Fulano Cadastrado")).toBeInTheDocument()
    expect(screen.getByText("Erro no aplicativo autenticador")).toBeInTheDocument()
    expect(screen.getByText("Contato divergente")).toBeInTheDocument()
    expect(screen.queryByText("Da***el")).not.toBeInTheDocument()
  })
})
