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
      expect(screen.getByText("Auditoria - Consultar")).toBeInTheDocument()
    })
  })

  it("opens permission details showing the capability key", async () => {
    render(<PermissionsRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Auditoria - Consultar",
    })

    fireEvent.click(trigger)

    expect(await screen.findByText("Detalhes da permissão")).toBeInTheDocument()
    expect(screen.getByText("Chave")).toBeInTheDocument()
    expect(screen.getAllByText("Auditoria - Consultar").length).toBeGreaterThan(0)
  })
})
