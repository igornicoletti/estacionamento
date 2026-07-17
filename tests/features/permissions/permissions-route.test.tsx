import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  PermissionsRoute,
  createPermissionRoleAccess,
  type PermissionMatrixRow,
} from "@/features/permissions"

const { listPermissionMatrixMock } = vi.hoisted(() => ({
  listPermissionMatrixMock: vi.fn<() => Promise<PermissionMatrixRow[]>>(),
}))

vi.mock("@/features/permissions/services/permissions-service", () => ({
  listPermissionMatrix: listPermissionMatrixMock,
}))

const auditPermission: PermissionMatrixRow = {
  accessFilters: ["with_access", "without_access"],
  description: "Permite consultar eventos de auditoria.",
  groupKey: "audit",
  groupLabel: "Auditoria",
  id: "permission-audit-read",
  isCritical: true,
  key: "audit.read",
  label: "Visualizar auditoria",
  roleAccess: createPermissionRoleAccess(["owner", "admin", "auditor"]),
  roleCount: 3,
  roleLabels: "Proprietário, Administrador, Auditor",
  roles: ["owner", "admin", "auditor"],
  source: "system",
}

describe("PermissionsRoute", () => {
  beforeEach(() => {
    listPermissionMatrixMock.mockResolvedValue([auditPermission])
  })

  it("renders the permissions matrix header and capabilities", async () => {
    render(<PermissionsRoute />)

    expect(
      screen.getByRole("heading", { name: "Perfis e permissões" })
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Visualizar auditoria" })
      ).toBeInTheDocument()
    })

    expect(screen.getByText("Sistema")).toBeInTheDocument()
    expect(screen.getAllByLabelText("Origem").length).toBeGreaterThan(0)
    expect(screen.queryByLabelText("Perfis")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Acesso")).not.toBeInTheDocument()
    expect(screen.getAllByText("Visualizar auditoria").length).toBeGreaterThan(0)
  })

  it("opens permission details with role summaries", async () => {
    render(<PermissionsRoute />)

    const trigger = await screen.findByRole("button", {
      name: "Visualizar auditoria",
    })

    fireEvent.click(trigger)

    expect(screen.getAllByText("Grupo").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Auditoria").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Perfis com acesso").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Perfis sem acesso").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Visualizar auditoria").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Chave").length).toBeGreaterThan(0)
    expect(screen.getByText("Auditoria - Consultar")).toBeInTheDocument()
    expect(screen.queryByText("audit.read")).not.toBeInTheDocument()
    expect(screen.getAllByLabelText("Perfil com acesso").length).toBeGreaterThan(0)
  })
})
