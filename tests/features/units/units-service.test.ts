import { afterEach, describe, expect, it } from "vitest"

import {
  resetUnitsGateway,
  setUnitsGateway,
} from "@/features/units/gateways/units-gateway"
import { type ErpUnitRow } from "@/features/units/schemas/units-gateway-schemas"
import {
  findUnitById,
  listUnits,
} from "@/features/units/services/units-service"

const representativeErpUnits: ErpUnitRow[] = [
  createUnitRow({
    cod_empresa: 1,
    nom_cidade: "SAO JOSE DO RIO PRETO",
    nom_fantasia: "IGUATEMI",
    nom_razao_social: "POSTO MONTE CARLO IGUATEMI LTDA",
    num_cnpj: "21384959000148",
  }),
  createUnitRow({
    cod_empresa: 7,
    nom_cidade: "ONDA VERDE",
    nom_fantasia: "ONDA VERDE",
    nom_razao_social: "AUTO POSTO MONTE CARLO ONDA VERDE LTDA",
  }),
  createUnitRow({
    cod_empresa: 53,
    des_bandeira: "IPIRANGA",
    nom_cidade: "PONTA GROSSA",
    nom_estado: "PARANA",
    nom_fantasia: "PONTA GROSSA BR-376",
    nom_razao_social: "POSTO MONTE CARLO PONTA GROSSA BR-376 LTDA",
    sgl_estado: "pr",
  }),
  createUnitRow({
    cod_empresa: 76,
    nom_cidade: "CANDIDO MOTA",
    nom_fantasia: "CANDIDO MOTA",
    nom_razao_social: "POSTO MONTE CARLO CANDIDO MOTA LTDA",
  }),
]

afterEach(() => {
  resetUnitsGateway()
})

describe("units-service", () => {
  it("supports an injected persistence gateway", async () => {
    setUnitsGateway({
      findUnitById: () => Promise.resolve(null),
      listUnits: () =>
        Promise.resolve([
          createUnitRow({
            cod_empresa: 900,
            nom_fantasia: "Teste",
            nom_razao_social: "Unidade de Teste",
            sgl_estado: "sp",
          }),
        ]),
    })

    await expect(listUnits()).resolves.toEqual([
      expect.objectContaining({
        cod_empresa: 900,
        nom_razao_social: "Unidade de Teste",
        sgl_estado: "SP",
      }),
    ])
  })

  it("preserves ERP meaning while formatting technical fields", async () => {
    const row = createUnitRow({
      cod_empresa: 7,
      nom_cidade: "SAO JOSE DO RIO PRETO",
      nom_estado: "SAO PAULO",
      nom_fantasia: "ONDA VERDE",
      nom_razao_social: "ONDA VERDE",
      num_cnpj: "05867856000182",
      sgl_estado: "sp",
    })
    setUnitsGateway({
      findUnitById: () => Promise.resolve(row),
      listUnits: () => Promise.resolve([row]),
    })

    await expect(listUnits()).resolves.toEqual([
      expect.objectContaining({
        cod_empresa: 7,
        nom_cidade: "SAO JOSE DO RIO PRETO",
        nom_estado: "SAO PAULO",
        nom_fantasia: "ONDA VERDE",
        nom_razao_social: "ONDA VERDE",
        num_cnpj: "05.867.856/0001-82",
        sgl_estado: "SP",
      }),
    ])
  })

  it("uses a direct lookup instead of loading the complete catalog", async () => {
    let listCalled = false
    setUnitsGateway({
      findUnitById: (unitId) =>
        Promise.resolve(
          representativeErpUnits.find(
            (unit) => unit.cod_empresa === unitId
          ) ?? null
        ),
      listUnits: () => {
        listCalled = true
        return Promise.resolve(representativeErpUnits)
      },
    })

    await expect(findUnitById(53)).resolves.toMatchObject({
      cod_empresa: 53,
      nom_estado: "PARANA",
      nom_fantasia: "PONTA GROSSA BR-376",
    })
    expect(listCalled).toBe(false)
  })
})

function createUnitRow(
  overrides: Partial<ErpUnitRow>
): ErpUnitRow {
  return {
    cod_bandeira: 1,
    cod_cidade: 0,
    cod_empresa: 1,
    des_bandeira: "BR",
    des_coordenada_empresa: "",
    ip_rede: "",
    nom_banco_dados: "",
    nom_cidade: "SAO PAULO",
    nom_estado: "SAO PAULO",
    nom_fantasia: "MONTE CARLO",
    nom_razao_social: "POSTO MONTE CARLO LTDA",
    num_cnpj: "",
    sgl_estado: "sp",
    ...overrides,
  }
}
