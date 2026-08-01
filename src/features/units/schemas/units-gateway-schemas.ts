import { z } from "zod"

import { sourceSafeIntegerSchema } from "@/lib/schemas/source-safe-integer-schema"

const nullableTextSchema = z.string().nullable()

export const erpUnitRowSchema = z.object({
  cod_empresa: sourceSafeIntegerSchema({ minimum: 1 }),
  nom_razao_social: nullableTextSchema,
  nom_fantasia: nullableTextSchema,
  num_cnpj: nullableTextSchema,
  cod_bandeira: sourceSafeIntegerSchema(),
  des_bandeira: nullableTextSchema,
  cod_cidade: sourceSafeIntegerSchema(),
  nom_cidade: nullableTextSchema,
  nom_estado: nullableTextSchema,
  sgl_estado: nullableTextSchema,
  des_coordenada_empresa: nullableTextSchema,
  ip_rede: nullableTextSchema,
  nom_banco_dados: nullableTextSchema,
})

export const erpUnitRowsSchema = z.array(erpUnitRowSchema)

export const unitYardConfigRowSchema = z.object({
  unit_id: sourceSafeIntegerSchema({ minimum: 1 }),
  patio_active: z.boolean(),
  parking_spots: sourceSafeIntegerSchema(),
  updated_at: z.string().trim().min(1),
})

export const unitYardConfigRowsSchema = z.array(unitYardConfigRowSchema)

export const unitUserStatsRowSchema = z.object({
  unit_id: sourceSafeIntegerSchema({ minimum: 1 }),
  managers: sourceSafeIntegerSchema(),
  operators: sourceSafeIntegerSchema(),
})

export const unitUserStatsRowsSchema = z.array(unitUserStatsRowSchema)

export const unitUserStatsRpcResponseSchema = z.object({
  data: z.unknown(),
  error: z.unknown().nullable(),
})

export type ErpUnitRow = z.infer<typeof erpUnitRowSchema>
export type UnitYardConfigRow = z.infer<typeof unitYardConfigRowSchema>
export type UnitUserStatsRow = z.infer<typeof unitUserStatsRowSchema>
