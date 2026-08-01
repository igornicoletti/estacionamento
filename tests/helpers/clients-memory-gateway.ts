import { type ClientsGateway } from "@/features/clients/gateways/clients-gateway-contracts"
import {
  type ErpClientRow,
  type ErpClientVehicleRow,
} from "@/features/clients/schemas/clients-gateway-schemas"

const seedClients: readonly ErpClientRow[] = [
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

const seedVehicles: readonly ErpClientVehicleRow[] = [
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
    findClientById: (clientId) =>
      Promise.resolve(seedClients.find((client) => client.cod_pessoa === clientId) ?? null),
    listClients: () => Promise.resolve(seedClients),
    listVehiclesByClientId: (clientId) =>
      Promise.resolve(
        seedVehicles.filter((vehicle) => vehicle.cod_pessoa === clientId)
      ),
  }
}
