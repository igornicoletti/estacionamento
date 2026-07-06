import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import {
  resetUsersGateway,
  resetUsersInMemoryState,
} from "@/features/users/services/users-gateway"
import {
  createUser,
  listUsers,
} from "@/features/users/services/users-service"

describe("users service", () => {
  beforeEach(() => {
    resetUsersGateway()
    resetUsersInMemoryState()
  })

  it("creates a unit-scoped active user using canonical unitId", async () => {
    const createdUser = await createUser({
      cpf: "12345678909",
      email: "novo.usuario@rmc.local",
      firstAccessPassword: "Senha@123",
      name: "Novo Operador",
      phone: "11987654321",
      role: "operator",
      unitId: "2",
    })

    expect(createdUser.status).toBe("active")
    expect(createdUser.unitId).toBe("2")
    expect(createdUser.unitName).toBe("Monte Carlo Norte")

    const users = await listUsers()
    const persistedUser = users.find((user) => user.id === createdUser.id)

    expect(persistedUser).toBeDefined()
    expect(persistedUser?.unitId).toBe("2")
    expect(persistedUser?.unitName).toBe("Monte Carlo Norte")
  })
})
