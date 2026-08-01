import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

import {
  USER_IDENTITY_SELECT,
  USERS_DATA_SOURCE,
  USERS_EDGE_FUNCTION,
  USERS_LIST_SELECT,
} from "../constants/users-api"
import { usersCopy } from "../constants/users-copy"
import {
  isAppUserStatus,
  isUserRole,
  type UserRecord,
} from "../model/users-types"
import {
  appUserRowsSchema,
  factorsResponseSchema,
  invokeResponseSchema,
  lastAccessRowsSchema,
  mutationResponseSchema,
  userIdentityRowSchema,
  type UnitLinksPayload,
} from "../schemas/users-gateway-schemas"
import {
  type UsersGateway,
  type UserMutationResult,
} from "./users-gateway-contracts"

function resolveUnitId(value: UnitLinksPayload | undefined) {
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

  return {
    authUserId: result.data.authUserId,
    id: result.data.id,
  }
}

export function createSupabaseUsersGateway(): UsersGateway {
  return {
    block(targetAuthUserId) {
      return invokeMutation(
        USERS_EDGE_FUNCTION.block,
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.block.error
      )
    },
    clearLock(targetAuthUserId) {
      return invokeMutation(
        USERS_EDGE_FUNCTION.clearLock,
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.clearLock.error
      )
    },
    create(command) {
      return invokeMutation(
        USERS_EDGE_FUNCTION.create,
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
    async findIdentity(userId) {
      const supabase = getSupabaseOrThrow()
      const response = await supabase
        .from(USERS_DATA_SOURCE.appUsersTable)
        .select(USER_IDENTITY_SELECT)
        .eq("id", userId)
        .maybeSingle()

      if (response.error) {
        throw new Error(usersCopy.errors.load, { cause: response.error })
      }

      if (!response.data) {
        return null
      }

      const result = userIdentityRowSchema.safeParse(response.data)

      if (!result.success) {
        throw new Error(usersCopy.errors.load, { cause: result.error })
      }

      return {
        authUserId: result.data.auth_user_id,
        id: result.data.id,
      }
    },
    async list() {
      const supabase = getSupabaseOrThrow()
      const [usersResponse, accessResponse, factorsResponse] =
        await Promise.all([
          supabase
            .from(USERS_DATA_SOURCE.appUsersTable)
            .select(USERS_LIST_SELECT)
            .order("name", { ascending: true }),
          supabase.rpc(USERS_DATA_SOURCE.lastAccessRpc),
          supabase.functions.invoke(USERS_EDGE_FUNCTION.authFactors, {
            body: {},
          }),
        ])

      if (usersResponse.error || accessResponse.error || factorsResponse.error) {
        throw new Error(usersCopy.errors.load, {
          cause:
            usersResponse.error ??
            accessResponse.error ??
            factorsResponse.error,
        })
      }

      const usersResult = appUserRowsSchema.safeParse(usersResponse.data ?? [])
      const accessResult = lastAccessRowsSchema.safeParse(
        accessResponse.data ?? []
      )
      const factorsResult = factorsResponseSchema.safeParse(
        factorsResponse.data
      )

      if (
        !usersResult.success ||
        !accessResult.success ||
        !factorsResult.success
      ) {
        throw new Error(usersCopy.errors.load, {
          cause:
            usersResult.error ??
            accessResult.error ??
            factorsResult.error,
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

      return usersResult.data.map<UserRecord>((row) => {
        if (!isUserRole(row.role) || !isAppUserStatus(row.status)) {
          throw new Error(usersCopy.errors.load)
        }

        const passkeyCount =
          passkeyCountByUserId.get(row.auth_user_id) ?? 0

        return {
          authUserId: row.auth_user_id,
          cpf: row.cpf_display ?? row.cpf_masked,
          email: row.email,
          id: row.id,
          lastAccessAt:
            lastAccessByUserId.get(row.auth_user_id) ?? null,
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
        USERS_EDGE_FUNCTION.resetPasskey,
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.resetPasskey.error
      )
    },
    resetPassword(targetAuthUserId) {
      return invokeMutation(
        USERS_EDGE_FUNCTION.resetPassword,
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.reset.error
      )
    },
    revokeSessions(targetAuthUserId) {
      return invokeMutation(
        USERS_EDGE_FUNCTION.revokeSessions,
        { targetUserId: targetAuthUserId },
        usersCopy.feedback.revokeSessions.error
      )
    },
    update(command) {
      return invokeMutation(
        USERS_EDGE_FUNCTION.update,
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
