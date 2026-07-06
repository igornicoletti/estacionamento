import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"

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

beforeEach(() => {
  configureClientsGateway({
    async listClientsPayload() {
      await Promise.resolve()
      return [
        {
          cod_pessoa: 1001,
          nom_pessoa: "Auto Center Alfa Ltda",
          nom_fantasia: "Auto Center Alfa",
          num_cnpj_cpf: "12.345.678/0001-10",
          des_email_1: "contato@alfa.com.br",
          num_telefone_1: "(11) 3333-4444",
          nom_cidade: "Sao Paulo",
          sgl_estado: "sp",
          dta_cadastro: "2024-01-15",
          ind_pessoa_ativa: "S",
          bloqueio_financeiro: "N",
          qtd_veiculos: 2,
          dta_ultima_compra: "2026-06-20",
          is_active_120d: true,
        },
        {
          cod_pessoa: 1002,
          nom_pessoa: "Transportes Beta S/A",
          nom_fantasia: "Transportes Beta",
          num_cnpj_cpf: "98.765.432/0001-77",
          des_email_1: "financeiro@beta.com.br",
          num_telefone_1: "(21) 2222-1111",
          nom_cidade: "Rio de Janeiro",
          sgl_estado: "rj",
          dta_cadastro: "2023-11-01",
          ind_pessoa_ativa: "S",
          bloqueio_financeiro: "S",
          qtd_veiculos: 1,
          dta_ultima_compra: "2026-05-12",
          is_active_120d: true,
        },
      ]
    },
    async listClientVehiclesPayload() {
      await Promise.resolve()
      return [
        {
          cod_veiculo: 5001,
          cod_pessoa: 1001,
          nom_pessoa: "Auto Center Alfa Ltda",
          nom_fantasia: "Auto Center Alfa",
          num_cnpj_cpf: "12.345.678/0001-10",
          num_placa: "ABC1D23",
          des_veiculo: "Fiat Strada 1.4",
          nom_motorista: "Joao Carlos",
        },
        {
          cod_veiculo: 5002,
          cod_pessoa: 1001,
          nom_pessoa: "Auto Center Alfa Ltda",
          nom_fantasia: "Auto Center Alfa",
          num_cnpj_cpf: "12.345.678/0001-10",
          num_placa: "EFG4H56",
          des_veiculo: "Vw Saveiro 1.6",
          nom_motorista: "Pedro Alves",
        },
      ]
    },
  })
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
