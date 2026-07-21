import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpRightIcon } from "lucide-react"
import { Link } from "react-router"

import {
  DataTableRowActions,
  DataTableTextAction,
  type DataTableRowAction,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import {
  notificationStatusLabels,
  notificationsCopy,
  notificationTypeLabels,
} from "../constants"
import {
  isInternalNotificationHref,
  type NotificationRecord,
} from "../model"

interface CreateNotificationsColumnsOptions {
  isNotificationUpdating?: (notificationId: string) => boolean
  onMarkAsRead?: (notification: NotificationRecord) => void
  onMarkAsUnread?: (notification: NotificationRecord) => void
  onOpenDetails?: (notification: NotificationRecord) => void
}

function resolveNotificationStatusBadge(status: NotificationRecord["status"]) {
  if (status === "read") {
    return {
      tone: "info" as const,
      variant: "default" as const,
    }
  }

  return {
    tone: "warning" as const,
    variant: "secondary" as const,
  }
}

export function createNotificationsColumns(
  options: CreateNotificationsColumnsOptions = {}
): ColumnDef<NotificationRecord>[] {
  return [
    {
      accessorKey: "occurredAt",
      cell: ({ row }) => formatDateTime(row.original.occurredAt),
      header: notificationsCopy.details.date,
      meta: { label: notificationsCopy.details.date },
    },
    {
      accessorKey: "title",
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            options.onOpenDetails?.(row.original)
          }}
        >
          {row.original.title}
        </DataTableTextAction>
      ),
      header: notificationsCopy.details.title,
      meta: { label: notificationsCopy.details.title },
    },
    {
      accessorKey: "description",
      cell: ({ row }) => (
        <span
          className="block max-w-[28rem] truncate"
          title={row.original.description}
        >
          {row.original.description}
        </span>
      ),
      header: notificationsCopy.details.description,
      meta: { label: notificationsCopy.details.description },
    },
    {
      accessorKey: "type",
      cell: ({ row }) => notificationTypeLabels[row.original.type],
      header: notificationsCopy.details.type,
      meta: { label: notificationsCopy.details.type },
    },
    {
      accessorKey: "status",
      cell: ({ row }) => {
        const badge = resolveNotificationStatusBadge(row.original.status)

        return (
          <div className="flex justify-center">
            <Badge
              variant={badge.variant}
              className={getBadgeToneClassName(badge.tone)}
            >
              {notificationStatusLabels[row.original.status]}
            </Badge>
          </div>
        )
      },
      enableSorting: false,
      header: () => <div className="text-center">{notificationsCopy.details.status}</div>,
      meta: { label: notificationsCopy.details.status },
    },
    {
      accessorKey: "href",
      cell: ({ row }) => {
        const href = row.original.href

        if (!isInternalNotificationHref(href)) {
          return notificationsCopy.details.emptyDestination
        }

        return (
          <Link
            to={href}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {href}
          </Link>
        )
      },
      header: notificationsCopy.details.destination,
      meta: { label: notificationsCopy.details.destination },
    },
    {
      cell: ({ row }) => {
        const isUpdating = options.isNotificationUpdating?.(row.original.id) ?? false
        const statusAction: DataTableRowAction<NotificationRecord> = isUpdating
          ? {
            disabled: true,
            id: "updating",
            label: notificationsCopy.actions.updating,
          }
          : row.original.status === "unread"
            ? {
              id: "mark-read",
              label: notificationsCopy.actions.markAsRead,
              onSelect: (currentRow) => {
                options.onMarkAsRead?.(currentRow.original)
              },
            }
            : {
              id: "mark-unread",
              label: notificationsCopy.actions.markAsUnread,
              onSelect: (currentRow) => {
                options.onMarkAsUnread?.(currentRow.original)
              },
            }
        const canOpenDestination = isInternalNotificationHref(row.original.href)
        const actions: DataTableRowAction<NotificationRecord>[] = [
          {
            id: "details",
            label: notificationsCopy.actions.openDetails,
            onSelect: (currentRow) => {
              options.onOpenDetails?.(currentRow.original)
            },
          },
          statusAction,
          ...(canOpenDestination
            ? [
              {
                id: "open-destination" as const,
                label: notificationsCopy.actions.openDestination,
                onSelect: (currentRow: { original: NotificationRecord }) => {
                  const href = currentRow.original.href

                  if (!isInternalNotificationHref(href) || typeof window === "undefined") {
                    return
                  }

                  window.location.assign(href)
                },
                shortcut: (
                  <ArrowUpRightIcon className="size-3 text-muted-foreground" />
                ),
              },
            ]
            : []),
        ]

        return (
          <div className="flex justify-end">
            <DataTableRowActions
              row={row}
              actions={actions}
              label={notificationsCopy.accessibility.openActions}
            />
          </div>
        )
      },
      enableHiding: false,
      enableSorting: false,
      header: () => <span className="sr-only">{notificationsCopy.table.actions}</span>,
      id: "actions",
      meta: { label: notificationsCopy.table.actions },
      size: 48,
    },
  ]
}
