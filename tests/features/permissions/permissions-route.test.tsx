import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PermissionsRoute } from "@/features/permissions"

describe("PermissionsRoute", () => {
  it("renders the permissions matrix header and capabilities", async () => {
    render(<PermissionsRoute />)

    expect(
      screen.getByRole("heading", { name: "Perfil e Permissões" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Visualizar auditoria" })
      ).toBeInTheDocument()
    })

    expect(screen.getAllByText("Visualizar auditoria").length).toBeGreaterThan(0)
  }, 15_000)

  it("opens permission details without exposing technical identifiers", async () => {
    render(<PermissionsRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Visualizar auditoria",
    })

    fireEvent.click(trigger)

    expect(screen.getByText("Grupo: Auditoria")).toBeInTheDocument()
    expect(screen.getAllByText("Perfis com acesso").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Perfis sem acesso").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Visualizar auditoria").length).toBeGreaterThan(0)
    expect(screen.queryByText("Chave da permissão")).not.toBeInTheDocument()
    expect(screen.queryByText("audit.read")).not.toBeInTheDocument()
    expect(screen.getAllByLabelText("Perfil com acesso").length).toBeGreaterThan(0)
  })
})
