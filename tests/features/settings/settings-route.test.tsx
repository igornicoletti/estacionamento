import { render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SettingsRoute } from "@/features/settings"

describe("SettingsRoute", () => {
  it("renders profile, password and passkey sections with standardized copy", async () => {
    render(<SettingsRoute />)

    expect(screen.getByRole("heading", { name: "Configurações" })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Informações de perfil")).toBeInTheDocument()
    })

    expect(screen.getByText("Credenciais de acesso")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Alterar senha" })
    ).toBeInTheDocument()

    expect(
      screen.getByText("Passkey")
    ).toBeInTheDocument()
    expect(screen.getByText("Ativa")).toBeInTheDocument()
  })
})
