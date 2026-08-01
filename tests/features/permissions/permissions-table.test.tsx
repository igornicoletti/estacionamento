import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PermissionsTable } from "@/features/permissions/components/permissions-table"
import { PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY } from "@/features/permissions/constants/permissions-persistence"
import { toPermissionMatrix } from "@/features/permissions/model/permissions-models"
import {
  createPermissionMatrixPayload,
  createPermissionWireRow,
} from "../../helpers/permissions-memory-gateway"

const onOpenDetails = vi.fn()
const onRetry = vi.fn()

function renderPermissionsTable(
  permissions = [createPermissionWireRow()]
) {
  return render(
    <PermissionsTable
      error={null}
      isLoading={false}
      matrix={toPermissionMatrix(
        createPermissionMatrixPayload({ permissions })
      )}
      onOpenDetails={onOpenDetails}
      onRetry={onRetry}
    />
  )
}

describe("PermissionsTable", () => {
  beforeEach(() => {
    window.localStorage.clear()
    onOpenDetails.mockReset()
    onRetry.mockReset()
  })

  it("uses a feature-specific accessible name and semantic access icons", () => {
    renderPermissionsTable()

    expect(
      screen.getByRole("table", {
        name: /^Matriz de permissões por perfil\./,
      })
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole("img", { name: "Perfil com acesso" })
    ).toHaveLength(3)
    expect(
      screen.getAllByRole("img", { name: "Perfil sem acesso" })
    ).toHaveLength(2)
  })

  it("distinguishes an empty catalog from an empty filtered result", () => {
    const { rerender } = renderPermissionsTable([])

    expect(screen.getByText("Nenhuma permissão cadastrada")).toBeInTheDocument()

    rerender(
      <PermissionsTable
        error={null}
        isLoading={false}
        matrix={toPermissionMatrix(createPermissionMatrixPayload())}
        onOpenDetails={onOpenDetails}
        onRetry={onRetry}
      />
    )
    fireEvent.change(screen.getByLabelText("Buscar permissões..."), {
      target: { value: "capability inexistente" },
    })

    expect(screen.getByText("Nenhuma permissão encontrada")).toBeInTheDocument()
  })

  it("applies the compact default and restores persisted visibility", () => {
    const { unmount } = renderPermissionsTable()

    expect(
      screen.queryByRole("columnheader", { name: "Grupo" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: "Total de perfis" })
    ).not.toBeInTheDocument()

    unmount()
    window.localStorage.setItem(
      PERMISSIONS_TABLE_COLUMN_VISIBILITY_KEY,
      JSON.stringify({
        version: 2,
        state: {
          columnVisibility: { groupLabel: true, roleCount: false },
        },
      })
    )
    renderPermissionsTable()

    expect(
      screen.getByRole("columnheader", { name: "Grupo" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: "Total de perfis" })
    ).not.toBeInTheDocument()
  })

  it("forwards the observable details action", () => {
    renderPermissionsTable()

    fireEvent.click(
      screen.getByRole("button", { name: "Visualizar auditoria" })
    )

    expect(onOpenDetails).toHaveBeenCalledWith(
      expect.objectContaining({ key: "audit.read" })
    )
  })
})
