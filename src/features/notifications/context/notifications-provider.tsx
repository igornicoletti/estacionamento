import * as React from "react"

import { canAccessProtectedApp } from "@/features/auth"
import { useAuth } from "@/features/auth"

import { notificationsCopy } from "../notifications-copy"
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsAsRead,
  setNotificationStatus,
  subscribeNotifications,
  type SetNotificationsStatusBatchResult,
} from "../services/notifications-service"
import {
  type NotificationRecord,
  type NotificationStatus,
} from "../types/notifications-types"

interface NotificationsState {
  data: NotificationRecord[]
  isLoading: boolean
  isRefreshing: boolean
  isUpdatingBatch: boolean
  updatingNotificationIds: ReadonlySet<string>
  unreadCount: number
  error: Error | null
}

type NotificationsLoadMode = "loading" | "refreshing"

type NotificationsAction =
  | { type: "load-started"; mode: NotificationsLoadMode }
  | { type: "loaded"; data: NotificationRecord[]; unreadCount: number }
  | { type: "failed"; error: Error }
  | { type: "batch-started" }
  | { type: "batch-finished" }
  | { type: "status-update-started"; id: string; status: NotificationStatus }
  | { type: "all-read-started" }
  | { type: "status-update-finished"; id: string }
  | { type: "reset" }

export interface NotificationsContextValue extends NotificationsState {
  refetch: () => Promise<void>
  updateStatus: (
    notificationId: string,
    status: NotificationStatus
  ) => Promise<NotificationRecord>
  markAllAsRead: () => Promise<SetNotificationsStatusBatchResult>
  isNotificationUpdating: (notificationId: string) => boolean
}

const initialState: NotificationsState = {
  data: [],
  error: null,
  isLoading: true,
  isRefreshing: false,
  isUpdatingBatch: false,
  updatingNotificationIds: new Set<string>(),
  unreadCount: 0,
}

const inactiveState: NotificationsState = {
  data: [],
  error: null,
  isLoading: false,
  isRefreshing: false,
  isUpdatingBatch: false,
  updatingNotificationIds: new Set<string>(),
  unreadCount: 0,
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null)

function toLoadError(error: unknown) {
  return error instanceof Error
    ? error
    : new Error(notificationsCopy.feedback.loadError)
}

function updateNotificationStatus(
  notifications: readonly NotificationRecord[],
  notificationId: string,
  status: NotificationStatus
) {
  return notifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, status }
      : notification
  )
}

function createNextUpdatingIds(
  currentIds: ReadonlySet<string>,
  action: "add" | "delete",
  notificationId: string
) {
  const nextIds = new Set(currentIds)

  if (action === "add") {
    nextIds.add(notificationId)
  } else {
    nextIds.delete(notificationId)
  }

  return nextIds
}

function resolveUnreadCountAfterStatusChange(
  notifications: readonly NotificationRecord[],
  currentUnreadCount: number,
  notificationId: string,
  nextStatus: NotificationStatus
) {
  const currentNotification = notifications.find(
    (notification) => notification.id === notificationId
  )

  if (!currentNotification || currentNotification.status === nextStatus) {
    return currentUnreadCount
  }

  if (nextStatus === "read") {
    return Math.max(0, currentUnreadCount - 1)
  }

  return currentUnreadCount + 1
}

