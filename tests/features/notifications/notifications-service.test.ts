import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  countUnreadNotifications,
  listNotifications,
  setNotificationsGateway,
  setNotificationsStatus,
  type NotificationRecord,
} from "@/features/notifications"

import { createMemoryNotificationsGateway } from "../../helpers/notifications-memory-gateway"

const notificationsFixture: NotificationRecord[] = [
  {
    description: "Mensagem de teste.",
    href: "/clientes",
    id: "N-001",
    occurredAt: "2026-07-01T08:25:00.000Z",
    status: "unread",
    title: "Sincronização concluída",
    type: "sync",
  },
  {
    description: "Mensagem de segurança.",
    href: "/perfil",
    id: "N-002",
    occurredAt: "2026-07-01T07:58:00.000Z",
    status: "unread",
    title: "Nova tentativa de acesso",
    type: "security",
  },
]

afterEach(() => {
  setNotificationsGateway(createMemoryNotificationsGateway([]))
})

describe("notifications-service", () => {
  beforeEach(() => {
    setNotificationsGateway(createMemoryNotificationsGateway(notificationsFixture))
  })

  it("updates unread notifications in batch and reports summary", async () => {
    const beforeUnread = await countUnreadNotifications()

    expect(beforeUnread).toBeGreaterThan(0)

    const current = await listNotifications()
    const unreadIds = current
      .filter((notification) => notification.status === "unread")
      .map((notification) => notification.id)

    const result = await setNotificationsStatus(unreadIds, "read")

    expect(result.total).toBe(unreadIds.length)
    expect(result.failed).toEqual([])
    expect(result.updated).toBe(unreadIds.length)
    await expect(countUnreadNotifications()).resolves.toBe(0)
  })

  it("keeps working when batch contains repeated or invalid ids", async () => {
    const result = await setNotificationsStatus([
      "N-001",
      "N-001",
      "N-404",
    ], "read")

    expect(result.total).toBe(2)
    expect(result.updated).toBe(1)
    expect(result.failed).toEqual(["N-404"])
  })
})
