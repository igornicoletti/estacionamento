import { describe, expect, it } from "vitest"

import {
  erpClientRowSchema,
  erpClientVehicleRowSchema,
} from "@/features/clients/schemas/clients-gateway-schemas"

describe("clients gateway schemas", () => {
  it("coerces safe ERP identifiers without accepting lossy numbers", () => {
    const result = erpClientRowSchema.parse({
      bloqueio_financeiro: "N",
      cod_pessoa: "1001",
      des_email_1: null,
      dta_cadastro: null,
      dta_ultima_compra: null,
      ind_pessoa_ativa: "S",
      is_active_120d: true,
      nom_cidade: null,
      nom_fantasia: null,
      nom_pessoa: "Cliente válido",
      num_cnpj_cpf: null,
      num_telefone_1: null,
      qtd_veiculos: "0",
      sgl_estado: null,
    })

    expect(result.cod_pessoa).toBe(1001)
    expect(result.qtd_veiculos).toBe(0)
    expect(
      erpClientRowSchema.safeParse({
        ...result,
        cod_pessoa: Number.MAX_SAFE_INTEGER + 1,
      }).success
    ).toBe(false)
  })

  it("rejects vehicles without a valid client, vehicle or plate", () => {
    expect(
      erpClientVehicleRowSchema.safeParse({
        cod_pessoa: 0,
        cod_veiculo: 1,
        des_veiculo: null,
        nom_fantasia: null,
        nom_motorista: null,
        nom_pessoa: "Cliente válido",
        num_cnpj_cpf: null,
        num_placa: "",
      }).success
    ).toBe(false)
  })

  it("normalizes legacy Brazilian plate punctuation", () => {
    const result = erpClientVehicleRowSchema.parse({
      cod_pessoa: 1001,
      cod_veiculo: 5001,
      des_veiculo: null,
      nom_fantasia: null,
      nom_motorista: null,
      nom_pessoa: "Cliente válido",
      num_cnpj_cpf: null,
      num_placa: "abc-1234",
    })

    expect(result.num_placa).toBe("ABC1234")
  })
})
