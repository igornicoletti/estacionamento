import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MyProfileRoute } from "@/features/my-profile"

describe("MyProfileRoute", () => {
  it("renders editable profile and avatar dialog", async () => {
    render(<MyProfileRoute />)

    expect(screen.getByRole("heading", { name: "Meu perfil" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Informações da conta")).toBeInTheDocument()
    })

    expect(screen.getByText("Foto do perfil")).toBeInTheDocument()
    expect(screen.getByDisplayValue("529.982.247-25")).toBeDisabled()
    expect(screen.getByLabelText("Nome")).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Alterar foto" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getAllByText(/PNG, JPG ou WebP até 5 MB/i).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })
})
