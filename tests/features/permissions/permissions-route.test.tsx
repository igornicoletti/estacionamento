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
      expect(screen.getByText("Visualizar auditoria")).toBeInTheDocument()
    })
  })

  it("opens permission details showing the capability key", async () => {
    render(<PermissionsRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Visualizar auditoria",
    })

    fireEvent.click(trigger)

    expect(screen.getByText("Chave da permissão")).toBeInTheDocument()
    expect(screen.getAllByText("audit.read").length).toBeGreaterThan(0)
  })
})
