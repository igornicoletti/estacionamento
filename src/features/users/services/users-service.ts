import { shouldBypassAuthInDev } from "@/config"
import { authCpfSchema } from "@/features/auth/validation"
import { listUnits } from "@/features/units"
import {
  formatCpf,
  formatPhone,
  getSupabaseBrowserClient,
  isValidPhone,
  onlyDigits,
  resolveVisibleSensitiveValue,
} from "@/lib"

import { usersCopy } from "../constants"
import {
  createNextUserId,
  isAppUserStatus,
  isUserRole,
  normalizeUnitScope,
  requiresSingleUnit,
  type CreateUserInput,
  type UnitCatalogItem,
  type UpdateUserInput,
  type UserRecord,
} from "../model"
import { getUsersGateway } from "./users-gateway"

type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseBrowserClient>>

type RawAppUserUnitRow = {
  unit_id: string | null
}

type RawAppUserRow = {
  id: string
  auth_user_id: string
  cpf_display?: string | null
  cpf_masked: string
  email: string | null
  name: string
  phone_display?: string | null
  phone_masked: string
  role: string
  status: string
  locked_until?: string | null
  created_at: string
  app_user_units?: RawAppUserUnitRow[] | RawAppUserUnitRow | null
}

type RawLastAccessRow = {
  auth_user_id: string
  last_sign_in_at: string | null
}

type RawAuthFactorRow = {
  auth_user_id: string
  passkey_count: number
}

type AdminFunctionSuccessResponse = {
  ok?: true
  id?: string
  appUserId?: string
  authUserId?: string
  message?: string
}

type AdminFunctionErrorResponse = {
  ok: false
  code?: string
  message?: string
}

type AdminFunctionResponse = AdminFunctionSuccessResponse | AdminFunctionErrorResponse

type AdminUserCreateResponse = AdminFunctionResponse & {
  id?: string
  appUserId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function getResponseMessage(value: unknown) {
  if (!isRecord(value)) {
    return null
  }

  const message = value.message

  return typeof message === "string" && message.trim() ? message : null
}

function assertAdminFunctionResponse(
  response: { data: unknown; error: unknown },
  fallbackMessage: string
): AdminFunctionResponse {
  if (response.error) {
    throw new Error(getResponseMessage(response.error) ?? fallbackMessage)
  }

  if (!isRecord(response.data)) {
    return { ok: true }
  }

  if (response.data.ok === false) {
    throw new Error(getResponseMessage(response.data) ?? fallbackMessage)
  }

  return {
    ok: true,
    appUserId:
      typeof response.data.appUserId === "string"
        ? response.data.appUserId
        : undefined,
    authUserId:
      typeof response.data.authUserId === "string"
        ? response.data.authUserId
        : undefined,
    id: typeof response.data.id === "string" ? response.data.id : undefined,
    message:
      typeof response.data.message === "string"
        ? response.data.message
        : undefined,
  }
}

function getAdminReturnedId(response: AdminFunctionResponse) {
  if ("appUserId" in response && typeof response.appUserId === "string") {
    return response.appUserId
  }

  if ("id" in response && typeof response.id === "string") {
    return response.id
  }

  return null
}

function assertActionUserId(userId: string) {
  if (!userId.trim()) {
    throw new Error(usersCopy.errors.userNotFound)
  }
}

async function listUnitsCatalog(): Promise<UnitCatalogItem[]> {
  const units = await listUnits()

  return units.map((unit) => ({
    id: String(unit.cod_empresa),
    name: unit.nom_fantasia,
  }))
}

async function listUnitsCatalogSafe(): Promise<UnitCatalogItem[]> {
  try {
    return await listUnitsCatalog()
  } catch {
    return []
  }
}

function isMemoryUsersEnabled() {
  return import.meta.env.MODE === "test"
}

function isRemoteUsersEnabled() {
  if (isMemoryUsersEnabled()) {
    return false
  }

  return Boolean(getSupabaseBrowserClient()) && !shouldBypassAuthInDev()
}

function assertUsersBackendConfigured() {
  if (!isRemoteUsersEnabled() && !isMemoryUsersEnabled()) {
    throw new Error(usersCopy.errors.adminActionUnavailable)
  }
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

function getPostgrestErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return ""
  }

  const code = (error as { code?: unknown }).code

  return typeof code === "string" ? code : ""
}

