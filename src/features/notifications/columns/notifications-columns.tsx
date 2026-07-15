import { type ColumnDef } from "@tanstack/react-table"
import { Link } from "react-router"

import {
  DataTableRowActions,
  DataTableTextAction,
  type DataTableRowAction,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import { ArrowUpRightIcon } from 'lucide-react'
import { notificationsCopy } from "../notifications-copy"
import {
  notificationStatusLabels,
  notificationTypeLabels,
  type NotificationRecord,
} from "../types/notifications-types"
import { isInternalNotificationHref } from "../utils/notifications-rules"

interface CreateNotificationsColumnsOptions {
  onOpenDetails?: (notification: NotificationRecord) => void
  onMarkAsRead?: (notification: NotificationRecord) => void
  onMarkAsUnread?: (notification: NotificationRecord) => void
  isNotificationUpdating?: (notificationId: string) => boolean
}

function resolveNotificationStatusVariant(status: NotificationRecord["status"]) {
  return status === "read" ? undefined : ("info" as const)
}

export function createNotificationsColumns(
  options: CreateNotificationsColumnsOptions = {}
): ColumnDef<NotificationRecord>[] {
  return [
    {
      accessorKey: "occurredAt",
      meta: { label: notificationsCopy.details.date },
      header: notificationsCopy.details.date,
      cell: ({ row }) => formatDateTime(row.original.occurredAt),
    },
    {
      accessorKey: "title",
      meta: { label: "Título" },
      header: "Título",
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            options.onOpenDetails?.(row.original)
          }}
        >
          {row.original.title}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "description",
      meta: { label: "Descrição" },
      header: "Descrição",
    },
    {
      accessorKey: "type",
      meta: { label: notificationsCopy.details.type },
      header: notificationsCopy.details.type,
      cell: ({ row }) => notificationTypeLabels[row.original.type],
    },
    {
      accessorKey: "status",
      meta: { label: notificationsCopy.details.status },
      header: () => <div className="text-center">{notificationsCopy.details.status}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(
              resolveNotificationStatusVariant(row.original.status)
            )}
          >
            {notificationStatusLabels[row.original.status]}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "href",
      meta: { label: notificationsCopy.details.destination },
      header: notificationsCopy.details.destination,
      cell: ({ row }) => {
        const href = row.original.href

        if (!isInternalNotificationHref(href)) {
          return notificationsCopy.details.emptyDestination
        }

        return (
          <Link className="font-medium" to={href}>
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
        const isUpdating = options.isNotificationUpdating?.(row.original.id) ?? false
        const actions: DataTableRowAction<NotificationRecord>[] = [
          {
            id: "details",
            label: notificationsCopy.actions.openDetails,
            onSelect: (currentRow) => {
              options.onOpenDetails?.(currentRow.original)
            },
          },
          {
            id: "mark-read",
            label: isUpdating
              ? notificationsCopy.actions.updating
              : notificationsCopy.actions.markAsRead,
            disabled: isUpdating || row.original.status === "read",
            onSelect: (currentRow) => {
              options.onMarkAsRead?.(currentRow.original)
            },
          },
          {
            id: "mark-unread",
            label: isUpdating
              ? notificationsCopy.actions.updating
              : notificationsCopy.actions.markAsUnread,
            disabled: isUpdating || row.original.status === "unread",
            onSelect: (currentRow) => {
              options.onMarkAsUnread?.(currentRow.original)
            },
          },
          {
            id: "open-destination",
            label: notificationsCopy.actions.openDestination,
            disabled: !isInternalNotificationHref(row.original.href),
            shortcut: isInternalNotificationHref(row.original.href) ? <ArrowUpRightIcon className='size-3 text-muted-foreground' /> : undefined,
            onSelect: (currentRow) => {
              const href = currentRow.original.href

              if (!isInternalNotificationHref(href) || typeof window === "undefined") {
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