function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction
): NotificationsState {
  if (action.type === "load-started") {
    return {
      ...state,
      error: null,
      isLoading: action.mode === "loading",
      isRefreshing: action.mode === "refreshing",
    }
  }

  if (action.type === "loaded") {
    return {
      ...state,
      data: action.data,
      error: null,
      unreadCount: action.unreadCount,
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

  if (action.type === "status-update-started") {
    return {
      ...state,
      data: updateNotificationStatus(state.data, action.id, action.status),
      unreadCount: resolveUnreadCountAfterStatusChange(
        state.data,
        state.unreadCount,
        action.id,
        action.status
      ),
      updatingNotificationIds: createNextUpdatingIds(
        state.updatingNotificationIds,
        "add",
        action.id
      ),
    }
  }

  if (action.type === "all-read-started") {
    return {
      ...state,
      data: state.data.map((notification) => ({
        ...notification,
        status: "read",
      })),
      unreadCount: 0,
    }
  }

  if (action.type === "status-update-finished") {
    return {
      ...state,
      updatingNotificationIds: createNextUpdatingIds(
        state.updatingNotificationIds,
        "delete",
        action.id
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
  const realtimeRefreshTimeoutRef = React.useRef<number | null>(null)
  const [state, dispatch] = React.useReducer(notificationsReducer, initialState)

  const loadNotifications = React.useCallback(
    async (mode: NotificationsLoadMode, shouldApplyResult: () => boolean = () => true) => {
      dispatch({ type: "load-started", mode })

      try {
        const [notifications, unreadCount] = await Promise.all([
          listNotifications(),
          countUnreadNotifications(),
        ])

        if (shouldApplyResult()) {
          dispatch({ type: "loaded", data: notifications, unreadCount })
        }
      } catch (caughtError) {
        if (shouldApplyResult()) {
          dispatch({ type: "failed", error: toLoadError(caughtError) })
        }
      }
    },
    []
  )

  const refetch = React.useCallback(async () => {
    if (!canLoadNotifications) {
      dispatch({ type: "reset" })
      return
    }

    await loadNotifications("loading")
  }, [canLoadNotifications, loadNotifications])

  React.useEffect(() => {
    let isCurrent = true

    if (!canLoadNotifications) {
      dispatch({ type: "reset" })
      return () => {
        isCurrent = false
      }
    }

    void loadNotifications("loading", () => isCurrent)

    return () => {
      isCurrent = false
    }
  }, [canLoadNotifications, loadNotifications, recipientAuthUserId])

  React.useEffect(() => {
    if (!canLoadNotifications) {
      return undefined
    }

    let isCurrent = true

    function clearScheduledRefresh() {
      if (realtimeRefreshTimeoutRef.current !== null) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current)
        realtimeRefreshTimeoutRef.current = null
      }
    }

    function scheduleRealtimeRefresh() {
      clearScheduledRefresh()
      realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
        realtimeRefreshTimeoutRef.current = null
        void loadNotifications("refreshing", () => isCurrent)
      }, 150)
    }

    const unsubscribe = subscribeNotifications(scheduleRealtimeRefresh, {
      recipientAuthUserId,
    })

    return () => {
      isCurrent = false
      clearScheduledRefresh()
      unsubscribe()
    }
  }, [canLoadNotifications, loadNotifications, recipientAuthUserId])

  const updateStatus = React.useCallback(
    async (notificationId: string, status: NotificationStatus) => {
      dispatch({ type: "status-update-started", id: notificationId, status })

      try {
        const updatedNotification = await setNotificationStatus(notificationId, status)
        await loadNotifications("refreshing")
        return updatedNotification
      } catch (caughtError) {
        await loadNotifications("refreshing")
        throw caughtError
      } finally {
        dispatch({ type: "status-update-finished", id: notificationId })
      }
    },
    [loadNotifications]
  )

  const markAllAsRead = React.useCallback(async () => {
    if (state.unreadCount === 0) {
      return {
        failed: [],
        total: 0,
        updated: 0,
      }
    }

    dispatch({ type: "batch-started" })
    dispatch({ type: "all-read-started" })

    try {
      const result = await markAllNotificationsAsRead()
      await loadNotifications("refreshing")
      return result
    } catch (caughtError) {
      await loadNotifications("refreshing")
      throw caughtError
    } finally {
      dispatch({ type: "batch-finished" })
    }
  }, [loadNotifications, state.unreadCount])

  const isNotificationUpdating = React.useCallback(
    (notificationId: string) => state.updatingNotificationIds.has(notificationId),
    [state.updatingNotificationIds]
  )

  const value = React.useMemo<NotificationsContextValue>(
    () => ({
      ...state,
      isNotificationUpdating,
      markAllAsRead,
      refetch,
      updateStatus,
    }),
    [
      isNotificationUpdating,
      markAllAsRead,
      refetch,
      state,
      updateStatus,
    ]
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
