import { z } from "zod"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import {
  CLIENTS_BATCH_SIZE,
  CLIENTS_MAX_BATCHES,
} from "../constants/clients-persistence"
import { clientsCopy } from "../constants/clients-copy"
import {
  type ErpClientPayload,
  type ErpClientVehiclePayload,
} from "../model"

export interface ClientsGateway {
  listClientVehiclesPayload: () => Promise<readonly ErpClientVehiclePayload[]>
  listClientPayloadById: (clientId: number) => Promise<ErpClientPayload | null>
  listClientVehiclesPayloadByClientId: (clientId: number) => Promise<readonly ErpClientVehiclePayload[]>
  listClientsPayload: () => Promise<readonly ErpClientPayload[]>
}

const clientPayloadColumns = [
  "cod_pessoa",
  "nom_pessoa",
  "nom_fantasia",
  "num_cnpj_cpf",
  "des_email_1",
  "num_telefone_1",
  "nom_cidade",
  "sgl_estado",
  "dta_cadastro",
  "ind_pessoa_ativa",
  "bloqueio_financeiro",
  "qtd_veiculos",
  "dta_ultima_compra",
  "is_active_120d",
] as const

const clientVehiclePayloadColumns = [
  "cod_veiculo",
  "cod_pessoa",
  "nom_pessoa",
  "nom_fantasia",
  "num_cnpj_cpf",
  "num_placa",
  "des_veiculo",
  "nom_motorista",
] as const

const numericPayloadValueSchema = z.union([z.number(), z.string()])
const nullableNumericPayloadValueSchema = numericPayloadValueSchema.nullable()
const nullableBooleanPayloadValueSchema = z.union([z.boolean(), z.string(), z.number()]).nullable()
const nullableStringPayloadValueSchema = z.string().nullable()

const erpClientPayloadSchema = z.object({
  bloqueio_financeiro: nullableStringPayloadValueSchema,
  cod_pessoa: numericPayloadValueSchema,
  des_email_1: nullableStringPayloadValueSchema,
  dta_cadastro: nullableStringPayloadValueSchema,
  dta_ultima_compra: nullableStringPayloadValueSchema,
  ind_pessoa_ativa: nullableStringPayloadValueSchema,
  is_active_120d: nullableBooleanPayloadValueSchema.optional(),
  nom_cidade: nullableStringPayloadValueSchema,
  nom_fantasia: nullableStringPayloadValueSchema,
  nom_pessoa: nullableStringPayloadValueSchema,
  num_cnpj_cpf: nullableStringPayloadValueSchema,
  num_telefone_1: nullableStringPayloadValueSchema,
  qtd_veiculos: nullableNumericPayloadValueSchema,
  sgl_estado: nullableStringPayloadValueSchema,
})

const erpClientVehiclePayloadSchema = z.object({
  cod_pessoa: numericPayloadValueSchema,
  cod_veiculo: numericPayloadValueSchema,
  des_veiculo: nullableStringPayloadValueSchema,
  nom_fantasia: nullableStringPayloadValueSchema,
  nom_motorista: nullableStringPayloadValueSchema,
  nom_pessoa: nullableStringPayloadValueSchema,
  num_cnpj_cpf: nullableStringPayloadValueSchema,
  num_placa: nullableStringPayloadValueSchema,
})

const erpClientsPayloadSchema = z.array(erpClientPayloadSchema)
const erpClientVehiclesPayloadSchema = z.array(erpClientVehiclePayloadSchema)
const supabaseResponseSchema = z.object({
  data: z.unknown().nullable(),
  error: z.unknown().nullable(),
}).passthrough()

function parseSupabaseResponse(value: unknown, errorMessage: string) {
  const result = supabaseResponseSchema.safeParse(value)

  if (!result.success) {
    throw new Error(errorMessage, { cause: result.error })
  }

  if (result.data.error) {
    throw new Error(errorMessage, { cause: result.data.error })
  }

  return result.data.data
}

function parseClientRows(value: unknown): readonly ErpClientPayload[] {
  const result = erpClientsPayloadSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(clientsCopy.errors.invalidClientsResponse, { cause: result.error })
  }

  return result.data.map((row) => ({
    bloqueio_financeiro: row.bloqueio_financeiro ?? "",
    cod_pessoa: row.cod_pessoa,
    des_email_1: row.des_email_1 ?? "",
    dta_cadastro: row.dta_cadastro ?? "",
    dta_ultima_compra: row.dta_ultima_compra ?? "",
    ind_pessoa_ativa: row.ind_pessoa_ativa ?? "",
    is_active_120d: row.is_active_120d ?? false,
    nom_cidade: row.nom_cidade ?? "",
    nom_fantasia: row.nom_fantasia ?? "",
    nom_pessoa: row.nom_pessoa ?? "",
    num_cnpj_cpf: row.num_cnpj_cpf ?? "",
    num_telefone_1: row.num_telefone_1 ?? "",
    qtd_veiculos: row.qtd_veiculos ?? 0,
    sgl_estado: row.sgl_estado ?? "",
  }))
}

