import { z } from "zod"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { permissionsCopy } from "../constants"
import { parsePermissionMatrixResponse } from "../model/permissions-parsers"
import { type PermissionMatrixRow } from "../model"

export interface PermissionsGateway {
  listMatrix(): Promise<PermissionMatrixRow[]>
}

const invokeResponseSchema = z.object({
  data: z.unknown(),
  error: z.unknown().nullable(),
})

function createSupabasePermissionsGateway(): PermissionsGateway {
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
      const result = invokeResponseSchema.safeParse(response)

      if (!result.success || result.data.error) {
        throw new Error(permissionsCopy.error.load, {
          cause: result.success ? result.data.error : result.error,
        })
      }

      return parsePermissionMatrixResponse(result.data.data).permissions
    },
  }
}

let permissionsGateway: PermissionsGateway = createSupabasePermissionsGateway()

export function configurePermissionsGateway(gateway: PermissionsGateway) {
  permissionsGateway = gateway
}

export function getPermissionsGateway() {
  return permissionsGateway
}

export function resetPermissionsGateway() {
  permissionsGateway = createSupabasePermissionsGateway()
}
