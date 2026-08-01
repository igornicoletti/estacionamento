import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  resetUnitsGateway,
  setUnitsGateway,
} from "@/features/units/gateways/units-gateway"
import {
  resetUsersGateway,
  setUsersGateway,
} from "@/features/users/gateways/users-gateway"
import {
  blockUser,
  createUser,
  listUsers,
  loadUsersWorkspace,
} from "@/features/users/services/users-service"
import type { UserRecord } from "@/features/users"
import { createMemoryUsersGateway } from "../../helpers/users-memory-gateway"

const existingUser: UserRecord = {
  authUserId: "auth-existing-user",
  cpf: "529.982.247-25",
  email: "existing.user@example.com",
  id: "USR-001",
  lastAccessAt: null,
  lockedUntil: null,
  name: "Existing User",
  passkeyCount: 0,
  passkeyStatus: "inactive",
  phoneMasked: "(11) 98888-7777",
  role: "operator",
  status: "active",
  unitId: "2",
  unitName: "Monte Carlo Norte",
}

describe("users service", () => {
  beforeEach(() => {
    setUnitsGateway({
      findUnitById(unitId) {
        return Promise.resolve(unitId === 2 ? unitRow : null)
      },
      listUnits() {
        return Promise.resolve([
          unitRow,
        ])
      },
    })
    resetUsersGateway()
    setUsersGateway(createMemoryUsersGateway())
  })

  afterEach(() => {
    resetUnitsGateway()
  })

  it("creates a unit-scoped active user using canonical unitId", async () => {
    const createdUser = await createUser({
      cpf: "12345678909",
      email: "novo.usuario@rmc.local",
      firstAccessPassword: "SenhaForte123!",
      name: "Novo Operador",
      phone: "11987654321",
      role: "operator",
      unitId: "2",
    })

    expect(createdUser.status).toBe("pending")
    expect(createdUser.unitId).toBe("2")
    expect(createdUser.unitName).toBe("Monte Carlo Norte")

    const users = await listUsers()
    const persistedUser = users.find((user) => user.id === createdUser.id)

    expect(persistedUser).toBeDefined()
    expect(persistedUser?.unitId).toBe("2")
    expect(persistedUser?.unitName).toBe("Monte Carlo Norte")
  })

  it("blocks weak first-access passwords before calling the backend", async () => {
    await expect(
      createUser({
        cpf: "12345678909",
        email: "novo.usuario@rmc.local",
        firstAccessPassword: "Senha@123",
        name: "Novo Operador",
        phone: "11987654321",
        role: "operator",
        unitId: "2",
      })
    ).rejects.toThrow("A nova senha deve ter pelo menos 12 caracteres.")
  })

  it("validates and rejects malformed input before invoking the gateway", async () => {
    const gateway = createMemoryUsersGateway()
    const createSpy = vi.spyOn(gateway, "create")
    setUsersGateway(gateway)

    await expect(
      createUser({
        cpf: "52998224725",
        email: "valid.user@example.com",
        firstAccessPassword: "SenhaForte123!",
        name: "X",
        phone: "11987654321",
        role: "owner",
      })
    ).rejects.toThrow("Informe um nome com pelo menos 3 caracteres.")

    expect(createSpy).not.toHaveBeenCalled()
  })

  it("rejects a unit scope that is not present in the canonical catalog", async () => {
    const gateway = createMemoryUsersGateway()
    const createSpy = vi.spyOn(gateway, "create")
    setUsersGateway(gateway)

    await expect(
      createUser({
        cpf: "52998224725",
        email: "valid.user@example.com",
        firstAccessPassword: "SenhaForte123!",
        name: "Valid User",
        phone: "11987654321",
        role: "operator",
        unitId: "999",
      })
    ).rejects.toThrow("Selecione uma unidade válida.")

    expect(createSpy).not.toHaveBeenCalled()
  })

  it("uses a supplied row identity without an extra identity lookup", async () => {
    const gateway = createMemoryUsersGateway([existingUser])
    const findIdentitySpy = vi.spyOn(gateway, "findIdentity")
    const blockSpy = vi.spyOn(gateway, "block")
    setUsersGateway(gateway)

    const blockedUser = await blockUser(existingUser)

    expect(findIdentitySpy).not.toHaveBeenCalled()
    expect(blockSpy).toHaveBeenCalledWith(existingUser.authUserId)
    expect(blockedUser.status).toBe("inactive")
  })

  it("keeps user data available when the optional unit catalog fails", async () => {
    setUnitsGateway({
      findUnitById: () => Promise.reject(new Error("unit backend unavailable")),
      listUnits() {
        return Promise.reject(new Error("unit backend unavailable"))
      },
    })
    setUsersGateway(createMemoryUsersGateway([existingUser]))

    const snapshot = await loadUsersWorkspace()

    expect(snapshot.users).toHaveLength(1)
    expect(snapshot.users[0]?.unitName).toBe(existingUser.unitName)
    expect(snapshot.unitCatalog).toEqual([])
    expect(snapshot.unitCatalogError).toBeInstanceOf(Error)
  })
})

const unitRow = {
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
} as const
