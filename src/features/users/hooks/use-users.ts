import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { toError } from "@/lib"

import { USERS_CACHE_KEY, USERS_DISABLED_CACHE_KEY, usersCopy } from "../constants"
import {
  blockUser,
  clearUserLock,
  createUser,
  listUsers,
  resetUserAccess,
  resetUserPasskey,
  revokeUserSessions,
  updateUser,
} from "../services"
import { type CreateUserInput, type UpdateUserInput, type UserRecord } from "../model"

export function useUsers(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true
  const snapshot = useAsyncSnapshot<UserRecord[]>({
    cacheKey: enabled ? USERS_CACHE_KEY : USERS_DISABLED_CACHE_KEY,
    errorMessage: usersCopy.errors.load,
    initialData: [],
    loadData: enabled ? listUsers : async () => [],
  })
  const [isSaving, setIsSaving] = React.useState(false)
  const activeSaveRef = React.useRef<Promise<UserRecord> | null>(null)

  const runMutation = React.useCallback(async (mutation: () => Promise<UserRecord>) => {
    if (activeSaveRef.current) {
      return activeSaveRef.current
    }

    setIsSaving(true)
    activeSaveRef.current = mutation()

    try {
      const user = await activeSaveRef.current
      await snapshot.refetch()
      return user
    } finally {
      activeSaveRef.current = null
      setIsSaving(false)
    }
  }, [snapshot])

  const addUser = React.useCallback(async (input: CreateUserInput) => {
    try {
      return await runMutation(() => createUser(input))
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.errors.create)
    }
  }, [runMutation])

  const editUser = React.useCallback(async (input: UpdateUserInput) => {
    try {
      return await runMutation(() => updateUser(input))
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.errors.update)
    }
  }, [runMutation])

  const inactivateUser = React.useCallback(async (userId: string) => {
    try {
      return await runMutation(() => blockUser(userId))
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.block.error)
    }
  }, [runMutation])

  const resetAccess = React.useCallback(async (userId: string) => {
    try {
      return await runMutation(() => resetUserAccess(userId))
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.reset.error)
    }
  }, [runMutation])

  const resetPasskey = React.useCallback(async (userId: string) => {
    try {
      return await runMutation(() => resetUserPasskey(userId))
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.resetPasskey.error)
    }
  }, [runMutation])

  const clearLock = React.useCallback(async (userId: string) => {
    try {
      return await runMutation(() => clearUserLock(userId))
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.clearLock.error)
    }
  }, [runMutation])

  const revokeSessions = React.useCallback(async (userId: string) => {
    try {
      return await runMutation(() => revokeUserSessions(userId))
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.revokeSessions.error)
    }
  }, [runMutation])

  return {
    ...snapshot,
    isLoading: enabled ? snapshot.isLoading : false,
    isSaving,
    addUser,
    editUser,
    refetch: snapshot.refetch,
    inactivateUser,
    resetAccess,
    resetPasskey,
    clearLock,
    revokeSessions,
  }
}
