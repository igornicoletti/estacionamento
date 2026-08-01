export interface Unit {
  cod_empresa: number
  nom_razao_social: string
  nom_fantasia: string
  num_cnpj: string
  cod_bandeira: number
  des_bandeira: string
  cod_cidade: number
  nom_cidade: string
  nom_estado: string
  sgl_estado: string
  des_coordenada_empresa: string
  ip_rede: string
  nom_banco_dados: string
}

export interface UnitYardConfig {
  unitId: string
  patioActive: boolean
  parkingSpots: number
  updatedAt: string
}

export interface UnitUserStats {
  managers: number
  operators: number
}
