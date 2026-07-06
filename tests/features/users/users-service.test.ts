import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

import {
  configureUnitsGateway,
  resetUnitsGateway,
} from "@/features/units"
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
    configureUnitsGateway({
      listUnitsPayload() {
        return Promise.resolve([
          {
            cod_empresa: 2,
            nom_razao_social: "Posto Monte Carlo Norte Ltda",
            nom_fantasia: "Monte Carlo Norte",
            num_cnpj: "12.345.678/0001-90",
            cod_bandeira: 1,
            des_bandeira: "Monte Carlo",
            cod_cidade: 3550308,
            nom_cidade: "Sao Paulo",
            nom_estado: "Sao Paulo",
            sgl_estado: "SP",
            des_coordenada_empresa: "",
            ip_rede: "",
            nom_banco_dados: "",
          },
        ])
      },
    })
    resetUsersGateway()
    resetUsersInMemoryState()
  })

  afterEach(() => {
    resetUnitsGateway()
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
