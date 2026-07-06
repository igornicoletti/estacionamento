import { afterEach, describe, expect, it } from "vitest"

import {
  configureUnitsGateway,
  listUnits,
  resetUnitsGateway,
} from "@/features/units"

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
          },
        ]
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
})
