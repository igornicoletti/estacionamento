export interface ErpClientPayload {
  cod_pessoa: unknown
  nom_pessoa: unknown
  nom_fantasia: unknown
  num_cnpj_cpf: unknown
  des_email_1: unknown
  num_telefone_1: unknown
  nom_cidade: unknown
  sgl_estado: unknown
  dta_cadastro: unknown
  ind_pessoa_ativa: unknown
  bloqueio_financeiro: unknown
  qtd_veiculos: unknown
  dta_ultima_compra: unknown
  is_active_120d?: unknown
}

export interface Client {
  cod_pessoa: number
  nom_pessoa: string
  nom_fantasia: string
  num_cnpj_cpf: string
  des_email_1: string
  num_telefone_1: string
  nom_cidade: string
  sgl_estado: string
  dta_cadastro: string
  ind_pessoa_ativa: string
  bloqueio_financeiro: string
  qtd_veiculos: number
  dta_ultima_compra: string
  is_active_120d: boolean
}

export interface ClientTableRow extends Client {
  status: "ativo" | "inativo"
  vip: VipFlag
}

export type VipFlag = "sim" | "nao"

export interface ErpClientVehiclePayload {
  cod_veiculo: unknown
  cod_pessoa: unknown
  nom_pessoa: unknown
  nom_fantasia: unknown
  num_cnpj_cpf: unknown
  num_placa: unknown
  des_veiculo: unknown
  nom_motorista: unknown
}

export interface ClientVehicle {
  cod_veiculo: number
  cod_pessoa: number
  nom_pessoa: string
  nom_fantasia: string
  num_cnpj_cpf: string
  num_placa: string
  des_veiculo: string
  nom_motorista: string
}

export interface ClientVehicleTableRow extends ClientVehicle {
  vip: VipFlag
}
