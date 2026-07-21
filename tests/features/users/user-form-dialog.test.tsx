import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { UserFormDialog } from "@/features/users/components/user-form-dialog"
import { usersCopy } from "@/features/users/constants"
import type { UserRecord } from "@/features/users/model"

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
        unitOptions={[]}
      />
    )

    const form = document.getElementById("users-dialog-form")
    expect(form).toBeInstanceOf(HTMLFormElement)

    fireEvent.submit(form as HTMLFormElement)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByText(usersCopy.feedback.update.error)).toHaveAttribute(
      "role",
      "alert"
    )
    expect(screen.queryByText(/Edge Function returned/i)).not.toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })
})
