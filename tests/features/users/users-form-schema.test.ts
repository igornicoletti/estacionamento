import { describe, expect, it } from "vitest"

import { usersCopy } from "@/features/users/constants/users-copy"
import {
  createDefaultUsersFormValues,
  getUsersFormFieldErrors,
  mapUserToUsersFormValues,
  usersFormSchema,
} from "@/features/users/schemas/users-form-schema"
import type { UserRecord } from "@/features/users"

const editingUser: UserRecord = {
  authUserId: "user-auth-id",
  cpf: "529.982.247-25",
  email: "pessoa@example.com",
  id: "USR-001",
  lastAccessAt: null,
  lockedUntil: null,
  name: "Pessoa Usuária",
  passkeyCount: 1,
  passkeyStatus: "active",
  phoneMasked: "(11) 98888-7777",
  role: "manager",
  status: "active",
  unitId: "2",
  unitName: "Monte Carlo Norte",
}

describe("users form schema", () => {
  it("maps required create fields to their accessible field errors", () => {
    const result = usersFormSchema.safeParse(
      createDefaultUsersFormValues(["operator"])
    )

    expect(result.success).toBe(false)

    if (result.success) {
      return
    }

    const errors = getUsersFormFieldErrors(result.error)

    expect(typeof errors.cpf).toBe("string")
    expect(errors).toMatchObject({
      firstAccessPassword: usersCopy.errors.requiredFirstAccessPassword,
      name: usersCopy.errors.requiredName,
      phone: usersCopy.errors.requiredPhone,
      unitId: usersCopy.errors.requiredUnit,
    })
  })

  it("does not carry a first-access password into edit mode", () => {
    const values = mapUserToUsersFormValues(editingUser)
    const result = usersFormSchema.safeParse(values)

    expect(result.success).toBe(true)
    expect(values.firstAccessPassword).toBe("")
    expect(values.mode).toBe("edit")
  })
})
