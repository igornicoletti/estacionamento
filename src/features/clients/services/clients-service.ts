import {
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclesPayload,
} from "../utils/clients-normalizers"
import {
  type Client,
  type ClientVehicle,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "../types/clients-types"

const simulatedErpClientsPayload: ErpClientPayload[] = [
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
  },
  {
    cod_pessoa: "1002",
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
  },
  {
    cod_pessoa: 1003,
    nom_pessoa: "Marcos da Silva",
    nom_fantasia: "",
    num_cnpj_cpf: "123.456.789-00",
    des_email_1: "",
    num_telefone_1: "(41) 98888-7777",
    nom_cidade: "Curitiba",
    sgl_estado: "pr",
    dta_cadastro: "2022-08-10",
    ind_pessoa_ativa: "N",
    bloqueio_financeiro: "N",
    qtd_veiculos: 1,
    dta_ultima_compra: "2025-12-02",
  },
]

const simulatedErpClientVehiclesPayload: ErpClientVehiclePayload[] = [
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
  {
    cod_veiculo: "5003",
    cod_pessoa: "1002",
    nom_pessoa: "Transportes Beta S/A",
    nom_fantasia: "Transportes Beta",
    num_cnpj_cpf: "98.765.432/0001-77",
    num_placa: "IJK7L89",
    des_veiculo: "Volvo Fh 540",
    nom_motorista: "Ricardo Souza",
  },
  {
    cod_veiculo: 5004,
    cod_pessoa: 1003,
    nom_pessoa: "Marcos da Silva",
    nom_fantasia: "",
    num_cnpj_cpf: "123.456.789-00",
    num_placa: "MNO0P12",
    des_veiculo: "Honda Civic 2.0",
    nom_motorista: "Marcos da Silva",
  },
]

export async function listClients(): Promise<Client[]> {
  await Promise.resolve()
  return sanitizeErpClientsPayload(simulatedErpClientsPayload)
}

export async function listClientVehicles(): Promise<ClientVehicle[]> {
  await Promise.resolve()
  return sanitizeErpClientVehiclesPayload(simulatedErpClientVehiclesPayload)
}
