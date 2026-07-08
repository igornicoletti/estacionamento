import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { UsersRoute } from "@/features/users"

describe("UsersRoute", () => {
  it("renders the users table and hides raw identifiers in details", async () => {
    render(
      <MemoryRouter>
        <UsersRoute />
      </MemoryRouter>
    )

    expect(screen.getByRole("heading", { name: "Usuários" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Ana Pereira")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "Ana Pereira" }))

    expect(screen.getByRole("heading", { name: "Ana Pereira" })).toBeInTheDocument()
    expect(screen.queryByText("ID")).not.toBeInTheDocument()
    expect(screen.queryByText("USR-001")).not.toBeInTheDocument()
    expect(screen.getAllByText("529.982.247-25").length).toBeGreaterThan(0)
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
      expect(screen.getByText("Ana Pereira")).toBeInTheDocument()
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
})
