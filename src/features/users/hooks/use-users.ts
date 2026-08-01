import * as React from "react"

import { usersCopy } from "../constants/users-copy"
import {
  blockUser,
  clearUserLock,
  createUser,
  loadUsersWorkspace,
  resetUserAccess,
  resetUserPasskey,
  revokeUserSessions,
  updateUser,
} from "../services/users-service"
import {
  type CreateUserInput,
  type UnitCatalogItem,
  type UpdateUserInput,
  type UserRecord,
} from "../model/users-types"

interface UseUsersOptions {
  enabled?: boolean
}

type UsersMutationKind =
  | "block"
  | "clear-lock"
  | "create"
  | "reset-passkey"
  | "reset-password"
  | "revoke-sessions"
  | "update"

function sortUsers(users: readonly UserRecord[]) {
  return [...users].sort((left, right) =>
    left.name.localeCompare(right.name, "pt-BR", { sensitivity: "base" })
  )
}

export function useUsers(options: UseUsersOptions = {}) {
  const isEnabled = options.enabled ?? true
  const [data, setData] = React.useState<UserRecord[]>([])
  const [unitCatalog, setUnitCatalog] = React.useState<
    readonly UnitCatalogItem[]
  >([])
  const [unitCatalogError, setUnitCatalogError] =
    React.useState<Error | null>(null)
  const [isLoading, setIsLoading] = React.useState(isEnabled)
  const [mutationKind, setMutationKind] =
    React.useState<UsersMutationKind | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const loadGenerationRef = React.useRef(0)
  const mutationPendingRef = React.useRef(false)

  const loadUsers = React.useCallback(async () => {
    const generation = ++loadGenerationRef.current

    try {
      setIsLoading(true)
      setError(null)

      const snapshot = await loadUsersWorkspace()

      if (generation === loadGenerationRef.current) {
        setData(sortUsers(snapshot.users))
        setUnitCatalog(snapshot.unitCatalog)
        setUnitCatalogError(snapshot.unitCatalogError)
      }
    } catch (caughtError) {
      if (generation === loadGenerationRef.current) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error(usersCopy.errors.load)
        )
      }
    } finally {
      if (generation === loadGenerationRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const refetch = React.useCallback(() => {
    if (!isEnabled) {
      return Promise.resolve()
    }

    return loadUsers()
  }, [isEnabled, loadUsers])

  const runMutation = React.useCallback(
    async (
      kind: UsersMutationKind,
      operation: () => Promise<UserRecord>
    ) => {
      if (mutationPendingRef.current) {
        throw new Error(usersCopy.errors.operationInProgress)
      }

      mutationPendingRef.current = true
      setMutationKind(kind)

      try {
        const updatedUser = await operation()
        setData((current) =>
          sortUsers([
            updatedUser,
            ...current.filter((user) => user.id !== updatedUser.id),
          ])
        )
        return updatedUser
      } finally {
        mutationPendingRef.current = false
        setMutationKind(null)
      }
    },
    []
  )

  const addUser = React.useCallback(
    (input: CreateUserInput) =>
      runMutation("create", () => createUser(input)),
    [runMutation]
  )

  const editUser = React.useCallback(
    (input: UpdateUserInput) =>
      runMutation("update", () => updateUser(input)),
    [runMutation]
  )

  const block = React.useCallback(
    (user: UserRecord) =>
      runMutation("block", () => blockUser(user)),
    [runMutation]
  )

  const resetPassword = React.useCallback(
    (user: UserRecord) =>
      runMutation("reset-password", () => resetUserAccess(user)),
    [runMutation]
  )

  const resetPasskey = React.useCallback(
    (user: UserRecord) =>
      runMutation("reset-passkey", () => resetUserPasskey(user)),
    [runMutation]
  )

  const clearLock = React.useCallback(
    (user: UserRecord) =>
      runMutation("clear-lock", () => clearUserLock(user)),
    [runMutation]
  )

  const revokeSessions = React.useCallback(
    (user: UserRecord) =>
      runMutation("revoke-sessions", () => revokeUserSessions(user)),
    [runMutation]
  )

  React.useEffect(() => {
    if (!isEnabled) {
      loadGenerationRef.current += 1
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadUsers()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      loadGenerationRef.current += 1
    }
  }, [isEnabled, loadUsers])

  return {
    addUser,
    block,
    clearLock,
    data,
    editUser,
    error,
    isLoading: isEnabled && isLoading,
    isMutationPending: mutationKind !== null,
    isSaving: mutationKind === "create" || mutationKind === "update",
    mutationKind,
    refetch,
    resetPasskey,
    resetPassword,
    revokeSessions,
    unitCatalog,
    unitCatalogError,
  }
}
