import {
  requiresSingleUnit,
} from "@/features/auth"
import { listUnits } from "@/features/units"
import {
  formatCpf,
  formatPhone,
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

async function listUnitsCatalog(): Promise<UnitCatalogItem[]> {
  const units = await listUnits()

  return units.map((unit) => ({
    id: String(unit.cod_empresa),
    name: unit.nom_fantasia,
  }))
}

export async function listUsers(): Promise<UserRecord[]> {
  const usersGateway = getUsersGateway()
  return usersGateway.list()
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const usersGateway = getUsersGateway()
  const currentUsers = await usersGateway.list()

  if (!input.firstAccessPassword.trim()) {
    throw new Error(usersCopy.errors.requiredFirstAccessPassword)
  }

  if (!input.cpf.trim()) {
    throw new Error(usersCopy.errors.requiredCpf)
  }

  if (requiresSingleUnit(input.role) && !input.unitId?.trim()) {
    throw new Error(usersCopy.errors.requiredUnit)
  }

  const unitsCatalog = await listUnitsCatalog()
  const normalizedUnitScope = normalizeUnitScope(input, unitsCatalog)

  const normalizedPhone = input.phone?.trim()
    ? formatPhone(onlyDigits(input.phone))
    : null

  const nextUser: UserRecord = {
    id: createNextUserId(currentUsers),
    name: input.name.trim(),
    cpf: formatCpf(onlyDigits(input.cpf)),
    email: input.email?.trim() || null,
    phoneMasked: normalizedPhone,
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

export async function updateUser(input: UpdateUserInput): Promise<UserRecord> {
  const usersGateway = getUsersGateway()
  const currentUsers = await usersGateway.list()

  if (requiresSingleUnit(input.role) && !input.unitId?.trim()) {
    throw new Error(usersCopy.errors.requiredUnit)
  }

  const userIndex = currentUsers.findIndex((user) => user.id === input.id)

  if (userIndex < 0) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  const currentUser = currentUsers[userIndex]
  const unitsCatalog = await listUnitsCatalog()
  const normalizedUnitScope = normalizeUnitScope(input, unitsCatalog)
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
    unitId: normalizedUnitScope.unitId,
    unitName: normalizedUnitScope.unitName,
  }

  const nextUsers = currentUsers.map((user) =>
    user.id === input.id ? updatedUser : user
  )
  await usersGateway.saveAll(nextUsers)

  return updatedUser
}

export async function blockUser(userId: string): Promise<UserRecord> {
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

export async function resetUserAccess(userId: string): Promise<UserRecord> {
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
