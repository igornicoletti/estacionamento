import { afterEach, describe, expect, it } from "vitest"

import {
  configureClientsGateway,
  resetClientsGateway,
} from "@/features/clients/services/clients-gateway"
import {
  listClients,
  listClientVehicles,
} from "@/features/clients/services/clients-service"

afterEach(() => {
  resetClientsGateway()
})

describe("clients-service", () => {
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

    expect(linkedVehicles).toHaveLength(2)
    expect(linkedVehicles[0]).toMatchObject({
      cod_veiculo: 5001,
      cod_pessoa: 1001,
      num_placa: "ABC1D23",
    })
  })

  it("accepts a custom gateway implementation for future persistence layers", async () => {
    configureClientsGateway({
      async listClientsPayload() {
        await Promise.resolve()
        return [
          {
            cod_pessoa: "9001",
            nom_pessoa: "Cliente de Teste",
            nom_fantasia: "",
            num_cnpj_cpf: "",
            des_email_1: "",
            num_telefone_1: "",
            nom_cidade: "",
            sgl_estado: "sp",
            dta_cadastro: "",
            ind_pessoa_ativa: "S",
            bloqueio_financeiro: "N",
            qtd_veiculos: "0",
            dta_ultima_compra: "",
          },
        ]
      },
      async listClientVehiclesPayload() {
        await Promise.resolve()
        return []
      },
    })

    const clients = await listClients()

    expect(clients).toHaveLength(1)
    expect(clients[0]).toMatchObject({
      cod_pessoa: 9001,
      nom_pessoa: "Cliente de Teste",
      sgl_estado: "SP",
    })
  })
})
