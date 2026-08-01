import { type PermissionsGateway } from "@/features/permissions/gateways/permissions-gateway-contracts"
import {
  type PermissionMatrixWirePayload,
  type PermissionWireRow,
} from "@/features/permissions/schemas/permissions-gateway-schema"

const defaultRoles: PermissionMatrixWirePayload["roles"] = [
  { key: "owner", label: "Proprietário" },
  { key: "admin", label: "Administrador" },
  { key: "auditor", label: "Auditor" },
  { key: "manager", label: "Gestor" },
  { key: "operator", label: "Operador" },
]

const defaultPermission: PermissionWireRow = {
  description: "Permite visualizar eventos de auditoria.",
  key: "audit.read",
  label: "Visualizar auditoria",
  roleKeys: ["owner", "admin", "auditor"],
}

export function createPermissionWireRow(
  overrides: Partial<PermissionWireRow> = {}
): PermissionWireRow {
  return { ...defaultPermission, ...overrides }
}

export function createPermissionMatrixPayload(
  overrides: Partial<PermissionMatrixWirePayload> = {}
): PermissionMatrixWirePayload {
  return {
    ok: true,
    permissions: [createPermissionWireRow()],
    roles: defaultRoles.map((role) => ({ ...role })),
    ...overrides,
  }
}

export function createMemoryPermissionsGateway(
  payload: PermissionMatrixWirePayload = createPermissionMatrixPayload()
): PermissionsGateway {
  return {
    listMatrix: () => Promise.resolve(payload),
  }
}
