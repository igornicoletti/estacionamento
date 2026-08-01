import { listUnits } from "@/features/units"
import { onlyDigits } from "@/lib"

import { usersCopy } from "../constants/users-copy"
import { getUsersGateway } from "../gateways/users-gateway"
import { type UserIdentity } from "../gateways/users-gateway-contracts"
import { resolveCanonicalUnitId } from "../model/users-models"
import {
  isGlobalRole,
  type CreateUserInput,
  type UnitCatalogItem,
  type UpdateUserInput,
  type UserRecord,
} from "../model/users-types"
import {
  getFirstUsersFormError,
  usersFormSchema,
} from "../schemas/users-form-schema"

export interface UsersWorkspaceSnapshot {
  unitCatalog: readonly UnitCatalogItem[]
  unitCatalogError: Error | null
  users: UserRecord[]
}

type UserActionTarget = string | Pick<UserRecord, "authUserId" | "id">

async function getUnitCatalog(): Promise<UnitCatalogItem[]> {
  return (await listUnits()).map((unit) => ({
    id: String(unit.cod_empresa),
    name: unit.nom_fantasia || unit.nom_razao_social,
  }))
}

function hydrateUnitNames(
  users: readonly UserRecord[],
  units: readonly UnitCatalogItem[]
) {
  const unitNameById = new Map(units.map((unit) => [unit.id, unit.name]))

  return users.map((user) => ({
    ...user,
    unitName: user.unitId
      ? unitNameById.get(user.unitId) ?? user.unitName ?? user.unitId
      : null,
  }))
}

function toError(value: unknown, fallback: string) {
  return value instanceof Error ? value : new Error(fallback)
}

export async function loadUsersWorkspace(): Promise<UsersWorkspaceSnapshot> {
  const unitsPromise = getUnitCatalog()
    .then((unitCatalog) => ({
      unitCatalog,
      unitCatalogError: null,
    }))
    .catch((caughtError: unknown) => ({
      unitCatalog: [] as UnitCatalogItem[],
      unitCatalogError: toError(caughtError, usersCopy.form.unitUnavailable),
    }))
  const [users, unitsResult] = await Promise.all([
    getUsersGateway().list(),
    unitsPromise,
  ])

  return {
    unitCatalog: unitsResult.unitCatalog,
    unitCatalogError: unitsResult.unitCatalogError,
    users: hydrateUnitNames(users, unitsResult.unitCatalog),
  }
}

export async function listUsers(): Promise<UserRecord[]> {
  return (await loadUsersWorkspace()).users
}

async function resolveUserIdentity(
  target: UserActionTarget
): Promise<UserIdentity> {
  if (typeof target !== "string") {
    if (!target.authUserId) {
      throw new Error(usersCopy.errors.adminActionUnavailable)
    }

    return {
      authUserId: target.authUserId,
      id: target.id,
    }
  }

  const identity = await getUsersGateway().findIdentity(target)

  if (!identity) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  return identity
}

async function getPersistedUser(userId: string) {
  const user = (await listUsers()).find((item) => item.id === userId)

  if (!user) {
    throw new Error(usersCopy.errors.userNotFound)
  }

  return user
}

function parseCreateInput(input: CreateUserInput) {
  const result = usersFormSchema.safeParse({
    ...input,
    email: input.email ?? "",
    mode: "create",
    phone: input.phone ?? "",
    unitId: input.unitId ?? "",
  })

  if (!result.success) {
    throw new Error(getFirstUsersFormError(result.error))
  }

  return result.data
}

function parseUpdateInput(input: UpdateUserInput) {
  const result = usersFormSchema.safeParse({
    ...input,
    email: input.email ?? "",
    firstAccessPassword: "",
    mode: "edit",
    phone: input.phone ?? "",
    unitId: input.unitId ?? "",
  })

  if (!result.success) {
    throw new Error(getFirstUsersFormError(result.error))
  }

  return result.data
}

export async function createUser(input: CreateUserInput): Promise<UserRecord> {
  const parsedInput = parseCreateInput(input)
  const units = isGlobalRole(parsedInput.role) ? [] : await getUnitCatalog()
  const unitId = resolveCanonicalUnitId(parsedInput, units)
  const result = await getUsersGateway().create({
    cpf: onlyDigits(parsedInput.cpf),
    email: parsedInput.email || null,
    name: parsedInput.name,
    phone: onlyDigits(parsedInput.phone),
    role: parsedInput.role,
    temporaryPassword: parsedInput.firstAccessPassword.trim(),
    unitId,
  })

  return getPersistedUser(result.id)
}

export async function updateUser(input: UpdateUserInput): Promise<UserRecord> {
  const parsedInput = parseUpdateInput(input)
  const identity = await resolveUserIdentity(input.id)
  const units = isGlobalRole(parsedInput.role) ? [] : await getUnitCatalog()
  const unitId = resolveCanonicalUnitId(parsedInput, units)
  const result = await getUsersGateway().update({
    cpf: onlyDigits(parsedInput.cpf),
    email: parsedInput.email || null,
    name: parsedInput.name,
    phone: onlyDigits(parsedInput.phone),
    role: parsedInput.role,
    targetAuthUserId: identity.authUserId,
    unitId,
  })

  return getPersistedUser(result.id)
}

async function runUserAction(
  target: UserActionTarget,
  action: (targetAuthUserId: string) => Promise<{ id: string }>
) {
  const identity = await resolveUserIdentity(target)
  const result = await action(identity.authUserId)

  return getPersistedUser(result.id)
}

export function blockUser(target: UserActionTarget): Promise<UserRecord> {
  return runUserAction(target, (targetAuthUserId) =>
    getUsersGateway().block(targetAuthUserId)
  )
}

export function resetUserAccess(
  target: UserActionTarget
): Promise<UserRecord> {
  return runUserAction(target, (targetAuthUserId) =>
    getUsersGateway().resetPassword(targetAuthUserId)
  )
}

export function resetUserPasskey(
  target: UserActionTarget
): Promise<UserRecord> {
  return runUserAction(target, (targetAuthUserId) =>
    getUsersGateway().resetPasskey(targetAuthUserId)
  )
}

export function clearUserLock(
  target: UserActionTarget
): Promise<UserRecord> {
  return runUserAction(target, (targetAuthUserId) =>
    getUsersGateway().clearLock(targetAuthUserId)
  )
}

export function revokeUserSessions(
  target: UserActionTarget
): Promise<UserRecord> {
  return runUserAction(target, (targetAuthUserId) =>
    getUsersGateway().revokeSessions(targetAuthUserId)
  )
}
