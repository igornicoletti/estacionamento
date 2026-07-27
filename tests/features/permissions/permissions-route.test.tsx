import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PermissionsRoute } from "@/features/permissions"

const auditPermissionLabel = "Auditoria - Consultar"

async function findAuditPermissionTrigger() {
  const searchInput = await screen.findByLabelText("Buscar permissões...")

  fireEvent.change(searchInput, {
    target: {
      value: auditPermissionLabel,
    },
  })

  return screen.findByRole("button", {
    name: auditPermissionLabel,
  })
}

describe("PermissionsRoute", () => {
  it("renders the permissions matrix header and capabilities", async () => {
    render(<PermissionsRoute />)

    expect(
      screen.getByRole("heading", { name: "Perfil e Permissões" })
    ).toBeInTheDocument()

    expect(await findAuditPermissionTrigger()).toBeInTheDocument()
  })

  it("opens permission details showing the capability key", async () => {
    render(<PermissionsRoute />)

    const trigger = await findAuditPermissionTrigger()

    fireEvent.click(trigger)

    expect(
      await screen.findByText("Detalhes da permissão")
    ).toBeInTheDocument()

    expect(screen.getByText("Chave")).toBeInTheDocument()

    expect(
      screen.getAllByText(auditPermissionLabel).length
    ).toBeGreaterThan(0)
  })
})
