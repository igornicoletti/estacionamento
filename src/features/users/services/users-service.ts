import { newPasswordSchema } from "@/features/auth/validation"
import { listUnits } from "@/features/units"
import { onlyDigits } from "@/lib"

import { usersCopy } from "../constants"
import {
  isGlobalRole,
  normalizeUnitScope,
  type CreateUserInput,
  type UpdateUserInput,
  type UserRecord,
} from "../model"
import { getUsersGateway } from "./users-gateway"

async function getUnitCatalog() {
  return (await listUnits()).map((unit) => ({
    id: String(unit.cod_empresa),
    name: unit.nom_fantasia || unit.nom_razao_social,
  }))
}

export async function listUsers(): Promise<UserRecord[]> {
  const users = await getUsersGateway().list()
  const units = await getUnitCatalog().catch(() => [])
  const unitNameById = new Map(units.map((unit) => [unit.id, unit.name]))

  return users.map((user) => ({
    ...user,
    unitName: user.unitId
      ? unitNameById.get(user.unitId) ?? user.unitName ?? user.unitId
      : null,
  }))
}

async function getCurrentUser(userId: string) {
  const user = (await listUsers()).find((item) => item.id === userId)

  if (!user) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  if (!user.authUserId) {
    throw new Error(usersCopy.errors.adminActionUnavailable)
  }

  return {
    ...user,
    authUserId: user.authUserId,
  }
}

async function getPersistedUser(userId: string) {
  const user = (await listUsers()).find((item) => item.id === userId)

  if (!user) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  return user
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const password = input.firstAccessPassword.trim()

  if (!password) {
    throw new Error(usersCopy.errors.requiredFirstAccessPassword)
  }

  if (!input.cpf.trim()) {
    throw new Error(usersCopy.errors.requiredCpf)
  }

  const passwordResult = newPasswordSchema.safeParse(password)

  if (!passwordResult.success) {
    throw new Error(
      passwordResult.error.issues[0]?.message ?? usersCopy.errors.invalidPassword
    )
  }

  const units = isGlobalRole(input.role) ? [] : await getUnitCatalog()
  const unitScope = normalizeUnitScope(input, units)
  const result = await getUsersGateway().create({
    cpf: onlyDigits(input.cpf),
    email: input.email?.trim() || null,
    name: input.name.trim(),
    phone: onlyDigits(input.phone ?? ""),
    role: input.role,
    temporaryPassword: password,
    unitId: unitScope.unitId,
  })

  return getPersistedUser(result.id)
}

export async function updateUser(input: UpdateUserInput): Promise<UserRecord> {
  const currentUser = await getCurrentUser(input.id)
  const units = isGlobalRole(input.role) ? [] : await getUnitCatalog()
  const unitScope = normalizeUnitScope(input, units)
  const result = await getUsersGateway().update({
    cpf: onlyDigits(input.cpf),
    email: input.email?.trim() || null,
    name: input.name.trim(),
    phone: onlyDigits(input.phone ?? ""),
    role: input.role,
    targetAuthUserId: currentUser.authUserId,
    unitId: unitScope.unitId,
  })

  return getPersistedUser(result.id)
}

async function runUserAction(
  userId: string,
  action: (targetAuthUserId: string) => Promise<{ id: string }>
) {
  const currentUser = await getCurrentUser(userId)
  const result = await action(currentUser.authUserId)

  return getPersistedUser(result.id)
}

export function blockUser(userId: string): Promise<UserRecord> {
  return runUserAction(userId, (targetAuthUserId) =>
    getUsersGateway().block(targetAuthUserId)
  )
}

export function resetUserAccess(userId: string): Promise<UserRecord> {
  return runUserAction(userId, (targetAuthUserId) =>
    getUsersGateway().resetPassword(targetAuthUserId)
  )
}

export function resetUserPasskey(userId: string): Promise<UserRecord> {
  return runUserAction(userId, (targetAuthUserId) =>
    getUsersGateway().resetPasskey(targetAuthUserId)
  )
}

export function clearUserLock(userId: string): Promise<UserRecord> {
  return runUserAction(userId, (targetAuthUserId) =>
    getUsersGateway().clearLock(targetAuthUserId)
  )
}

export async function revokeUserSessions(userId: string): Promise<UserRecord> {
  const currentUser = await getCurrentUser(userId)

  await getUsersGateway().revokeSessions(currentUser.authUserId)

  return currentUser
}
