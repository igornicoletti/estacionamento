import {
  isGlobalRole,
  requiresSingleUnit,
} from "@/features/auth"
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

const initialUsers: UserRecord[] = [
  {
    id: "USR-001",
    name: "Ana Pereira",
    cpf: "123.456.789-01",
    email: "ana.pereira@rmc.local",
    phoneMasked: "(11) 99999-8888",
    role: "admin",
    status: "active",
    unitName: null,
    mfaStatus: "active",
    lastAccessAt: "2026-06-30 15:32",
  },
  {
    id: "USR-002",
    name: "Bruno Martins",
    cpf: "987.654.321-00",
    email: "bruno.martins@rmc.local",
    phoneMasked: "(21) 98888-7777",
    role: "auditor",
    status: "active",
    unitName: null,
    mfaStatus: "inactive",
    lastAccessAt: "2026-06-29 10:11",
  },
]

let inMemoryUsers = [...initialUsers]

function createNextUserId(users: readonly UserRecord[]) {
  const nextNumber =
    Math.max(
      0,
      ...users.map((user) => Number(user.id.replace("USR-", "")) || 0)
    ) + 1

  return `USR-${String(nextNumber).padStart(3, "0")}`
}

export async function listUsers(): Promise<UserRecord[]> {
  await Promise.resolve()
  return [...inMemoryUsers]
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  await Promise.resolve()

  if (!input.firstAccessPassword.trim()) {
    throw new Error("Informe a senha de primeiro acesso.")
  }

  if (!input.cpf.trim()) {
    throw new Error("Informe o CPF do usuário.")
  }

  if (requiresSingleUnit(input.role) && !input.unitName?.trim()) {
    throw new Error("Selecione uma unidade para o perfil informado.")
  }

  const normalizedUnitName = isGlobalRole(input.role)
    ? null
    : input.unitName?.trim() || null

  const normalizedPhone = input.phone?.trim()
    ? formatPhone(onlyDigits(input.phone))
    : null

  const nextUser: UserRecord = {
    id: createNextUserId(inMemoryUsers),
    name: input.name.trim(),
    cpf: formatCpf(onlyDigits(input.cpf)),
    email: input.email?.trim() || null,
    phoneMasked: normalizedPhone,
    role: input.role,
    status: "active",
    unitName: normalizedUnitName,
    mfaStatus: "inactive",
    lastAccessAt: null,
  }

  inMemoryUsers = [nextUser, ...inMemoryUsers]

  return nextUser
}

export async function updateUser(input: UpdateUserInput): Promise<UserRecord> {
  await Promise.resolve()

  if (requiresSingleUnit(input.role) && !input.unitName?.trim()) {
    throw new Error("Selecione uma unidade para o perfil informado.")
  }

  const userIndex = inMemoryUsers.findIndex((user) => user.id === input.id)

  if (userIndex < 0) {
    throw new Error("Usuário não encontrado.")
  }

  const currentUser = inMemoryUsers[userIndex]
  const normalizedUnitName = isGlobalRole(input.role)
    ? null
    : input.unitName?.trim() || null
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
    unitName: normalizedUnitName,
  }

  inMemoryUsers = inMemoryUsers.map((user) =>
    user.id === input.id ? updatedUser : user
  )

  return updatedUser
}

export async function blockUser(userId: string): Promise<UserRecord> {
  await Promise.resolve()

  const currentUser = inMemoryUsers.find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error("Usuário não encontrado.")
  }

  const nextUser: UserRecord = {
    ...currentUser,
    status: "inactive",
  }

  inMemoryUsers = inMemoryUsers.map((user) =>
    user.id === userId ? nextUser : user
  )

  return nextUser
}

export async function resetUserAccess(userId: string): Promise<UserRecord> {
  await Promise.resolve()

  const currentUser = inMemoryUsers.find((user) => user.id === userId)

  if (!currentUser) {
    throw new Error("Usuário não encontrado.")
  }

  const nextUser: UserRecord = {
    ...currentUser,
    mfaStatus: "inactive",
    status: "password_reset",
  }

  inMemoryUsers = inMemoryUsers.map((user) =>
    user.id === userId ? nextUser : user
  )

  return nextUser
}
