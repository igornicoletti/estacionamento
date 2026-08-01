export type ClientStatus = "ativo" | "inativo"

export interface Client {
  bloqueio_financeiro: boolean
  cod_pessoa: number
  des_email_1: string | null
  dta_cadastro: string | null
  dta_ultima_compra: string | null
  ind_pessoa_ativa: boolean
  nom_cidade: string
  nom_fantasia: string
  nom_pessoa: string
  num_cnpj_cpf: string | null
  num_telefone_1: string | null
  qtd_veiculos: number
  sgl_estado: string
}

export interface ClientTableRow extends Client {
  status: ClientStatus
}

export interface ClientVehicle {
  cod_pessoa: number
  cod_veiculo: number
  des_veiculo: string
  nom_fantasia: string
  nom_motorista: string
  nom_pessoa: string
  num_cnpj_cpf: string | null
  num_placa: string
}

export type ClientVehicleTableRow = ClientVehicle

export interface ClientVehiclesSnapshot {
  client: Client | null
  vehicles: ClientVehicleTableRow[]
}
