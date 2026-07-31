import { type ClientsGateway } from "@/features/clients/services/clients-gateway"
import {
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "@/features/clients/model"

const seedClients: readonly ErpClientPayload[] = [
  {
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
    sgl_estado: "SP",
  },
]

const seedVehicles: readonly ErpClientVehiclePayload[] = [
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

export function createMemoryClientsGateway(): ClientsGateway {
  return {
    listClientsPayload: () => Promise.resolve(seedClients),
    listClientPayloadById: (clientId) =>
      Promise.resolve(seedClients.find((client) => client.cod_pessoa === clientId) ?? null),
    listClientVehiclesPayload: () => Promise.resolve(seedVehicles),
    listClientVehiclesPayloadByClientId: (clientId) =>
      Promise.resolve(
        seedVehicles.filter((vehicle) => vehicle.cod_pessoa === clientId)
      ),
  }
}
