export const USERS_DATA_SOURCE = {
  appUsersTable: "app_users",
  lastAccessRpc: "list_app_user_last_access",
} as const

export const USERS_EDGE_FUNCTION = {
  authFactors: "admin-user-auth-factors",
  block: "admin-user-block",
  clearLock: "admin-user-clear-lock",
  create: "admin-user-create",
  resetPasskey: "admin-user-reset-passkey",
  resetPassword: "admin-user-reset-password",
  revokeSessions: "admin-user-revoke-sessions",
  update: "admin-user-update",
} as const

export const USERS_LIST_SELECT =
  "id, auth_user_id, name, cpf_display, cpf_masked, email, phone_display, phone_masked, role, status, locked_until, app_user_units(unit_id)"

export const USER_IDENTITY_SELECT = "id, auth_user_id"
