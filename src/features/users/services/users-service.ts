import { shouldBypassAuthInDev } from "@/config"
import {
  isAppUserStatus,
  isUserRole,
  requiresSingleUnit,
} from "@/features/auth"
import { listUnits } from "@/features/units"
import {
  formatCpf,
  formatPhone,
  getSupabaseBrowserClient,
  onlyDigits,
} from "@/lib"

import {
  type CreateUserInput,
  type UpdateUserInput,
  type UserRecord,
} from "../types/users-types"
import { usersCopy } from "../users-copy"
import {
  createNextUserId,
  normalizeUnitScope,
  type UnitCatalogItem,
} from "../utils/users-models"
import { getUsersGateway } from "./users-gateway"

type RawAppUserUnitRow = {
  unit_id: string | null
}

type RawAppUserRow = {
  id: string
  auth_user_id: string
  cpf_display: string | null
  cpf_masked: string
  email: string | null
  name: string
  phone_display: string | null
  phone_masked: string
  role: string
  status: string
  phone_verified_at: string | null
  email_verified_at: string | null
  created_at: string
  app_user_units?: RawAppUserUnitRow[] | RawAppUserUnitRow | null
}

const RESET_ACCESS_REASON = "Reset solicitado pelo painel administrativo."
const RESET_PASSKEY_REASON = "Reset de passkey solicitado pelo painel administrativo."
const CLEAR_LOCK_REASON = "Bloqueio removido pelo painel administrativo."
const REVOKE_SESSIONS_REASON = "Sessões revogadas pelo painel administrativo."
const BLOCK_USER_REASON = "Bloqueio aplicado pelo painel administrativo."
const LOCAL_ADMIN_ACTION_UNAVAILABLE_MESSAGE =
  "Esta ação só está disponível com o backend remoto configurado."

async function listUnitsCatalog(): Promise<UnitCatalogItem[]> {
  const units = await listUnits()

  return units.map((unit) => ({
    id: String(unit.cod_empresa),
    name: unit.nom_fantasia,
  }))
}

function isRemoteUsersEnabled() {
  if (import.meta.env.MODE === "test") {
    return false
  }

  return Boolean(getSupabaseBrowserClient()) && !shouldBypassAuthInDev()
}

function getRelatedUnitId(value: RawAppUserRow["app_user_units"]) {
  if (Array.isArray(value)) {
    return value[0]?.unit_id ?? null
  }

  if (value && typeof value === "object") {
    return value.unit_id ?? null
  }

  return null
}

type RawLastAccessRow = {
  auth_user_id: string
  last_sign_in_at: string | null
}

type RawAuthFactorRow = {
  auth_user_id: string
  has_verified_mfa_factor: boolean
  passkey_count: number
}

async function listLastAccessByAuthUserId(): Promise<Map<string, string | null>> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return new Map()
  }

  const response = await supabase.rpc("list_app_user_last_access")

  const { data, error } = response as {
    data: RawLastAccessRow[] | null
    error: unknown
  }

  if (error) {
    throw new Error(usersCopy.errors.load)
  }

  const rows = data ?? []

  return new Map(rows.map((row) => [row.auth_user_id, row.last_sign_in_at]))
}

async function listAuthFactorsByAuthUserId(): Promise<Map<string, RawAuthFactorRow>> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return new Map()
  }

  const response = await supabase.functions.invoke<{
    factors?: RawAuthFactorRow[]
  }>("admin-user-auth-factors")

  const { data, error } = response as {
    data: { factors?: RawAuthFactorRow[] } | null
    error: unknown
  }

  if (error || !data) {
    throw new Error(usersCopy.errors.load)
  }

  return new Map(
    (data.factors ?? []).map((factor) => [factor.auth_user_id, factor])
  )
}

