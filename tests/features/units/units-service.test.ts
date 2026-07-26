import { afterEach, describe, expect, it } from "vitest"

import {
  configureUnitsGateway,
  listUnits,
  resetUnitsGateway,
  type ErpUnitPayload,
} from "@/features/units"

const representativeErpUnitsPayload: ErpUnitPayload[] = [
  {
    cod_empresa: "1",
    nom_razao_social: "POSTO MONTE CARLO IGUATEMI LTDA",
    nom_fantasia: "IGUATEMI",
    num_cnpj: "21384959000148",
    cod_bandeira: "1",
    des_bandeira: "BR",
    cod_cidade: "3549805",
    nom_cidade: "SAO JOSE DO RIO PRETO",
    nom_estado: "SAO PAULO",
    sgl_estado: "sp",
    des_coordenada_empresa: "",
    ip_rede: "",
    nom_banco_dados: "",
  },
  {
    cod_empresa: "7",
    nom_razao_social: "AUTO POSTO MONTE CARLO ONDA VERDE LTDA",
    nom_fantasia: "ONDA VERDE",
    num_cnpj: "",
    cod_bandeira: "2",
    des_bandeira: "BR",
    cod_cidade: "0",
    nom_cidade: "ONDA VERDE",
    nom_estado: "SAO PAULO",
    sgl_estado: "sp",
    des_coordenada_empresa: "",
    ip_rede: "",
    nom_banco_dados: "",
  },
  {
    cod_empresa: "53",
    nom_razao_social: "POSTO MONTE CARLO PONTA GROSSA BR-376 LTDA",
    nom_fantasia: "PONTA GROSSA BR-376",
    num_cnpj: "",
    cod_bandeira: "3",
    des_bandeira: "IPIRANGA",
    cod_cidade: "0",
    nom_cidade: "PONTA GROSSA",
    nom_estado: "PARANA",
    sgl_estado: "pr",
    des_coordenada_empresa: "",
    ip_rede: "",
    nom_banco_dados: "",
  },
  {
    cod_empresa: "76",
    nom_razao_social: "POSTO MONTE CARLO CANDIDO MOTA LTDA",
    nom_fantasia: "CANDIDO MOTA",
    num_cnpj: "",
    cod_bandeira: "1",
    des_bandeira: "BR",
    cod_cidade: "0",
    nom_cidade: "CANDIDO MOTA",
    nom_estado: "SAO PAULO",
    sgl_estado: "sp",
    des_coordenada_empresa: "",
    ip_rede: "",
    nom_banco_dados: "",
  },
]

afterEach(() => {
  resetUnitsGateway()
})

describe("units-service", () => {
  it("supports gateway override for future persistence providers", async () => {
    configureUnitsGateway({
      async listUnitsPayload() {
        await Promise.resolve()
        return [
          {
            cod_empresa: "900",
            nom_razao_social: "Unidade de Teste",
            nom_fantasia: "Teste",
            num_cnpj: "",
            cod_bandeira: "1",
            des_bandeira: "Bandeira",
            cod_cidade: "1",
            nom_cidade: "Cidade",
            nom_estado: "Estado",
            sgl_estado: "sp",
            des_coordenada_empresa: "",
            ip_rede: "",
            nom_banco_dados: "erp_teste",
          } as const,
        ] as const
      },
    })

    const units = await listUnits()

    expect(units).toHaveLength(1)
    expect(units[0]).toMatchObject({
      cod_empresa: 900,
      nom_razao_social: "Unidade de Teste",
      sgl_estado: "SP",
    })
  })

  it("sanitizes ERP uppercase text and formats CNPJ before exposing units to UI", async () => {
    configureUnitsGateway({
      async listUnitsPayload() {
        await Promise.resolve()
        return [
          {
            cod_empresa: "7",
            nom_razao_social: "ONDA VERDE",
            nom_fantasia: "ONDA VERDE",
            num_cnpj: "05867856000182",
            cod_bandeira: "2",
            des_bandeira: "BR",
            cod_cidade: "0",
            nom_cidade: "SAO JOSE DO RIO PRETO",
            nom_estado: "SAO PAULO",
            sgl_estado: "sp",
            des_coordenada_empresa: "",
            ip_rede: "",
            nom_banco_dados: "",
          } as const,
        ] as const
      },
    })

    const units = await listUnits()

    expect(units[0]).toMatchObject({
      cod_empresa: 7,
      des_bandeira: "BR",
      nom_cidade: "São José do Rio Preto",
      nom_estado: "São Paulo",
      nom_fantasia: "Onda Verde",
      nom_razao_social: "Onda Verde",
      num_cnpj: "05.867.856/0001-82",
      sgl_estado: "SP",
    })
  })

  it("normalizes the real ERP units mock without exposing raw uppercase display values", async () => {
    configureUnitsGateway({
      async listUnitsPayload() {
        await Promise.resolve()
        return representativeErpUnitsPayload
      },
    })

    const units = await listUnits()

    expect(units).toHaveLength(4)
    expect(units.find((unit) => unit.cod_empresa === 1)).toMatchObject({
      nom_fantasia: "Iguatemi",
      nom_cidade: "São José do Rio Preto",
      num_cnpj: "21.384.959/0001-48",
    })
    expect(units.find((unit) => unit.cod_empresa === 7)).toMatchObject({
      nom_fantasia: "Onda Verde",
      nom_razao_social: "Auto Posto Monte Carlo Onda Verde Ltda",
    })
    expect(units.find((unit) => unit.cod_empresa === 53)).toMatchObject({
      nom_estado: "Paraná",
      nom_fantasia: "Ponta Grossa BR-376",
    })
    expect(units.find((unit) => unit.cod_empresa === 76)).toMatchObject({
      nom_cidade: "Cândido Mota",
    })
  })
})
