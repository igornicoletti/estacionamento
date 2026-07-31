import { type PermissionMatrixRow } from "../model"
import { getPermissionsGateway } from "./permissions-gateway"

export async function listPermissionMatrix(): Promise<PermissionMatrixRow[]> {
  return getPermissionsGateway().listMatrix()
}
