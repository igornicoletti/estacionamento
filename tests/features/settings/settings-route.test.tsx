import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SettingsRoute } from "@/features/settings"

describe("SettingsRoute", () => {
  it("renders editable profile, avatar and passkey sections with standardized copy", async () => {
    render(<SettingsRoute />)

    expect(screen.getByRole("heading", { name: "Meu perfil" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Informações da conta")).toBeInTheDocument()
    })

    expect(screen.getByText("Foto do perfil")).toBeInTheDocument()
    expect(screen.getByLabelText("Nome")).toBeEnabled()
    expect(screen.getByDisplayValue("529.982.247-25")).toBeDisabled()
    expect(screen.getByText("Segurança e credenciais")).toBeInTheDocument()
    expect(screen.getByText("Alterações auditadas")).toBeInTheDocument()
    expect(screen.getByText("Passkey")).toBeInTheDocument()
    expect(screen.getByText("Ativa")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Alterar foto" }))

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("PNG, JPG ou WebP até 5 MB")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })
})
