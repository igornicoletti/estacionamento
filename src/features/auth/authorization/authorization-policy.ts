import type { AuthCapability } from "./auth-capabilities"
import type { UserRole } from "./auth-roles"

const selfServiceCapabilities = [
  "profile.readSelf",
  "profile.updateSelf",

  "sessions.readSelf",
  "sessions.revokeSelf",

  "passkeys.readSelf",
  "passkeys.manageSelf",
] as const satisfies readonly AuthCapability[]

const adminReadCapabilities = [
  "admin.clients.read",
  "admin.vehicles.read",
  "admin.units.read",
  "admin.users.read",
] as const satisfies readonly AuthCapability[]

const adminManageCapabilities = [
  "admin.clients.manage",
  "admin.vehicles.manage",
  "admin.units.manage",
  "admin.users.create",
  "admin.users.update",
  "admin.users.disable",
  "admin.users.resetAccess",
] as const satisfies readonly AuthCapability[]

export const roleCapabilities = {
  owner: [
    "audit.read",
    "security.permissions.read",
    ...adminReadCapabilities,
    ...adminManageCapabilities,
    ...selfServiceCapabilities,
  ],

  admin: [
    "audit.read",
    "security.permissions.read",
    ...adminReadCapabilities,
    ...adminManageCapabilities,
    ...selfServiceCapabilities,
  ],

  auditor: [
    "audit.read",
    "security.permissions.read",
    ...adminReadCapabilities,
    ...selfServiceCapabilities,
  ],

  manager: [
    ...selfServiceCapabilities,
  ],

  operator: [
    ...selfServiceCapabilities,
  ],
} as const satisfies Record<UserRole, readonly AuthCapability[]>

export const routeCapabilities = {
  audit: ["audit.read"],
  clients: ["admin.clients.read"],
  clientVehicles: ["admin.vehicles.read"],
  notifications: ["profile.readSelf"],
  permissions: ["security.permissions.read"],
  profile: ["profile.readSelf"],
  settings: ["profile.readSelf"],
  units: ["admin.units.read"],
  users: ["admin.users.read"],
} as const satisfies Record<string, readonly AuthCapability[]>

export type AuthorizedRouteId = keyof typeof routeCapabilities