function parseClientVehicleRows(value: unknown): readonly ErpClientVehiclePayload[] {
  const result = erpClientVehiclesPayloadSchema.safeParse(value ?? [])

  if (!result.success) {
    throw new Error(clientsCopy.errors.invalidVehiclesResponse, { cause: result.error })
  }

  return result.data.map((row) => ({
    cod_pessoa: row.cod_pessoa,
    cod_veiculo: row.cod_veiculo,
    des_veiculo: row.des_veiculo ?? "",
    nom_fantasia: row.nom_fantasia ?? "",
    nom_motorista: row.nom_motorista ?? "",
    nom_pessoa: row.nom_pessoa ?? "",
    num_cnpj_cpf: row.num_cnpj_cpf ?? "",
    num_placa: row.num_placa ?? "",
  }))
}

async function fetchAllBatches<TRow>(
  loader: (from: number, to: number) => Promise<readonly TRow[]>
) {
  const rows: TRow[] = []

  for (let batch = 0; batch < CLIENTS_MAX_BATCHES; batch += 1) {
    const from = batch * CLIENTS_BATCH_SIZE
    const to = from + CLIENTS_BATCH_SIZE - 1
    const chunk = await loader(from, to)

    rows.push(...chunk)

    if (chunk.length < CLIENTS_BATCH_SIZE) {
      return rows
    }
  }

  throw new Error(clientsCopy.errors.syncLimitExceeded)
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(clientsCopy.errors.clientsUnavailable)
  }

  return supabase
}

function createSupabaseClientsGateway(): ClientsGateway {
  return {
    async listClientsPayload() {
      const supabase = getSupabaseOrThrow()

      return fetchAllBatches<ErpClientPayload>(async (from, to) => {
        const response: unknown = await supabase
          .from("erp_clients")
          .select(clientPayloadColumns.join(","))
          .eq("is_active_120d", true)
          .order("cod_pessoa", { ascending: true })
          .range(from, to)
        const data = parseSupabaseResponse(response, clientsCopy.errors.clientsLoad)

        return parseClientRows(data)
      })
    },
    async listClientPayloadById(clientId) {
      const supabase = getSupabaseOrThrow()
      const response: unknown = await supabase
        .from("erp_clients")
        .select(clientPayloadColumns.join(","))
        .eq("cod_pessoa", clientId)
        .eq("is_active_120d", true)
        .maybeSingle()
      const data = parseSupabaseResponse(response, clientsCopy.errors.clientsLoad)

      if (!data) {
        return null
      }

      return parseClientRows([data])[0] ?? null
    },
    async listClientVehiclesPayload() {
      const supabase = getSupabaseOrThrow()

      return fetchAllBatches<ErpClientVehiclePayload>(async (from, to) => {
        const response: unknown = await supabase
          .from("erp_client_vehicles")
          .select(clientVehiclePayloadColumns.join(","))
          .eq("client_is_active_120d", true)
          .order("cod_veiculo", { ascending: true })
          .range(from, to)
        const data = parseSupabaseResponse(response, clientsCopy.errors.vehiclesLoad)

        return parseClientVehicleRows(data)
      })
    },
    async listClientVehiclesPayloadByClientId(clientId) {
      const supabase = getSupabaseOrThrow()
      const response: unknown = await supabase
        .from("erp_client_vehicles")
        .select(clientVehiclePayloadColumns.join(","))
        .eq("cod_pessoa", clientId)
        .eq("client_is_active_120d", true)
        .order("num_placa", { ascending: true })
      const data = parseSupabaseResponse(response, clientsCopy.errors.vehiclesLoad)

      return parseClientVehicleRows(data)
    },
  }
}

let clientsGateway: ClientsGateway = createSupabaseClientsGateway()

export function getClientsGateway() {
  return clientsGateway
}

export function configureClientsGateway(gateway: ClientsGateway) {
  clientsGateway = gateway
}

export function resetClientsGateway() {
  clientsGateway = createSupabaseClientsGateway()
}
