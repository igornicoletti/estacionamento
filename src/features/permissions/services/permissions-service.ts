import { getPermissionsGateway } from "../gateways/permissions-gateway"
import { toPermissionMatrix } from "../model/permissions-models"
import { type PermissionMatrix } from "../model/permissions-types"

export async function listPermissionMatrix(): Promise<PermissionMatrix> {
  const payload = await getPermissionsGateway().listMatrix()

  return toPermissionMatrix(payload)
}
