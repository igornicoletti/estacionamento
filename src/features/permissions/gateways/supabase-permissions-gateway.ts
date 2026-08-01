import { z } from "zod"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { permissionsCopy } from "../constants/permissions-copy"
import { permissionMatrixPayloadSchema } from "../schemas/permissions-gateway-schema"
import { type PermissionsGateway } from "./permissions-gateway-contracts"

const invokeResponseSchema = z
  .object({
    data: z.unknown(),
    error: z.unknown().nullable(),
  })
  .strict()

export function createSupabasePermissionsGateway(): PermissionsGateway {
  return {
    async listMatrix() {
      const supabase = getSupabaseBrowserClient()

      if (!supabase) {
        throw new Error(permissionsCopy.error.unavailable)
      }

      const response: unknown = await supabase.functions.invoke(
        "list-permission-matrix",
        { body: {} }
      )
      const invokeResult = invokeResponseSchema.safeParse(response)

      if (!invokeResult.success || invokeResult.data.error) {
        throw new Error(permissionsCopy.error.load, {
          cause: invokeResult.success
            ? invokeResult.data.error
            : invokeResult.error,
        })
      }

      const payload = permissionMatrixPayloadSchema.safeParse(
        invokeResult.data.data
      )

      if (!payload.success) {
        throw new Error(permissionsCopy.error.invalidResponse, {
          cause: payload.error,
        })
      }

      return payload.data
    },
  }
}
