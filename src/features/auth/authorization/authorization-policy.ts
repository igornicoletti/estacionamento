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
  "admin.users.resetPassword",
  "admin.users.resetPasskey",
  "admin.users.clearLock",
  "admin.users.revokeSessions",
  "admin.users.export",
] as const satisfies readonly AuthCapability[]

export const roleCapabilities = {
  owner: [
    "audit.read",
    "commercial.prices.read",
    "commercial.rules.read",
    "security.permissions.read",
    ...adminReadCapabilities,
    ...adminManageCapabilities,
    ...selfServiceCapabilities,
  ],

  admin: [
    "audit.read",
    "commercial.prices.read",
    "commercial.rules.read",
    "security.permissions.read",
    ...adminReadCapabilities,
    ...adminManageCapabilities,
    ...selfServiceCapabilities,
  ],

  auditor: [
    "audit.read",
    "commercial.prices.read",
    "commercial.rules.read",
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
  accessRequests: ["admin.users.update"],
  audit: ["audit.read"],
  clients: ["admin.clients.read"],
  clientVehicles: ["admin.vehicles.read"],
  prices: ["commercial.prices.read"],
  notifications: ["profile.readSelf"],
  permissions: ["security.permissions.read"],
  profile: ["profile.readSelf"],
  rules: ["commercial.rules.read"],
  settings: ["profile.readSelf"],
  units: ["admin.units.read"],
  users: ["admin.users.read"],
} as const satisfies Record<string, readonly AuthCapability[]>

export type AuthorizedRouteId = keyof typeof routeCapabilities