async function listUsersFromSupabase(): Promise<UserRecord[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(usersCopy.errors.load)
  }

  const response = await supabase
    .from("app_users")
    .select(
      "id, auth_user_id, cpf_display, cpf_masked, email, name, phone_display, phone_masked, role, status, phone_verified_at, email_verified_at, created_at, app_user_units(unit_id)"
    )
    .order("created_at", { ascending: false })

  const {
    data,
    error,
  } = response as {
    data: RawAppUserRow[] | null
    error: unknown
  }

  if (error) {
    throw new Error(usersCopy.errors.load)
  }

  const unitsCatalog = await listUnitsCatalog()
  const lastAccessByAuthUserId = await listLastAccessByAuthUserId()
  const authFactorsByAuthUserId = await listAuthFactorsByAuthUserId()

  const unitNameById = new Map(unitsCatalog.map((unit) => [unit.id, unit.name]))

  return (data ?? []).flatMap((appUser) => {
    if (!isUserRole(appUser.role) || !isAppUserStatus(appUser.status)) {
      return []
    }

    const unitId = getRelatedUnitId(appUser.app_user_units)
    const hasVerifiedContact = Boolean(appUser.phone_verified_at || appUser.email_verified_at)
    const authFactors = authFactorsByAuthUserId.get(appUser.auth_user_id)
    const passkeyCount = authFactors?.passkey_count ?? 0
    const hasVerifiedAuthFactor =
      hasVerifiedContact ||
      Boolean(authFactors?.has_verified_mfa_factor) ||
      passkeyCount > 0

    return [
      {
        id: appUser.id,
        authUserId: appUser.auth_user_id,
        name: appUser.name,
        cpf: appUser.cpf_display || appUser.cpf_masked,
        email: appUser.email,
        phoneMasked: appUser.phone_display || appUser.phone_masked,
        role: appUser.role,
        status: appUser.status,
        unitId,
        unitName: unitId ? (unitNameById.get(unitId) ?? null) : null,
        mfaStatus: hasVerifiedAuthFactor ? "active" : "inactive",
        passkeyCount,
        lastAccessAt: lastAccessByAuthUserId.get(appUser.auth_user_id) ?? null,
      } satisfies UserRecord,
    ]
  })
}

async function createUserInSupabase(input: CreateUserInput): Promise<UserRecord> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(usersCopy.errors.create)
  }

  const unitsCatalog = await listUnitsCatalog()
  const normalizedUnitScope = normalizeUnitScope(input, unitsCatalog)
  const normalizedEmail = input.email?.trim() || ""
  const normalizedPhoneDigits = onlyDigits(input.phone ?? "")

  if (!normalizedPhoneDigits) {
    throw new Error(usersCopy.errors.requiredPhone)
  }

  const createResponse = await supabase.functions.invoke<{
    id?: string
    message?: string
  }>("admin-user-create", {
    body: {
      cpf: onlyDigits(input.cpf),
      email: normalizedEmail || undefined,
      hasOwnEmail: Boolean(normalizedEmail),
      name: input.name.trim(),
      phone: normalizedPhoneDigits,
      role: input.role,
      temporaryPassword: input.firstAccessPassword.trim(),
      unitId: normalizedUnitScope.unitId ?? undefined,
    },
  })

  const {
    data,
    error,
  } = createResponse as {
    data: { id?: string; message?: string } | null
    error: unknown
  }

  if (error) {
    throw new Error(usersCopy.errors.create)
  }

  const users = await listUsersFromSupabase()
  const createdUser = data?.id
    ? users.find((user) => user.id === data.id)
    : null

  if (createdUser) {
    return createdUser
  }

  return {
    id: data?.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    cpf: formatCpf(onlyDigits(input.cpf)),
    email: normalizedEmail || null,
    phoneMasked: formatPhone(normalizedPhoneDigits),
    role: input.role,
    status: "pending",
    unitId: normalizedUnitScope.unitId,
    unitName: normalizedUnitScope.unitName,
    mfaStatus: "inactive",
    lastAccessAt: null,
  }
}

async function updateUserInSupabase(input: UpdateUserInput): Promise<UserRecord> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(usersCopy.errors.update)
  }

  const unitsCatalog = await listUnitsCatalog()
  const normalizedUnitScope = normalizeUnitScope(input, unitsCatalog)
  const normalizedEmail = input.email?.trim() || ""
  const normalizedPhoneDigits = onlyDigits(input.phone ?? "")

  if (!normalizedPhoneDigits) {
    throw new Error(usersCopy.errors.requiredPhone)
  }

  const users = await listUsersFromSupabase()
  const targetUser = users.find((user) => user.id === input.id)

  if (!targetUser?.authUserId) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const updateResponse = await supabase.functions.invoke("admin-user-update", {
    body: {
      cpf: onlyDigits(input.cpf),
      email: normalizedEmail || undefined,
      name: input.name.trim(),
      phone: normalizedPhoneDigits,
      role: input.role,
      targetUserId: targetUser.authUserId,
      unitId: normalizedUnitScope.unitId ?? undefined,
    },
  })

  const { error } = updateResponse as {
    error: unknown
  }

  if (error) {
    throw new Error(usersCopy.errors.update)
  }

  const refreshedUsers = await listUsersFromSupabase()
  const updatedUser = refreshedUsers.find((user) => user.id === input.id)

  if (!updatedUser) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  return updatedUser
}

