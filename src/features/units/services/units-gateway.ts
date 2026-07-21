import { z } from "zod"

import { isErpCatalogMockEnabled, mockErpUnitsPayload } from "@/features/erp-mock"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { unitsCopy } from "../constants/units-copy"
import { type ErpUnitPayload } from "../model"

export interface UnitsGateway {
  listUnitsPayload: () => Promise<readonly ErpUnitPayload[]>
}

const unitPayloadColumns = [
  "cod_empresa",
  "nom_razao_social",
  "nom_fantasia",
  "num_cnpj",
  "cod_bandeira",
  "des_bandeira",
  "cod_cidade",
  "nom_cidade",
  "nom_estado",
  "sgl_estado",
  "des_coordenada_empresa",
  "ip_rede",
  "nom_banco_dados",
] as const

const numericPayloadValueSchema = z.union([z.number(), z.string()])
const nullableNumericPayloadValueSchema = numericPayloadValueSchema.nullable()
const nullableStringPayloadValueSchema = z.string().nullable()

const erpUnitPayloadSchema = z.object({
  cod_empresa: numericPayloadValueSchema,
  nom_razao_social: nullableStringPayloadValueSchema,
  nom_fantasia: nullableStringPayloadValueSchema,
  num_cnpj: nullableStringPayloadValueSchema,
  cod_bandeira: nullableNumericPayloadValueSchema,
  des_bandeira: nullableStringPayloadValueSchema,
  cod_cidade: nullableNumericPayloadValueSchema,
  nom_cidade: nullableStringPayloadValueSchema,
  nom_estado: nullableStringPayloadValueSchema,
  sgl_estado: nullableStringPayloadValueSchema,
  des_coordenada_empresa: nullableStringPayloadValueSchema,
  ip_rede: nullableStringPayloadValueSchema,
  nom_banco_dados: nullableStringPayloadValueSchema,
})

const erpUnitsPayloadSchema = z.array(erpUnitPayloadSchema)
const supabaseResponseSchema = z.object({
  data: z.unknown().nullable(),
  error: z.unknown().nullable(),
}).passthrough()

function parseSupabaseResponse(value: unknown) {
  const result = supabaseResponseSchema.safeParse(value)

  if (!result.success) {
    throw new Error(unitsCopy.errors.unitsLoad, { cause: result.error })
  }

  if (result.data.error) {
    throw new Error(unitsCopy.errors.unitsLoad, { cause: result.data.error })
  }

  return result.data.data
}

function parseErpRows(value: unknown): readonly ErpUnitPayload[] {
  const result = erpUnitsPayloadSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(unitsCopy.errors.unitsLoad, { cause: result.error })
  }

  return result.data.map((row) => ({
    cod_empresa: row.cod_empresa,
    nom_razao_social: row.nom_razao_social ?? "",
    nom_fantasia: row.nom_fantasia ?? "",
    num_cnpj: row.num_cnpj ?? "",
    cod_bandeira: row.cod_bandeira ?? 0,
    des_bandeira: row.des_bandeira ?? "",
    cod_cidade: row.cod_cidade ?? 0,
    nom_cidade: row.nom_cidade ?? "",
    nom_estado: row.nom_estado ?? "",
    sgl_estado: row.sgl_estado ?? "",
    des_coordenada_empresa: row.des_coordenada_empresa ?? "",
    ip_rede: row.ip_rede ?? "",
    nom_banco_dados: row.nom_banco_dados ?? "",
  }))
}

function createSupabaseUnitsGateway(): UnitsGateway {
  return {
    async listUnitsPayload() {
      if (isErpCatalogMockEnabled()) {
        return mockErpUnitsPayload
      }

      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(unitsCopy.errors.unitsUnavailable)
      }

      const response: unknown = await supabase
        .from("erp_units")
        .select(unitPayloadColumns.join(","))
        .order("cod_empresa", { ascending: true })
      const data = parseSupabaseResponse(response)

      return parseErpRows(data)
    },
  }
}

let unitsGateway: UnitsGateway = createSupabaseUnitsGateway()

export function getUnitsGateway() {
  return unitsGateway
}

export function configureUnitsGateway(gateway: UnitsGateway) {
  unitsGateway = gateway
}

export function resetUnitsGateway() {
  unitsGateway = createSupabaseUnitsGateway()
}
