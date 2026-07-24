import { sanitizeErpUnitsPayload } from "../utils/units-normalizers"
import { type ErpUnitPayload, type Unit } from "../types/units-types"

const simulatedErpUnitsPayload: ErpUnitPayload[] = [
  {
    cod_empresa: 1,
    nom_razao_social: " Posto Monte Carlo Centro Ltda ",
    nom_fantasia: "Monte Carlo Centro",
    num_cnpj: "00.000.000/0001-00",
    cod_bandeira: 10,
    des_bandeira: "Shell",
    cod_cidade: 3550308,
    nom_cidade: "São Paulo",
    nom_estado: "São Paulo",
    sgl_estado: "sp",
    des_coordenada_empresa: "-23.550520, -46.633308",
    ip_rede: "192.168.0.10",
    nom_banco_dados: "erp_montecarlo_centro",
  },
  {
    cod_empresa: "2",
    nom_razao_social: "Posto Monte Carlo Norte Ltda",
    nom_fantasia: "Monte Carlo Norte",
    num_cnpj: "00.000.000/0002-00",
    cod_bandeira: "20",
    des_bandeira: "Ipiranga",
    cod_cidade: "3304557",
    nom_cidade: "Rio de Janeiro",
    nom_estado: "Rio de Janeiro",
    sgl_estado: "rj",
    des_coordenada_empresa: "-22.906847, -43.172897",
    ip_rede: "192.168.1.10",
    nom_banco_dados: "erp_montecarlo_norte",
  },
  {
    cod_empresa: 3,
    nom_razao_social: "Posto Monte Carlo Sul Ltda",
    nom_fantasia: "Monte Carlo Sul",
    num_cnpj: "00.000.000/0003-00",
    cod_bandeira: 10,
    des_bandeira: "Shell",
    cod_cidade: 4106902,
    nom_cidade: "Curitiba",
    nom_estado: "Paraná",
    sgl_estado: "pr",
    des_coordenada_empresa: "-25.428954, -49.267137",
    ip_rede: "192.168.2.10",
    nom_banco_dados: "erp_montecarlo_sul",
  },
]

export async function listUnits(): Promise<Unit[]> {
  await Promise.resolve()
  return sanitizeErpUnitsPayload(simulatedErpUnitsPayload)
}