async function resetUserAccessInSupabase(userId: string): Promise<UserRecord> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(usersCopy.feedback.reset.error)
  }

  const users = await listUsersFromSupabase()
  const targetUser = users.find((user) => user.id === userId)

  if (!targetUser?.authUserId) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const resetResponse = await supabase.functions.invoke("admin-user-reset-password", {
    body: {
      reason: RESET_ACCESS_REASON,
      targetUserId: targetUser.authUserId,
    },
  })

  const { error } = resetResponse as {
    error: unknown
  }

  if (error) {
    throw new Error(usersCopy.feedback.reset.error)
  }

  const refreshedUsers = await listUsersFromSupabase()
  const updatedUser = refreshedUsers.find((user) => user.id === userId)

  if (!updatedUser) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  return updatedUser
}

async function invokeAdminUserAction(
  functionName: string,
  userId: string,
  reason: string,
  errorMessage: string
): Promise<UserRecord> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(errorMessage)
  }

  const users = await listUsersFromSupabase()
  const targetUser = users.find((user) => user.id === userId)

  if (!targetUser?.authUserId) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const actionResponse = await supabase.functions.invoke(functionName, {
    body: {
      reason,
      targetUserId: targetUser.authUserId,
    },
  })

  const { error } = actionResponse as { error: unknown }

  if (error) {
    throw new Error(errorMessage)
  }

  const refreshedUsers = await listUsersFromSupabase()
  const updatedUser = refreshedUsers.find((user) => user.id === userId)

  if (!updatedUser) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  return updatedUser
}

async function resetUserPasskeyInSupabase(userId: string): Promise<UserRecord> {
  return invokeAdminUserAction(
    "admin-user-reset-passkey",
    userId,
    RESET_PASSKEY_REASON,
    usersCopy.feedback.resetPasskey.error
  )
}

async function clearUserLockInSupabase(userId: string): Promise<UserRecord> {
  return invokeAdminUserAction(
    "admin-user-clear-lock",
    userId,
    CLEAR_LOCK_REASON,
    usersCopy.feedback.clearLock.error
  )
}

async function revokeUserSessionsInSupabase(userId: string): Promise<UserRecord> {
  return invokeAdminUserAction(
    "admin-user-revoke-sessions",
    userId,
    REVOKE_SESSIONS_REASON,
    usersCopy.feedback.revokeSessions.error
  )
}

async function blockUserInSupabase(userId: string): Promise<UserRecord> {
  return invokeAdminUserAction(
    "admin-user-block",
    userId,
    BLOCK_USER_REASON,
    usersCopy.feedback.block.error
  )
}

async function createUserInMemory(input: CreateUserInput): Promise<UserRecord> {
  const usersGateway = getUsersGateway()
  const currentUsers = await usersGateway.list()

  const unitsCatalog = await listUnitsCatalog()
  const normalizedUnitScope = normalizeUnitScope(input, unitsCatalog)
  const normalizedPhoneDigits = onlyDigits(input.phone ?? "")

  if (!normalizedPhoneDigits) {
    throw new Error(usersCopy.errors.requiredPhone)
  }

  const nextUser: UserRecord = {
    id: createNextUserId(currentUsers),
    name: input.name.trim(),
    cpf: formatCpf(onlyDigits(input.cpf)),
    email: input.email?.trim() || null,
    phoneMasked: formatPhone(normalizedPhoneDigits),
    role: input.role,
    status: "active",
    unitId: normalizedUnitScope.unitId,
    unitName: normalizedUnitScope.unitName,
    mfaStatus: "inactive",
    lastAccessAt: null,
  }

  await usersGateway.saveAll([nextUser, ...currentUsers])

  return nextUser
}