function resolveMaskedCpf(value: string | null | undefined) {
  const normalized = value?.trim()

  if (!normalized || !normalized.includes("*")) {
    return ""
  }

  return normalized
}

function isUndefinedColumnError(error: unknown) {
  return getPostgrestErrorCode(error) === "42703"
}

function assertValidUserInput(
  input: CreateUserInput | UpdateUserInput,
  options: { requireFirstAccessPassword: boolean }
) {
  if (!input.name.trim()) {
    throw new Error(usersCopy.errors.requiredName)
  }

  const cpfResult = authCpfSchema.safeParse(input.cpf)

  if (!cpfResult.success) {
    throw new Error(usersCopy.errors.invalidCpf)
  }

  if (!isUserRole(input.role)) {
    throw new Error(usersCopy.errors.invalidRole)
  }

  if (requiresSingleUnit(input.role) && !input.unitId?.trim()) {
    throw new Error(usersCopy.errors.requiredUnit)
  }

  if (!isValidPhone(input.phone ?? "")) {
    throw new Error(usersCopy.errors.invalidPhone)
  }

  if (options.requireFirstAccessPassword && !input.firstAccessPassword?.trim()) {
    throw new Error(usersCopy.errors.requiredFirstAccessPassword)
  }
}

async function listLastAccessByAuthUserId() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return new Map<string, string | null>()
  }

  const response = await supabase.rpc("list_app_user_last_access") as {
    data: RawLastAccessRow[] | null
    error: unknown
  }

  if (response.error) {
    throw new Error(usersCopy.errors.load)
  }

  return new Map((response.data ?? []).map((row) => [row.auth_user_id, row.last_sign_in_at]))
}

async function listLastAccessByAuthUserIdSafe() {
  try {
    return await listLastAccessByAuthUserId()
  } catch {
    return new Map<string, string | null>()
  }
}

async function listAuthFactorsByAuthUserId() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    return new Map<string, RawAuthFactorRow>()
  }

  const response = await supabase.functions.invoke<{ factors?: RawAuthFactorRow[] }>(
    "admin-user-auth-factors"
  ) as {
    data: { factors?: RawAuthFactorRow[] } | null
    error: unknown
  }

  if (response.error || !response.data) {
    throw new Error(usersCopy.errors.load)
  }

  return new Map((response.data.factors ?? []).map((factor) => [factor.auth_user_id, factor]))
}

async function listAuthFactorsByAuthUserIdSafe() {
  try {
    return await listAuthFactorsByAuthUserId()
  } catch {
    return new Map<string, RawAuthFactorRow>()
  }
}

async function listRawAppUsersFromSupabase(supabase: SupabaseClient) {
  const withDisplayColumns = await supabase
    .from("app_users")
    .select(
      "id, auth_user_id, cpf_display, cpf_masked, email, name, phone_display, phone_masked, role, status, locked_until, created_at, app_user_units(unit_id)"
    )
    .order("created_at", { ascending: false })

  const displayResponse = withDisplayColumns as {
    data: RawAppUserRow[] | null
    error: unknown
  }

  if (!displayResponse.error) {
    return displayResponse.data ?? []
  }

  if (!isUndefinedColumnError(displayResponse.error)) {
    throw new Error(usersCopy.errors.load)
  }

  const legacyColumns = await supabase
    .from("app_users")
    .select(
      "id, auth_user_id, cpf_masked, email, name, phone_masked, role, status, locked_until, created_at, app_user_units(unit_id)"
    )
    .order("created_at", { ascending: false })

  const legacyResponse = legacyColumns as {
    data: RawAppUserRow[] | null
    error: unknown
  }

  if (legacyResponse.error) {
    throw new Error(usersCopy.errors.load)
  }

  return legacyResponse.data ?? []
}

