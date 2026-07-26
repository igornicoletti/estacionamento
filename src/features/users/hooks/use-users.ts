import * as React from "react"

import {
  blockUser,
  createUser,
  listUsers,
  resetUserAccess,
  updateUser,
} from "../services/users-service"
import {
  type CreateUserInput,
  type UpdateUserInput,
  type UserRecord,
} from "../model"

const usersLoadError = "Nao foi possivel carregar os usuarios."

interface UseUsersOptions {
  enabled?: boolean
}

export function useUsers(options: UseUsersOptions = {}) {
  const isEnabled = options.enabled ?? true
  const [data, setData] = React.useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(isEnabled)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const loadUsers = React.useCallback(async (isCurrent: () => boolean) => {
    try {
      setIsLoading(true)
      setError(null)

      const users = await listUsers()

      if (isCurrent()) {
        setData(users)
      }
    } catch (caughtError) {
      if (isCurrent()) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error(usersLoadError)
        )
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false)
      }
    }
  }, [])

  const refetch = React.useCallback(() => {
    if (!isEnabled) {
      return Promise.resolve()
    }

    return loadUsers(() => true)
  }, [isEnabled, loadUsers])

  const addUser = React.useCallback(async (input: CreateUserInput) => {
    setIsSaving(true)
    setError(null)

    try {
      const createdUser = await createUser(input)
      setData((current) => [createdUser, ...current])
      return createdUser
    } catch (caughtError) {
      const nextError =
        caughtError instanceof Error
          ? caughtError
          : new Error("Nao foi possivel criar o usuario.")

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
      return updatedUser
    } catch (caughtError) {
      const nextError =
        caughtError instanceof Error
          ? caughtError
          : new Error("Nao foi possivel atualizar o usuario.")

      setError(nextError)
      throw nextError
    } finally {
      setIsSaving(false)
    }
  }, [])

  const inactivateUser = React.useCallback(async (userId: string) => {
    const updatedUser = await blockUser(userId)
    setData((current) =>
      current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    )
    return updatedUser
  }, [])

  const resetAccess = React.useCallback(async (userId: string) => {
    const updatedUser = await resetUserAccess(userId)
    setData((current) =>
      current.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    )
    return updatedUser
  }, [])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialUsers() {
      if (!isEnabled) {
        setIsLoading(false)
        return
      }

      try {
        const users = await listUsers()

        if (isMounted) {
          setData(users)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error(usersLoadError)
          )
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
  }, [isEnabled, loadUsers])

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
  }
}