async function updateUserInMemory(input: UpdateUserInput): Promise<UserRecord> {
  const usersGateway = getUsersGateway()
  const currentUsers = await usersGateway.list()

  const userIndex = currentUsers.findIndex((user) => user.id === input.id)

  if (userIndex < 0) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const currentUser = currentUsers[userIndex]
  const unitsCatalog = await listUnitsCatalog()
  const normalizedUnitScope = normalizeUnitScope(input, unitsCatalog)
  const normalizedPhoneDigits = onlyDigits(input.phone ?? "")

  if (!normalizedPhoneDigits) {
    throw new Error(usersCopy.errors.requiredPhone)
  }

  const updatedUser: UserRecord = {
    ...currentUser,
    cpf: formatCpf(onlyDigits(input.cpf)),
    email: input.email?.trim() || null,
    name: input.name.trim(),
    phoneMasked: formatPhone(normalizedPhoneDigits),
    role: input.role,
    unitId: normalizedUnitScope.unitId,
    unitName: normalizedUnitScope.unitName,
  }

  const nextUsers = currentUsers.map((user) =>
    user.id === input.id ? updatedUser : user
  )
  await usersGateway.saveAll(nextUsers)

  return updatedUser
}

async function blockUserInMemory(userId: string): Promise<UserRecord> {
  const usersGateway = getUsersGateway()
  const currentUsers = await usersGateway.list()

  const currentUser = currentUsers.find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const nextUser: UserRecord = {
    ...currentUser,
    status: "inactive",
  }

  const nextUsers = currentUsers.map((user) =>
    user.id === userId ? nextUser : user
  )
  await usersGateway.saveAll(nextUsers)

  return nextUser
}

async function resetUserAccessInMemory(userId: string): Promise<UserRecord> {
  const usersGateway = getUsersGateway()
  const currentUsers = await usersGateway.list()

  const currentUser = currentUsers.find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const nextUser: UserRecord = {
    ...currentUser,
    mfaStatus: "inactive",
    status: "password_reset",
  }

  const nextUsers = currentUsers.map((user) =>
    user.id === userId ? nextUser : user
  )
  await usersGateway.saveAll(nextUsers)

  return nextUser
}

export async function listUsers(): Promise<UserRecord[]> {
  if (isRemoteUsersEnabled()) {
    return listUsersFromSupabase()
  }

  const usersGateway = getUsersGateway()
  return usersGateway.list()
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  if (!input.firstAccessPassword.trim()) {
    throw new Error(usersCopy.errors.requiredFirstAccessPassword)
  }

  if (!input.cpf.trim()) {
    throw new Error(usersCopy.errors.requiredCpf)
  }

  if (requiresSingleUnit(input.role) && !input.unitId?.trim()) {
    throw new Error(usersCopy.errors.requiredUnit)
  }

  if (!onlyDigits(input.phone ?? "")) {
    throw new Error(usersCopy.errors.requiredPhone)
  }

  if (isRemoteUsersEnabled()) {
    return createUserInSupabase(input)
  }

  return createUserInMemory(input)
}

export async function updateUser(input: UpdateUserInput): Promise<UserRecord> {
  if (requiresSingleUnit(input.role) && !input.unitId?.trim()) {
    throw new Error(usersCopy.errors.requiredUnit)
  }

  if (!onlyDigits(input.phone ?? "")) {
    throw new Error(usersCopy.errors.requiredPhone)
  }

  if (isRemoteUsersEnabled()) {
    return updateUserInSupabase(input)
  }

  return updateUserInMemory(input)
}

export async function blockUser(userId: string): Promise<UserRecord> {
  if (isRemoteUsersEnabled()) {
    return blockUserInSupabase(userId)
  }

  return blockUserInMemory(userId)
}

export async function resetUserAccess(userId: string): Promise<UserRecord> {
  if (isRemoteUsersEnabled()) {
    return resetUserAccessInSupabase(userId)
  }

  return resetUserAccessInMemory(userId)
}

export async function resetUserPasskey(userId: string): Promise<UserRecord> {
  if (isRemoteUsersEnabled()) {
    return resetUserPasskeyInSupabase(userId)
  }

  throw new Error(LOCAL_ADMIN_ACTION_UNAVAILABLE_MESSAGE)
}

export async function clearUserLock(userId: string): Promise<UserRecord> {
  if (isRemoteUsersEnabled()) {
    return clearUserLockInSupabase(userId)
  }

  throw new Error(LOCAL_ADMIN_ACTION_UNAVAILABLE_MESSAGE)
}

export async function revokeUserSessions(userId: string): Promise<UserRecord> {
  if (isRemoteUsersEnabled()) {
    return revokeUserSessionsInSupabase(userId)
  }

  throw new Error(LOCAL_ADMIN_ACTION_UNAVAILABLE_MESSAGE)
}
