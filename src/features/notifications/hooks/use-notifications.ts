import * as React from "react"

import {
  listNotifications,
  setNotificationStatus,
  setNotificationsStatus,
  subscribeNotifications,
} from "../services/notifications-service"
import {
  type NotificationRecord,
  type NotificationStatus,
} from "../types/notifications-types"
import { getUnreadNotificationsCount } from "../utils/notifications-rules"

const notificationsLoadError = "Não foi possível carregar as notificações."

async function fetchNotificationsSnapshot() {
  const notifications = await listNotifications()
  const unread = getUnreadNotificationsCount(notifications)

  return { notifications, unread }
}

export function useNotifications() {
  const [data, setData] = React.useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUpdatingBatch, setIsUpdatingBatch] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const loadNotifications = React.useCallback(async (
    isCurrent: () => boolean,
    options: { setLoading?: boolean } = {}
  ) => {
    const shouldSetLoading = options.setLoading ?? true

    try {
      if (shouldSetLoading) {
        setIsLoading(true)
      }
      setError(null)

      const { notifications, unread } = await fetchNotificationsSnapshot()

      if (isCurrent()) {
        setData(notifications)
        setUnreadCount(unread)
      }
    } catch (caughtError) {
      if (isCurrent()) {
        setError(
          caughtError instanceof Error
            ? caughtError
            : new Error(notificationsLoadError)
        )
      }
    } finally {
      if (isCurrent()) {
        setIsLoading(false)
      }
    }
  }, [])

  const refetch = React.useCallback(() => {
    return loadNotifications(() => true, { setLoading: true })
  }, [loadNotifications])

  const updateStatus = React.useCallback(
    async (notificationId: string, status: NotificationStatus) => {
      const nextNotification = await setNotificationStatus(notificationId, status)
      const { notifications, unread } = await fetchNotificationsSnapshot()

      setData(notifications)
      setUnreadCount(unread)

      return nextNotification
    },
    []
  )

  const markAllAsRead = React.useCallback(async () => {
    const unreadIds = data
      .filter((notification) => notification.status === "unread")
      .map((notification) => notification.id)

    if (unreadIds.length === 0) {
      return {
        total: 0,
        updated: 0,
        failed: [],
      }
    }

    setIsUpdatingBatch(true)

    try {
      const result = await setNotificationsStatus(unreadIds, "read")
      const { notifications, unread } = await fetchNotificationsSnapshot()

      setData(notifications)
      setUnreadCount(unread)

      return result
    } finally {
      setIsUpdatingBatch(false)
    }
  }, [data])

  React.useEffect(() => {
    let isMounted = true

    async function loadInitialNotifications() {
      try {
        const { notifications, unread } = await fetchNotificationsSnapshot()

        if (isMounted) {
          setData(notifications)
          setUnreadCount(unread)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error(notificationsLoadError)
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    async function syncNotificationsFromSubscription() {
      try {
        const { notifications, unread } = await fetchNotificationsSnapshot()

        if (isMounted) {
          setData(notifications)
          setUnreadCount(unread)
          setError(null)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error(notificationsLoadError)
          )
        }
      }
    }

    void loadInitialNotifications()

    const unsubscribe = subscribeNotifications(() => {
      void syncNotificationsFromSubscription()
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [loadNotifications])

  return {
    data,
    unreadCount,
    error,
    isLoading,
    isUpdatingBatch,
    refetch,
    updateStatus,
    markAllAsRead,
  }
}
