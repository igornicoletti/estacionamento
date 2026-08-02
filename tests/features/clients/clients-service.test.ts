import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  resetClientsGateway,
  setClientsGateway,
} from "@/features/clients/gateways/clients-gateway"
import {
  findClientById,
  listClients,
  listClientVehiclesByClientId,
  searchClients,
  searchClientVehicles,
} from "@/features/clients/services/clients-service"

describe("clients-service", () => {
  beforeEach(() => {
    setClientsGateway({
      findClientById: (clientId) =>
        Promise.resolve(clientId === 1001 ? clientPayload : null),
      listClients: () => Promise.resolve([clientPayload]),
      searchClients: () => Promise.resolve([clientPayload]),
      searchVehicles: () => Promise.resolve(vehiclePayload),
      listVehiclesByClientId: (clientId) =>
        Promise.resolve(
          vehiclePayload.filter((vehicle) => vehicle.cod_pessoa === clientId)
        ),
    })
  })

  afterEach(() => {
    resetClientsGateway()
  })

  it("returns clients with normalized and typed fields", async () => {
    const clients = await listClients()

    expect(clients.length).toBeGreaterThan(0)
    expect(clients[0]).toMatchObject({
      cod_pessoa: 1001,
      nom_pessoa: "Auto Center Alfa Ltda",
      sgl_estado: "SP",
      qtd_veiculos: 2,
    })
  })

  it("formats uppercase ERP text before exposing it to the table", async () => {
    setClientsGateway({
      findClientById: () => Promise.resolve(null),
      listClients: () =>
        Promise.resolve([
          {
            ...clientPayload,
            nom_cidade: "SÃO PAULO",
            nom_fantasia: "AUTO CENTER ALFA",
            nom_pessoa: "AUTO CENTER ALFA LTDA",
          },
        ]),
      searchClients: () => Promise.resolve([]),
      searchVehicles: () => Promise.resolve([]),
      listVehiclesByClientId: () => Promise.resolve([]),
    })

    await expect(listClients()).resolves.toEqual([
      expect.objectContaining({
        nom_cidade: "São Paulo",
        nom_fantasia: "Auto Center Alfa",
        nom_pessoa: "Auto Center Alfa LTDA",
      }),
    ])
  })

  it("returns vehicles linked to client code", async () => {
    const linkedVehicles = await listClientVehiclesByClientId(1001)

    expect(linkedVehicles).toHaveLength(1)
    expect(linkedVehicles[0]).toMatchObject({
      cod_veiculo: 5001,
      cod_pessoa: 1001,
      num_placa: "ABC1D23",
    })
  })

  it("searches synchronized client and vehicle catalogs", async () => {
    await expect(searchClients("Auto Center")).resolves.toHaveLength(1)
    await expect(searchClientVehicles("ABC1D23")).resolves.toHaveLength(1)
    await expect(searchClients("A")).resolves.toEqual([])
    await expect(searchClientVehicles("A")).resolves.toEqual([])
  })

  it("returns one client through the direct lookup contract", async () => {
    await expect(findClientById(1001)).resolves.toMatchObject({
      cod_pessoa: 1001,
      nom_pessoa: "Auto Center Alfa Ltda",
    })
    await expect(findClientById(9999)).resolves.toBeNull()
  })
})

const clientPayload = {
  bloqueio_financeiro: "N",
  cod_pessoa: 1001,
  des_email_1: "contato@alfa.com.br",
  dta_cadastro: "2024-01-15",
  dta_ultima_compra: "2026-06-20",
  ind_pessoa_ativa: "S",
  is_active_120d: true,
  nom_cidade: "Sao Paulo",
  nom_fantasia: "Auto Center Alfa",
  nom_pessoa: "Auto Center Alfa Ltda",
  num_cnpj_cpf: "12.345.678/0001-10",
  num_telefone_1: "(11) 3333-4444",
  qtd_veiculos: 2,
  sgl_estado: "sp",
}

const vehiclePayload = [
  {
    cod_pessoa: 1001,
    cod_veiculo: 5001,
    des_veiculo: "Fiat Strada 1.4",
    nom_fantasia: "Auto Center Alfa",
    nom_motorista: "Joao Carlos",
    nom_pessoa: "Auto Center Alfa Ltda",
    num_cnpj_cpf: "12.345.678/0001-10",
    num_placa: "ABC1D23",
  },
]
