import * as React from "react"

import {
  syncDevelopmentSessionProfileFromUser,
} from "@/features/auth"
import { toError } from "@/lib"

import {
  blockUser,
  clearUserLock,
  createUser,
  listUsers,
  resetUserAccess,
  resetUserPasskey,
  revokeUserSessions,
  updateUser,
} from "../services/users-service"
import {
  type CreateUserInput,
  type UpdateUserInput,
  type UserRecord,
} from "../types/users-types"
import { usersCopy } from "../users-copy"

export function useUsers() {
  const [data, setData] = React.useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const loadUsers = React.useCallback(async (
    isCurrent: () => boolean,
    options: { setLoading?: boolean } = {}
  ) => {
    const shouldSetLoading = options.setLoading ?? true

    try {
      if (shouldSetLoading) {
        setIsLoading(true)
      }
      setError(null)

      const users = await listUsers()

      if (isCurrent()) {
        setData(users)
      }
    } catch (caughtError) {
      if (isCurrent()) {
        setError(
          toError(caughtError, usersCopy.errors.load)
        )
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false)
      }
    }
  }, [])

  const refetch = React.useCallback(() => {
    return loadUsers(() => true, { setLoading: true })
  }, [loadUsers])

  const addUser = React.useCallback(async (input: CreateUserInput) => {
    setIsSaving(true)
    setError(null)

    try {
      const createdUser = await createUser(input)
      setData((current) => [createdUser, ...current])
      return createdUser
    } catch (caughtError) {
      const nextError = toError(caughtError, usersCopy.errors.create)

      setError(nextError)
      throw nextError
    } finally {
      setIsSaving(false)
    }
  }, [])

  const editUser = React.useCallback(async (input: UpdateUserInput) => {
    setIsSaving(true)
    setError(null)

    try {
      const updatedUser = await updateUser(input)
      setData((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )

      syncDevelopmentSessionProfileFromUser(updatedUser)

      return updatedUser
    } catch (caughtError) {
      const nextError = toError(caughtError, usersCopy.errors.update)

      setError(nextError)
      throw nextError
    } finally {
      setIsSaving(false)
    }
  }, [])

  const inactivateUser = React.useCallback(async (userId: string) => {
    try {
      const updatedUser = await blockUser(userId)
      setData((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )
      return updatedUser
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.block.error)
    }
  }, [])

  const resetAccess = React.useCallback(async (userId: string) => {
    try {
      const updatedUser = await resetUserAccess(userId)
      setData((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )
      return updatedUser
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.reset.error)
    }
  }, [])

  const resetPasskey = React.useCallback(async (userId: string) => {
    try {
      const updatedUser = await resetUserPasskey(userId)
      setData((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )
      return updatedUser
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.resetPasskey.error)
    }
  }, [])

  const clearLock = React.useCallback(async (userId: string) => {
    try {
      const updatedUser = await clearUserLock(userId)
      setData((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )
      return updatedUser
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.clearLock.error)
    }
  }, [])

  const revokeSessions = React.useCallback(async (userId: string) => {
    try {
      const updatedUser = await revokeUserSessions(userId)
      setData((current) =>
        current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      )
      return updatedUser
    } catch (caughtError) {
      throw toError(caughtError, usersCopy.feedback.revokeSessions.error)
    }
  }, [])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialUsers() {
      try {
        const users = await listUsers()

        if (isMounted) {
          setData(users)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(toError(caughtError, usersCopy.errors.load))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialUsers()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    data,
    error,
    isLoading,
    isSaving,
    addUser,
    editUser,
    refetch,
    inactivateUser,
    resetAccess,
    resetPasskey,
    clearLock,
    revokeSessions,
  }
}
