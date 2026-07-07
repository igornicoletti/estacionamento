import { type ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router"

import {
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
  DataTableRowActions,
  type DataTableRowAction,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import {
  notificationStatusLabels,
  notificationTypeLabels,
  type NotificationRecord,
} from "../types/notifications-types"

interface CreateNotificationsColumnsOptions {
  onMarkAsRead?: (notification: NotificationRecord) => void
  onMarkAsUnread?: (notification: NotificationRecord) => void
}

function resolveNotificationStatusVariant(status: NotificationRecord["status"]) {
  return status === "read"
    ? undefined
    : ("info" as const)
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//")
}

function getNotificationDetails(notification: NotificationRecord) {
  return {
    title: notification.title,
    description: notification.description,
    items: [
      { label: "Tipo", value: notificationTypeLabels[notification.type] },
      { label: "Status", value: notificationStatusLabels[notification.status] },
      { label: "Data", value: formatDateTime(notification.occurredAt) },
      { label: "Destino", value: notification.href || "—" },
    ],
  }
}

export function createNotificationsColumns(
  options: CreateNotificationsColumnsOptions = {}
): ColumnDef<NotificationRecord>[] {
  return [
    {
      accessorKey: "title",
      meta: { label: "Título" },
      header: "Título",
      cell: ({ row }) => (
        <DataTableDetails
          {...getNotificationDetails(row.original)}
          trigger={
            <DataTableDetailsTextTrigger>
              {row.original.title}
            </DataTableDetailsTextTrigger>
          }
        />
      ),
    },
    {
      accessorKey: "description",
      meta: { label: "Descrição" },
      header: "Descrição",
    },
    {
      accessorKey: "type",
      meta: { label: "Tipo" },
      header: "Tipo",
      cell: ({ row }) => notificationTypeLabels[row.original.type],
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: () => <div className="text-center">Status</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(resolveNotificationStatusVariant(row.original.status))}
          >
            {notificationStatusLabels[row.original.status]}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "occurredAt",
      meta: { label: "Data" },
      header: "Data",
      cell: ({ row }) => formatDateTime(row.original.occurredAt),
    },
    {
      accessorKey: "href",
      meta: { label: "Destino" },
      header: "Destino",
      cell: ({ row }) => {
        const href = row.original.href

        if (!href || !isInternalHref(href)) {
          return "—"
        }

        return (
          <Link className="font-medium underline-offset-4 hover:underline" to={href}>
            {href}
          </Link>
        )
      },
    },
    {
      id: "actions",
      meta: { label: "Ações" },
      header: () => <span className="sr-only">Ações</span>,
      enableSorting: false,
      enableHiding: false,
      size: 48,
      cell: ({ row }) => {
        const detailsAction = createDataTableDetailsAction<NotificationRecord>(
          (currentRow) => getNotificationDetails(currentRow.original)
        )

        const actions: DataTableRowAction<NotificationRecord>[] = [
          detailsAction,
          {
            id: "mark-read",
            label: "Marcar como lida",
            onSelect: (currentRow) => {
              if (currentRow.original.status === "read") {
                return
              }

              options.onMarkAsRead?.(currentRow.original)
            },
          },
          {
            id: "mark-unread",
            label: "Marcar como não lida",
            onSelect: (currentRow) => {
              if (currentRow.original.status === "unread") {
                return
              }

              options.onMarkAsUnread?.(currentRow.original)
            },
          },
          {
            id: "open-destination",
            label: "Abrir destino",
            shortcut:
              row.original.href && isInternalHref(row.original.href)
                ? "↗"
                : undefined,
            onSelect: (currentRow) => {
              const href = currentRow.original.href

              if (!href || !isInternalHref(href) || typeof window === "undefined") {
                return
              }

              window.location.assign(href)
            },
          },
        ]

        return (
          <div className="flex justify-end">
            <DataTableRowActions
              row={row}
              actions={actions}
              label="Abrir ações da notificação"
            />
          </div>
        )
      },
    },
  ]
}
