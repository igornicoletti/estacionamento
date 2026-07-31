import { z } from "zod"

import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import { usersCopy } from "../constants"
import {
  isAppUserStatus,
  isUserRole,
  type UserRecord,
  type UserRole,
} from "../model"

export interface CreateUserCommand {
  cpf: string
  email: string | null
  name: string
  phone: string
  role: UserRole
  temporaryPassword: string
  unitId: string | null
}

export interface UpdateUserCommand {
  cpf: string
  email: string | null
  name: string
  phone: string
  role: UserRole
  targetAuthUserId: string
  unitId: string | null
}

export interface UserMutationResult {
  authUserId: string
  id: string
}

export interface UsersGateway {
  block(targetAuthUserId: string): Promise<UserMutationResult>
  clearLock(targetAuthUserId: string): Promise<UserMutationResult>
  create(command: CreateUserCommand): Promise<UserMutationResult>
  list(): Promise<UserRecord[]>
  resetPasskey(targetAuthUserId: string): Promise<UserMutationResult>
  resetPassword(targetAuthUserId: string): Promise<UserMutationResult>
  revokeSessions(targetAuthUserId: string): Promise<UserMutationResult>
  update(command: UpdateUserCommand): Promise<UserMutationResult>
}

const unitLinkSchema = z.object({ unit_id: z.string() })
const unitLinksSchema = z.union([
  unitLinkSchema,
  z.array(unitLinkSchema),
  z.null(),
])
const appUserRowSchema = z.object({
  app_user_units: unitLinksSchema.optional(),
  auth_user_id: z.string(),
  cpf_display: z.string().nullable(),
  cpf_masked: z.string(),
  email: z.string().nullable(),
  id: z.string(),
  locked_until: z.string().nullable(),
  name: z.string(),
  phone_display: z.string().nullable(),
  phone_masked: z.string(),
  role: z.string(),
  status: z.string(),
})
const appUserRowsSchema = z.array(appUserRowSchema)
const lastAccessRowsSchema = z.array(
  z.object({
    auth_user_id: z.string(),
    last_sign_in_at: z.string().nullable(),
  })
)
const factorsResponseSchema = z.object({
  factors: z.array(
    z.object({
      auth_user_id: z.string(),
      passkey_count: z.number().int().nonnegative(),
    })
  ),
  ok: z.literal(true),
})
const invokeResponseSchema = z.object({
  data: z.unknown(),
  error: z.unknown().nullable(),
})
const mutationResponseSchema = z.object({
  authUserId: z.string(),
  id: z.string(),
  ok: z.literal(true),
})

function resolveUnitId(value: z.infer<typeof unitLinksSchema> | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.unit_id ?? null
  }

  return value?.unit_id ?? null
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    throw new Error(usersCopy.errors.adminActionUnavailable)
  }

  return supabase
}

async function invokeMutation(
  functionName: string,
  body: Record<string, unknown>,
  errorMessage: string
): Promise<UserMutationResult> {
  const supabase = getSupabaseOrThrow()
  const response: unknown = await supabase.functions.invoke(functionName, {
    body,
  })
  const invokeResult = invokeResponseSchema.safeParse(response)

  if (!invokeResult.success || invokeResult.data.error) {
    throw new Error(errorMessage, {
      cause: invokeResult.success
        ? invokeResult.data.error
        : invokeResult.error,
    })
  }

  const result = mutationResponseSchema.safeParse(invokeResult.data.data)

  if (!result.success) {
    throw new Error(errorMessage, { cause: result.error })
  }

  return result.data
}

