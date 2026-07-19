import {
  type Client,
  type ClientVehicle,
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "./clients-types"
import { readBoolean, readNumber, readString } from "./clients-parsers"

export function sanitizeErpClientPayload(payload: ErpClientPayload): Client {
  return {
    bloqueio_financeiro: readString(payload.bloqueio_financeiro).toLocaleUpperCase("pt-BR"),
    cod_pessoa: readNumber(payload.cod_pessoa),
    des_email_1: readString(payload.des_email_1).toLocaleLowerCase("pt-BR"),
    dta_cadastro: readString(payload.dta_cadastro),
    dta_ultima_compra: readString(payload.dta_ultima_compra),
    ind_pessoa_ativa: readString(payload.ind_pessoa_ativa).toLocaleUpperCase("pt-BR"),
    is_active_120d: readBoolean(payload.is_active_120d),
    nom_cidade: readString(payload.nom_cidade),
    nom_fantasia: readString(payload.nom_fantasia),
    nom_pessoa: readString(payload.nom_pessoa),
    num_cnpj_cpf: readString(payload.num_cnpj_cpf),
    num_telefone_1: readString(payload.num_telefone_1),
    qtd_veiculos: readNumber(payload.qtd_veiculos),
    sgl_estado: readString(payload.sgl_estado).toLocaleUpperCase("pt-BR"),
  }
}

export function sanitizeErpClientsPayload(payload: readonly ErpClientPayload[]) {
  return payload
    .map(sanitizeErpClientPayload)
    .filter((client) => client.cod_pessoa > 0 && client.nom_pessoa.length > 0)
}

export function sanitizeErpClientVehiclePayload(payload: ErpClientVehiclePayload): ClientVehicle {
  return {
    cod_pessoa: readNumber(payload.cod_pessoa),
    cod_veiculo: readNumber(payload.cod_veiculo),
    des_veiculo: readString(payload.des_veiculo),
    nom_fantasia: readString(payload.nom_fantasia),
    nom_motorista: readString(payload.nom_motorista),
    nom_pessoa: readString(payload.nom_pessoa),
    num_cnpj_cpf: readString(payload.num_cnpj_cpf),
    num_placa: readString(payload.num_placa).toLocaleUpperCase("pt-BR"),
  }
}

export function sanitizeErpClientVehiclesPayload(payload: readonly ErpClientVehiclePayload[]) {
  return payload
    .map(sanitizeErpClientVehiclePayload)
    .filter((vehicle) => vehicle.cod_veiculo > 0 && vehicle.cod_pessoa > 0)
}
