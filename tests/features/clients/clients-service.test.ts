import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  listClients,
  listClientVehicles,
} from "@/features/clients/services/clients-service"
import {
  configureClientsGateway,
  resetClientsGateway,
} from "@/features/clients/services/clients-gateway"

describe("clients-service", () => {
  beforeEach(() => {
    configureClientsGateway({
      listClientPayloadById: (clientId) =>
        Promise.resolve(clientId === 1001 ? clientPayload : null),
      listClientVehiclesPayload: () => Promise.resolve(vehiclePayload),
      listClientVehiclesPayloadByClientId: (clientId) =>
        Promise.resolve(
          vehiclePayload.filter((vehicle) => vehicle.cod_pessoa === clientId)
        ),
      listClientsPayload: () => Promise.resolve([clientPayload]),
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

  it("returns vehicles linked to client code", async () => {
    const vehicles = await listClientVehicles()
    const linkedVehicles = vehicles.filter((vehicle) => vehicle.cod_pessoa === 1001)

    expect(linkedVehicles).toHaveLength(1)
    expect(linkedVehicles[0]).toMatchObject({
      cod_veiculo: 5001,
      cod_pessoa: 1001,
      num_placa: "ABC1D23",
    })
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