function createSupabaseUsersGateway(): UsersGateway {
  return {
    block(targetAuthUserId) {
      return invokeMutation(
        "admin-user-block",
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.block.error
      )
    },
    clearLock(targetAuthUserId) {
      return invokeMutation(
        "admin-user-clear-lock",
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.clearLock.error
      )
    },
    create(command) {
      return invokeMutation(
        "admin-user-create",
        {
          cpf: command.cpf,
          email: command.email ?? undefined,
          hasOwnEmail: Boolean(command.email),
          name: command.name,
          phone: command.phone,
          role: command.role,
          temporaryPassword: command.temporaryPassword,
          unitId: command.unitId ?? undefined,
        },
        usersCopy.errors.create
      )
    },
    async list() {
      const supabase = getSupabaseOrThrow()
      const [usersResponse, accessResponse, factorsResponse] = await Promise.all([
        supabase
          .from("app_users")
          .select(
            "id, auth_user_id, name, cpf_display, cpf_masked, email, phone_display, phone_masked, role, status, locked_until, app_user_units(unit_id)"
          )
          .order("name", { ascending: true }),
        supabase.rpc("list_app_user_last_access"),
        supabase.functions.invoke("admin-user-auth-factors", { body: {} }),
      ])

      if (usersResponse.error || accessResponse.error || factorsResponse.error) {
        throw new Error(usersCopy.errors.load, {
          cause:
            usersResponse.error ?? accessResponse.error ?? factorsResponse.error,
        })
      }

      const usersResult = appUserRowsSchema.safeParse(usersResponse.data ?? [])
      const accessResult = lastAccessRowsSchema.safeParse(accessResponse.data ?? [])
      const factorsResult = factorsResponseSchema.safeParse(factorsResponse.data)

      if (!usersResult.success || !accessResult.success || !factorsResult.success) {
        throw new Error(usersCopy.errors.load, {
          cause:
            usersResult.error ?? accessResult.error ?? factorsResult.error,
        })
      }

      const lastAccessByUserId = new Map(
        accessResult.data.map((item) => [
          item.auth_user_id,
          item.last_sign_in_at,
        ])
      )
      const passkeyCountByUserId = new Map(
        factorsResult.data.factors.map((item) => [
          item.auth_user_id,
          item.passkey_count,
        ])
      )

      return usersResult.data.map((row) => {
        if (!isUserRole(row.role) || !isAppUserStatus(row.status)) {
          throw new Error(usersCopy.errors.load)
        }

        const passkeyCount = passkeyCountByUserId.get(row.auth_user_id) ?? 0

        return {
          authUserId: row.auth_user_id,
          cpf: row.cpf_display ?? row.cpf_masked,
          email: row.email,
          id: row.id,
          lastAccessAt: lastAccessByUserId.get(row.auth_user_id) ?? null,
          lockedUntil: row.locked_until,
          name: row.name,
          passkeyCount,
          passkeyStatus: passkeyCount > 0 ? "active" : "inactive",
          phoneMasked: row.phone_display ?? row.phone_masked,
          role: row.role,
          status: row.status,
          unitId: resolveUnitId(row.app_user_units),
          unitName: null,
        }
      })
    },
    resetPasskey(targetAuthUserId) {
      return invokeMutation(
        "admin-user-reset-passkey",
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.resetPasskey.error
      )
    },
    resetPassword(targetAuthUserId) {
      return invokeMutation(
        "admin-user-reset-password",
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.reset.error
      )
    },
    revokeSessions(targetAuthUserId) {
      return invokeMutation(
        "admin-user-revoke-sessions",
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.revokeSessions.error
      )
    },
    update(command) {
      return invokeMutation(
        "admin-user-update",
        {
          cpf: command.cpf,
          email: command.email ?? undefined,
          name: command.name,
          phone: command.phone,
          role: command.role,
          targetUserId: command.targetAuthUserId,
          unitId: command.unitId ?? undefined,
        },
        usersCopy.errors.update
      )
    },
  }
}

let activeUsersGateway: UsersGateway = createSupabaseUsersGateway()

export function getUsersGateway() {
  return activeUsersGateway
}

export function setUsersGateway(gateway: UsersGateway) {
  activeUsersGateway = gateway
}

export function resetUsersGateway() {
  activeUsersGateway = createSupabaseUsersGateway()
}
