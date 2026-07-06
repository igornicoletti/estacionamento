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
  cpf_masked: string
  email: string | null
  name: string
  phone_masked: string
  role: string
  status: string
  phone_verified_at: string | null
  email_verified_at: string | null
  created_at: string
  app_user_units?: RawAppUserUnitRow[] | RawAppUserUnitRow | null
}

const RESET_ACCESS_REASON = "Reset solicitado pelo painel administrativo."
const REMOTE_UPDATE_UNAVAILABLE_MESSAGE =
  "Edição de usuário ainda não está disponível no backend remoto."
const REMOTE_BLOCK_UNAVAILABLE_MESSAGE =
  "Bloqueio de usuário ainda não está disponível no backend remoto."

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

async function listUsersFromSupabase(): Promise<UserRecord[]> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(usersCopy.errors.load)
  }

  const response = await supabase
    .from("app_users")
    .select(
      "id, auth_user_id, cpf_masked, email, name, phone_masked, role, status, phone_verified_at, email_verified_at, created_at, app_user_units(unit_id)"
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

  const unitsCatalog = await listUnitsCatalog().catch(
    (): UnitCatalogItem[] => []
  )

  const unitNameById = new Map(unitsCatalog.map((unit) => [unit.id, unit.name]))

  return (data ?? []).flatMap((appUser) => {
    if (!isUserRole(appUser.role) || !isAppUserStatus(appUser.status)) {
      return []
    }

    const unitId = getRelatedUnitId(appUser.app_user_units)
    const hasVerifiedContact = Boolean(appUser.phone_verified_at || appUser.email_verified_at)

    return [
      {
        id: appUser.id,
        authUserId: appUser.auth_user_id,
        name: appUser.name,
        cpf: appUser.cpf_masked,
        email: appUser.email,
        phoneMasked: appUser.phone_masked,
        role: appUser.role,
        status: appUser.status,
        unitId,
        unitName: unitId ? (unitNameById.get(unitId) ?? null) : null,
        mfaStatus: hasVerifiedContact ? "active" : "inactive",
        lastAccessAt: null,
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
    throw new Error(REMOTE_UPDATE_UNAVAILABLE_MESSAGE)
  }

  return updateUserInMemory(input)
}

export async function blockUser(userId: string): Promise<UserRecord> {
  if (isRemoteUsersEnabled()) {
    throw new Error(REMOTE_BLOCK_UNAVAILABLE_MESSAGE)
  }

  return blockUserInMemory(userId)
}

export async function resetUserAccess(userId: string): Promise<UserRecord> {
  if (isRemoteUsersEnabled()) {
    return resetUserAccessInSupabase(userId)
  }

  return resetUserAccessInMemory(userId)
}
