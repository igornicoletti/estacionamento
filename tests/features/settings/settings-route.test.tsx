import { render, screen, waitFor } from "@testing-library/react"
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
    expect(screen.getByDisplayValue("***.***.***-25")).toBeDisabled()
    expect(screen.getByText("Segurança e credenciais")).toBeInTheDocument()
    expect(screen.getByText("Alterações auditadas")).toBeInTheDocument()
    expect(screen.getByText("Passkey")).toBeInTheDocument()
    expect(screen.getByText("Ativa")).toBeInTheDocument()
  })
})
