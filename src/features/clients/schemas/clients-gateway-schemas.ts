import { z } from "zod"

import { sourceSafeIntegerSchema } from "@/lib/schemas/source-safe-integer-schema"

const nullableTextSchema = z.string().nullable()
const vehiclePlateSchema = z
  .string()
  .transform((value) =>
    value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLocaleUpperCase("pt-BR")
  )
  .pipe(z.string().regex(/^[A-Z0-9]{7}$/))
const sourceFlagSchema = z.union([
  z.boolean(),
  z.number(),
  z.string(),
]).nullable()

export const erpClientRowSchema = z.object({
  bloqueio_financeiro: sourceFlagSchema,
  cod_pessoa: sourceSafeIntegerSchema({ minimum: 1 }),
  des_email_1: nullableTextSchema,
  dta_cadastro: nullableTextSchema,
  dta_ultima_compra: nullableTextSchema,
  ind_pessoa_ativa: sourceFlagSchema,
  is_active_120d: z.boolean(),
  nom_cidade: nullableTextSchema,
  nom_fantasia: nullableTextSchema,
  nom_pessoa: z.string().trim().min(1),
  num_cnpj_cpf: nullableTextSchema,
  num_telefone_1: nullableTextSchema,
  qtd_veiculos: sourceSafeIntegerSchema(),
  sgl_estado: nullableTextSchema,
})

export const erpClientVehicleRowSchema = z.object({
  cod_pessoa: sourceSafeIntegerSchema({ minimum: 1 }),
  cod_veiculo: sourceSafeIntegerSchema({ minimum: 1 }),
  des_veiculo: nullableTextSchema,
  nom_fantasia: nullableTextSchema,
  nom_motorista: nullableTextSchema,
  nom_pessoa: z.string().trim().min(1),
  num_cnpj_cpf: nullableTextSchema,
  num_placa: vehiclePlateSchema,
})

export const erpClientRowsSchema = z.array(erpClientRowSchema)
export const erpClientVehicleRowsSchema = z.array(
  erpClientVehicleRowSchema
)
export const erpClientCatalogRowSchema = erpClientRowSchema.pick({
  cod_pessoa: true,
  nom_fantasia: true,
  nom_pessoa: true,
  num_cnpj_cpf: true,
})
export const erpClientCatalogRowsSchema = z.array(
  erpClientCatalogRowSchema,
)
export const erpClientVehicleCatalogRowSchema =
  erpClientVehicleRowSchema.pick({
    cod_pessoa: true,
    cod_veiculo: true,
    des_veiculo: true,
    nom_fantasia: true,
    nom_pessoa: true,
    num_cnpj_cpf: true,
    num_placa: true,
  })
export const erpClientVehicleCatalogRowsSchema = z.array(
  erpClientVehicleCatalogRowSchema,
)

export type ErpClientRow = z.infer<typeof erpClientRowSchema>
export type ErpClientVehicleRow = z.infer<
  typeof erpClientVehicleRowSchema
>
export type ErpClientCatalogRow = z.infer<
  typeof erpClientCatalogRowSchema
>
export type ErpClientVehicleCatalogRow = z.infer<
  typeof erpClientVehicleCatalogRowSchema
>
