import { type PermissionMatrixWirePayload } from "../schemas/permissions-gateway-schema"

export interface PermissionsGateway {
  listMatrix(): Promise<PermissionMatrixWirePayload>
}
