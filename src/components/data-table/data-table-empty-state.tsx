import * as React from "react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type DataTableEmptyStateActionVariant = NonNullable<
  React.ComponentProps<typeof Button>["variant"]
>

type DataTableEmptyStateActionSize = NonNullable<
  React.ComponentProps<typeof Button>["size"]
>

interface DataTableEmptyStateBaseProps {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
}

interface DataTableEmptyStateWithActionProps {
  actionLabel: string
  actionPendingLabel?: string
  actionIcon?: React.ReactNode
  actionVariant?: DataTableEmptyStateActionVariant
  actionSize?: DataTableEmptyStateActionSize
  actionDisabled?: boolean
  isActionPending?: boolean
  onAction: () => void
}

interface DataTableEmptyStateWithoutActionProps {
  actionLabel?: never
  actionPendingLabel?: never
  actionIcon?: never
  actionVariant?: never
  actionSize?: never
  actionDisabled?: never
  isActionPending?: never
  onAction?: never
}

export type DataTableEmptyStateProps = DataTableEmptyStateBaseProps &
  (
    | DataTableEmptyStateWithActionProps
    | DataTableEmptyStateWithoutActionProps
  )

function renderEmptyStateAction(
  props: DataTableEmptyStateProps
): React.ReactNode {
  if (typeof props.onAction !== "function") {
    return null
  }

  const actionLabel = props.actionLabel.trim()

  if (actionLabel.length === 0) {
    return null
  }

  const isActionPending = props.isActionPending ?? false
  const isActionDisabled = Boolean(props.actionDisabled) || isActionPending
  const displayedActionLabel = isActionPending
    ? props.actionPendingLabel?.trim() || actionLabel
    : actionLabel

  return (
    <Button
      type="button"
      variant={props.actionVariant ?? "secondary"}
      size={props.actionSize ?? "lg"}
      disabled={isActionDisabled}
      aria-busy={isActionPending || undefined}
      onClick={props.onAction}
    >
      {isActionPending ? (
        <Spinner
          data-icon="inline-start"
          aria-hidden="true"
          focusable="false"
        />
      ) : props.actionIcon ? (
        <span
          data-icon="inline-start"
          aria-hidden="true"
          className="inline-flex shrink-0"
        >
          {props.actionIcon}
        </span>
      ) : null}
      <span>{displayedActionLabel}</span>
    </Button>
  )
}

export function DataTableEmptyState(props: DataTableEmptyStateProps) {
  return (
    <AppEmptyState
      media={props.icon}
      title={props.title}
      description={props.description}
      actions={renderEmptyStateAction(props)}
    />
  )
}
