import {
  createNextUserId,
  isGlobalRole,
  normalizeUnitScope,
} from "../model"
import {
  formatCpf,
  formatPhone,
  onlyDigits,
} from "@/lib"
import { newPasswordSchema } from "@/features/auth/validation"
import { listUnits } from "@/features/units"

import {
  type CreateUserInput,
  type UpdateUserInput,
  type UserRecord,
} from "../model"
import { getUsersGateway } from "./users-gateway"

export async function listUsers(): Promise<UserRecord[]> {
  return getUsersGateway().list()
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  await Promise.resolve()

  if (!input.firstAccessPassword.trim()) {
    throw new Error("Informe a senha de primeiro acesso.")
  }

  if (!input.cpf.trim()) {
    throw new Error("Informe o CPF do usuário.")
  }

  const passwordResult = newPasswordSchema.safeParse(input.firstAccessPassword.trim())

  if (!passwordResult.success) {
    throw new Error(passwordResult.error.issues[0]?.message ?? "Senha inválida.")
  }

  const unitsCatalog = isGlobalRole(input.role)
    ? []
    : (await listUnits()).map((unit) => ({
        id: String(unit.cod_empresa),
        name: unit.nom_fantasia || unit.nom_razao_social,
      }))
  const unitScope = normalizeUnitScope(input, unitsCatalog)

  const normalizedPhone = input.phone?.trim()
    ? formatPhone(onlyDigits(input.phone))
    : null
  const users = await listUsers()

  const nextUser: UserRecord = {
    id: createNextUserId(users),
    name: input.name.trim(),
    cpf: formatCpf(onlyDigits(input.cpf)),
    email: input.email?.trim() || null,
    phoneMasked: normalizedPhone,
    role: input.role,
    status: "active",
    authUserId: undefined,
    unitId: unitScope.unitId,
    unitName: unitScope.unitName,
    passkeyStatus: "inactive",
    lastAccessAt: null,
  }

  await getUsersGateway().saveAll([nextUser, ...users])

  return nextUser
}

export async function updateUser(input: UpdateUserInput): Promise<UserRecord> {
  await Promise.resolve()

  const users = await listUsers()
  const userIndex = users.findIndex((user) => user.id === input.id)

  if (userIndex < 0) {
    throw new Error("Usuário não encontrado.")
  }

  const currentUser = users[userIndex]
  const unitsCatalog = isGlobalRole(input.role)
    ? []
    : (await listUnits()).map((unit) => ({
        id: String(unit.cod_empresa),
        name: unit.nom_fantasia || unit.nom_razao_social,
      }))
  const unitScope = normalizeUnitScope(input, unitsCatalog)
  const normalizedPhone = input.phone?.trim()
    ? formatPhone(onlyDigits(input.phone))
    : null

  const updatedUser: UserRecord = {
    ...currentUser,
    cpf: formatCpf(onlyDigits(input.cpf)),
    email: input.email?.trim() || null,
    name: input.name.trim(),
    phoneMasked: normalizedPhone,
    role: input.role,
    unitId: unitScope.unitId,
    unitName: unitScope.unitName,
  }

  await getUsersGateway().saveAll(
    users.map((user) => (user.id === input.id ? updatedUser : user))
  )

  return updatedUser
}

export async function blockUser(userId: string): Promise<UserRecord> {
  await Promise.resolve()

  const users = await listUsers()
  const currentUser = users.find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error("Usuário não encontrado.")
  }

  const nextUser: UserRecord = {
    ...currentUser,
    status: "inactive",
  }

  await getUsersGateway().saveAll(
    users.map((user) => (user.id === userId ? nextUser : user))
  )

  return nextUser
}

export async function resetUserAccess(userId: string): Promise<UserRecord> {
  await Promise.resolve()

  const users = await listUsers()
  const currentUser = users.find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error("Usuário não encontrado.")
  }

  const nextUser: UserRecord = {
    ...currentUser,
    status: "password_reset",
  }

  await getUsersGateway().saveAll(
    users.map((user) => (user.id === userId ? nextUser : user))
  )

  return nextUser
}

export async function resetUserPasskey(userId: string): Promise<UserRecord> {
  await Promise.resolve()

  const users = await listUsers()
  const currentUser = users.find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error("Usuário não encontrado.")
  }

  const nextUser: UserRecord = {
    ...currentUser,
    passkeyStatus: "inactive",
    status: "passkey_reset",
  }

  await getUsersGateway().saveAll(
    users.map((user) => (user.id === userId ? nextUser : user))
  )

  return nextUser
}

export async function clearUserLock(userId: string): Promise<UserRecord> {
  await Promise.resolve()

  const users = await listUsers()
  const currentUser = users.find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error("Usuário não encontrado.")
  }

  const nextUser: UserRecord = {
    ...currentUser,
    lockedUntil: null,
    status: "active",
  }

  await getUsersGateway().saveAll(
    users.map((user) => (user.id === userId ? nextUser : user))
  )

  return nextUser
}

export async function revokeUserSessions(userId: string): Promise<UserRecord> {
  await Promise.resolve()

  const currentUser = (await listUsers()).find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error("Usuário não encontrado.")
  }

  return currentUser
}
