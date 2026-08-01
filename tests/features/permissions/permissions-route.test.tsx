import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PermissionsRoute } from "@/features/permissions/routes/permissions-route"

const auditPermissionLabel = "Visualizar auditoria"

async function findAuditPermissionTrigger() {
  return screen.findByRole("button", {
    name: auditPermissionLabel,
  })
}

describe("PermissionsRoute", () => {
  it("renders the permissions matrix header and capabilities", async () => {
    render(<PermissionsRoute />)

    expect(
      screen.getByRole("heading", { name: "Perfis e permissões" })
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

    expect(screen.getByText("audit.read")).toBeInTheDocument()
  })
})
