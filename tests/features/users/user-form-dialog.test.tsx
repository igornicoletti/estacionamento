import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { UserFormDialog } from "@/features/users/components/user-form-dialog"
import { usersCopy } from "@/features/users/constants/users-copy"
import type { UserRecord } from "@/features/users"

const editingUser: UserRecord = {
  authUserId: "auth-user-1",
  cpf: "529.982.247-25",
  email: "usuario@example.com",
  id: "USR-001",
  lastAccessAt: null,
  lockedUntil: null,
  name: "Usuario Teste",
  passkeyCount: 1,
  passkeyStatus: "active",
  phoneMasked: "(11) 98888-7777",
  role: "owner",
  status: "active",
  unitId: null,
  unitName: null,
}

describe("UserFormDialog", () => {
  it("handles rejected submissions without leaking technical errors", async () => {
    const onOpenChange = vi.fn()
    const onSubmit = vi.fn().mockRejectedValue(
      new Error("Edge Function returned a non-2xx status code")
    )

    render(
      <UserFormDialog
        assignableRoleValues={["owner", "admin", "auditor", "manager", "operator"]}
        editingUser={editingUser}
        isSaving={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
        open
        unitCatalog={[]}
      />
    )

    const form = screen.getByRole("form", { name: usersCopy.dialogs.editTitle })
    expect(form).toBeInstanceOf(HTMLFormElement)
    expect(
      screen.queryByLabelText(/^Senha de primeiro acesso/)
    ).not.toBeInTheDocument()

    fireEvent.submit(form)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    expect(
      (await screen.findByText(usersCopy.feedback.update.error)).closest(
        '[role="alert"]'
      )
    ).not.toBeNull()
    expect(screen.queryByText(/Edge Function returned/i)).not.toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
