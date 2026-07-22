import {
  getSupabaseBrowserClient,
  getValidatedSupabaseAccessToken,
  readResponseErrorMessage,
} from "@/lib"

import { permissionsCopy } from "../constants"
import {
  parsePermissionMatrixResponse,
  type PermissionMatrixRow,
} from "../model"

export async function listPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(permissionsCopy.error.unavailable)
  }

  const accessToken = await getValidatedSupabaseAccessToken(supabase)

  if (!accessToken) {
    throw new Error(permissionsCopy.error.sessionRequired)
  }

  const matrixResponse = await supabase.functions.invoke("list-permission-matrix", {
    body: {},
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (matrixResponse.error) {
    const message = await readResponseErrorMessage(matrixResponse.error)

    throw new Error(message ?? permissionsCopy.error.load, {
      cause: matrixResponse.error,
    })
  }

  return parsePermissionMatrixResponse(matrixResponse.data).permissions
}