async function listUsersFromSupabase(): Promise<UserRecord[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(usersCopy.errors.load)
  }

  const data = await listRawAppUsersFromSupabase(supabase)
  const [unitsCatalog, lastAccessByAuthUserId, authFactorsByAuthUserId] = await Promise.all([
    listUnitsCatalogSafe(),
    listLastAccessByAuthUserIdSafe(),
    listAuthFactorsByAuthUserIdSafe(),
  ])
  const unitNameById = new Map(unitsCatalog.map((unit) => [unit.id, unit.name]))

  return data.flatMap((appUser) => {
    if (!isUserRole(appUser.role) || !isAppUserStatus(appUser.status)) {
      return []
    }

    const unitId = getRelatedUnitId(appUser.app_user_units)
    const authFactors = authFactorsByAuthUserId.get(appUser.auth_user_id)
    const passkeyCount = authFactors?.passkey_count ?? 0

    return [
      {
        id: appUser.id,
        authUserId: appUser.auth_user_id,
        name: appUser.name,
        cpf: resolveMaskedCpf(appUser.cpf_masked),
        email: appUser.email,
        phoneMasked: resolveVisibleSensitiveValue(
          appUser.phone_display,
          appUser.phone_masked
        ),
        role: appUser.role,
        status: appUser.status,
        lockedUntil: appUser.locked_until ?? null,
        unitId,
        unitName: unitId ? (unitNameById.get(unitId) ?? null) : null,
        passkeyStatus: passkeyCount > 0 ? "active" : "inactive",
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
  const createResponse = await supabase.functions.invoke<AdminUserCreateResponse>(
    "admin-user-create",
    {
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
    }
  )
  const response = assertAdminFunctionResponse(createResponse, usersCopy.errors.create)
  const returnedId = getAdminReturnedId(response)
  const users = await listUsersFromSupabase()
  const createdUser = returnedId ? users.find((user) => user.id === returnedId) : null

  if (!createdUser) {
    throw new Error(usersCopy.errors.create)
  }

  return createdUser
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
  const users = await listUsersFromSupabase()
  const targetUser = users.find((user) => user.id === input.id)

  if (!targetUser?.authUserId) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const updateResponse = await supabase.functions.invoke<AdminFunctionResponse>(
    "admin-user-update",
    {
      body: {
        cpf: onlyDigits(input.cpf),
        email: normalizedEmail || undefined,
        name: input.name.trim(),
        phone: normalizedPhoneDigits,
        role: input.role,
        targetUserId: targetUser.authUserId,
        unitId: normalizedUnitScope.unitId ?? undefined,
      },
    }
  )
  assertAdminFunctionResponse(updateResponse, usersCopy.errors.update)

  const refreshedUsers = await listUsersFromSupabase()
  const updatedUser = refreshedUsers.find((user) => user.id === input.id)

  if (!updatedUser) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  return updatedUser
}

async function invokeAdminUserAction(
  functionName: string,
  userId: string,
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

  const actionResponse = await supabase.functions.invoke<AdminFunctionResponse>(
    functionName,
    { body: { targetUserId: targetUser.authUserId } }
  )
  assertAdminFunctionResponse(actionResponse, errorMessage)

  const refreshedUsers = await listUsersFromSupabase()
  const updatedUser = refreshedUsers.find((user) => user.id === userId)

  if (!updatedUser) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  return updatedUser
}

async function createUserInMemory(input: CreateUserInput): Promise<UserRecord> {
  const usersGateway = getUsersGateway()
  const currentUsers = await usersGateway.list()
  const unitsCatalog = await listUnitsCatalogSafe()
  const normalizedUnitScope = normalizeUnitScope(input, unitsCatalog)
  const normalizedPhoneDigits = onlyDigits(input.phone ?? "")

  const nextUser: UserRecord = {
    cpf: formatCpf(onlyDigits(input.cpf)),
    email: input.email?.trim() || null,
    id: createNextUserId(currentUsers),
    lastAccessAt: null,
    lockedUntil: null,
    name: input.name.trim(),
    passkeyStatus: "inactive",
    phoneMasked: formatPhone(normalizedPhoneDigits),
    role: input.role,
    status: "active",
    unitId: normalizedUnitScope.unitId,
    unitName: normalizedUnitScope.unitName,
  }

  await usersGateway.saveAll([nextUser, ...currentUsers])

  return nextUser
}

async function updateUserInMemory(input: UpdateUserInput): Promise<UserRecord> {
  const usersGateway = getUsersGateway()
  const currentUsers = await usersGateway.list()
  const currentUser = currentUsers.find((user) => user.id === input.id)

  if (!currentUser) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const unitsCatalog = await listUnitsCatalogSafe()
  const normalizedUnitScope = normalizeUnitScope(input, unitsCatalog)
  const normalizedPhoneDigits = onlyDigits(input.phone ?? "")
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

  await usersGateway.saveAll(
    currentUsers.map((user) => (user.id === input.id ? updatedUser : user))
  )

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

  await usersGateway.saveAll(
    currentUsers.map((user) => (user.id === userId ? nextUser : user))
  )

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
    passkeyStatus: "inactive",
    status: "password_reset",
  }

  await usersGateway.saveAll(
    currentUsers.map((user) => (user.id === userId ? nextUser : user))
  )

  return nextUser
}

export async function listUsers(): Promise<UserRecord[]> {
  if (isRemoteUsersEnabled()) {
    return listUsersFromSupabase()
  }

  assertUsersBackendConfigured()
  return getUsersGateway().list()
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  assertValidUserInput(input, { requireFirstAccessPassword: true })
  assertUsersBackendConfigured()

  return isRemoteUsersEnabled() ? createUserInSupabase(input) : createUserInMemory(input)
}

export async function updateUser(input: UpdateUserInput): Promise<UserRecord> {
  assertValidUserInput(input, { requireFirstAccessPassword: false })
  assertUsersBackendConfigured()

  return isRemoteUsersEnabled() ? updateUserInSupabase(input) : updateUserInMemory(input)
}

export async function blockUser(userId: string): Promise<UserRecord> {
  assertActionUserId(userId)
  assertUsersBackendConfigured()

  return isRemoteUsersEnabled()
    ? invokeAdminUserAction("admin-user-block", userId, usersCopy.feedback.block.error)
    : blockUserInMemory(userId)
}

export async function resetUserAccess(userId: string): Promise<UserRecord> {
  assertActionUserId(userId)
  assertUsersBackendConfigured()

  return isRemoteUsersEnabled()
    ? invokeAdminUserAction("admin-user-reset-password", userId, usersCopy.feedback.reset.error)
    : resetUserAccessInMemory(userId)
}

export async function resetUserPasskey(userId: string): Promise<UserRecord> {
  assertActionUserId(userId)

  if (isRemoteUsersEnabled()) {
    return invokeAdminUserAction(
      "admin-user-reset-passkey",
      userId,
      usersCopy.feedback.resetPasskey.error
    )
  }

  throw new Error(usersCopy.errors.adminActionUnavailable)
}

export async function clearUserLock(userId: string): Promise<UserRecord> {
  assertActionUserId(userId)

  if (isRemoteUsersEnabled()) {
    return invokeAdminUserAction(
      "admin-user-clear-lock",
      userId,
      usersCopy.feedback.clearLock.error
    )
  }

  throw new Error(usersCopy.errors.adminActionUnavailable)
}

export async function revokeUserSessions(userId: string): Promise<UserRecord> {
  assertActionUserId(userId)

  if (isRemoteUsersEnabled()) {
    return invokeAdminUserAction(
      "admin-user-revoke-sessions",
      userId,
      usersCopy.feedback.revokeSessions.error
    )
  }

  throw new Error(usersCopy.errors.adminActionUnavailable)
}
