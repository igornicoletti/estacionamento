import * as React from "react"

import { canAccessProtectedApp } from "@/features/auth/contracts"
import { useAuth } from "@/features/auth/context"

import { notificationsCopy } from "../notifications-copy"
import {
  listNotifications,
  setNotificationStatus,
  setNotificationsStatus,
  subscribeNotifications,
  type SetNotificationsStatusBatchResult,
} from "../services/notifications-service"
import {
  type NotificationRecord,
  type NotificationStatus,
} from "../types/notifications-types"
import { getUnreadNotificationsCount } from "../utils/notifications-rules"

interface NotificationsState {
  data: NotificationRecord[]
  isLoading: boolean
  isRefreshing: boolean
  isUpdatingBatch: boolean
  error: Error | null
}

type NotificationsAction =
  | { type: "loading" }
  | { type: "refreshing" }
  | { type: "loaded"; data: NotificationRecord[] }
  | { type: "failed"; error: Error }
  | { type: "batch-started" }
  | { type: "batch-finished" }
  | { type: "status-updated"; id: string; status: NotificationStatus }
  | { type: "reset" }

export interface NotificationsContextValue extends NotificationsState {
  unreadCount: number
  refetch: () => Promise<void>
  updateStatus: (
    notificationId: string,
    status: NotificationStatus
  ) => Promise<NotificationRecord>
  markAllAsRead: () => Promise<SetNotificationsStatusBatchResult>
}

const initialState: NotificationsState = {
  data: [],
  error: null,
  isLoading: true,
  isRefreshing: false,
  isUpdatingBatch: false,
}

const inactiveState: NotificationsState = {
  data: [],
  error: null,
  isLoading: false,
  isRefreshing: false,
  isUpdatingBatch: false,
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null)

function toLoadError(error: unknown) {
  return error instanceof Error
    ? error
    : new Error(notificationsCopy.feedback.loadError)
}

function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction
): NotificationsState {
  if (action.type === "loading") {
    return {
      ...state,
      error: null,
      isLoading: true,
    }
  }

  if (action.type === "refreshing") {
    return {
      ...state,
      error: null,
      isRefreshing: true,
    }
  }

  if (action.type === "loaded") {
    return {
      ...state,
      data: action.data,
      error: null,
      isLoading: false,
      isRefreshing: false,
    }
  }

  if (action.type === "failed") {
    return {
      ...state,
      error: action.error,
      isLoading: false,
      isRefreshing: false,
    }
  }

  if (action.type === "batch-started") {
    return {
      ...state,
      isUpdatingBatch: true,
    }
  }

  if (action.type === "batch-finished") {
    return {
      ...state,
      isUpdatingBatch: false,
    }
  }

  if (action.type === "status-updated") {
    return {
      ...state,
      data: state.data.map((notification) =>
        notification.id === action.id
          ? { ...notification, status: action.status }
          : notification
      ),
    }
  }

  return inactiveState
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const canLoadNotifications =
    auth.isAuthenticated && canAccessProtectedApp(auth.profile?.status)
  const recipientAuthUserId = auth.profile?.authUserId ?? null
  const [state, dispatch] = React.useReducer(notificationsReducer, initialState)

  const loadNotifications = React.useCallback(async (mode: "loading" | "refreshing") => {
    dispatch({ type: mode })

    try {
      const notifications = await listNotifications()
      dispatch({ type: "loaded", data: notifications })
    } catch (caughtError) {
      dispatch({ type: "failed", error: toLoadError(caughtError) })
    }
  }, [])

  const refetch = React.useCallback(async () => {
    await loadNotifications("loading")
  }, [loadNotifications])

  React.useEffect(() => {
    let isCurrent = true

    async function loadInitialNotifications() {
      if (!canLoadNotifications) {
        if (isCurrent) {
          dispatch({ type: "reset" })
        }
        return
      }

      dispatch({ type: "loading" })

      try {
        const notifications = await listNotifications()

        if (isCurrent) {
          dispatch({ type: "loaded", data: notifications })
        }
      } catch (caughtError) {
        if (isCurrent) {
          dispatch({ type: "failed", error: toLoadError(caughtError) })
        }
      }
    }

    void loadInitialNotifications()

    return () => {
      isCurrent = false
    }
  }, [canLoadNotifications, recipientAuthUserId])

  React.useEffect(() => {
    if (!canLoadNotifications) {
      return undefined
    }

    let isCurrent = true

    async function syncFromSubscription() {
      try {
        const notifications = await listNotifications()

        if (isCurrent) {
          dispatch({ type: "loaded", data: notifications })
        }
      } catch (caughtError) {
        if (isCurrent) {
          dispatch({ type: "failed", error: toLoadError(caughtError) })
        }
      }
    }

    const unsubscribe = subscribeNotifications(
      () => {
        void syncFromSubscription()
      },
      { recipientAuthUserId }
    )

    return () => {
      isCurrent = false
      unsubscribe()
    }
  }, [canLoadNotifications, recipientAuthUserId])

  const updateStatus = React.useCallback(
    async (notificationId: string, status: NotificationStatus) => {
      dispatch({ type: "status-updated", id: notificationId, status })

      try {
        const updatedNotification = await setNotificationStatus(notificationId, status)
        await loadNotifications("refreshing")
        return updatedNotification
      } catch (caughtError) {
        await loadNotifications("refreshing")
        throw caughtError
      }
    },
    [loadNotifications]
  )

  const markAllAsRead = React.useCallback(async () => {
    const unreadIds = state.data
      .filter((notification) => notification.status === "unread")
      .map((notification) => notification.id)

    if (unreadIds.length === 0) {
      return {
        failed: [],
        total: 0,
        updated: 0,
      }
    }

    dispatch({ type: "batch-started" })

    for (const notificationId of unreadIds) {
      dispatch({ type: "status-updated", id: notificationId, status: "read" })
    }

    try {
      const result = await setNotificationsStatus(unreadIds, "read")
      await loadNotifications("refreshing")
      return result
    } catch (caughtError) {
      await loadNotifications("refreshing")
      throw caughtError
    } finally {
      dispatch({ type: "batch-finished" })
    }
  }, [loadNotifications, state.data])

  const unreadCount = React.useMemo(
    () => getUnreadNotificationsCount(state.data),
    [state.data]
  )

  const value = React.useMemo<NotificationsContextValue>(
    () => ({
      ...state,
      markAllAsRead,
      refetch,
      unreadCount,
      updateStatus,
    }),
    [markAllAsRead, refetch, state, unreadCount, updateStatus]
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications(): NotificationsContextValue {
  const context = React.useContext(NotificationsContext)

  if (!context) {
    throw new Error("useNotifications deve ser usado dentro de NotificationsProvider.")
  }

  return context
}
