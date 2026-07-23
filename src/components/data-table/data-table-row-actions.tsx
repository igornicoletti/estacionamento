import { type Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

import { dataTableCopy } from "./data-table-copy"

type DataTableRowActionVariant = NonNullable<
  React.ComponentProps<
    typeof DropdownMenuItem
  >["variant"]
>

type DataTableRowActionsLabel<TData> =
  | string
  | ((row: Row<TData>) => string)

export interface DataTableRowAction<TData> {
  id: string
  label: string

  /**
   * Ícone decorativo exibido antes do label.
   */
  icon?: React.ReactNode

  /**
   * Desabilita explicitamente a ação.
   */
  disabled?: boolean

  /**
   * Explicação exibida quando a ação está indisponível.
   */
  disabledReason?: React.ReactNode

  /**
   * Texto secundário exibido abaixo do label.
   */
  description?: React.ReactNode

  /**
   * Estado assíncrono controlado pela feature.
   */
  pending?: boolean
  pendingLabel?: string

  /**
   * A ação é automaticamente desabilitada quando
   * este callback não é fornecido.
   */
  onSelect?: (row: Row<TData>) => void

  /**
   * Conteúdo visual exibido no final do item.
   */
  endContent?: React.ReactNode

  /**
   * Mantido para compatibilidade.
   * É apenas uma indicação visual e não registra
   * automaticamente um atalho de teclado.
   */
  shortcut?: React.ReactNode

  /**
   * Informe somente quando o atalho estiver
   * efetivamente implementado pela aplicação.
   */
  ariaKeyShortcuts?: string

  variant?: DataTableRowActionVariant
  separatorBefore?: boolean
}

export interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  actions: readonly DataTableRowAction<TData>[]
  label?: DataTableRowActionsLabel<TData>
  modal?: boolean
}

function normalizeVisibleText(
  value: string | undefined
): string {
  return value
    ?.trim()
    .replace(/\s+/gu, " ") ?? ""
}

function hasRenderableContent(
  value: React.ReactNode
): boolean {
  if (
    value === null ||
    value === undefined ||
    typeof value === "boolean"
  ) {
    return false
  }

  if (typeof value === "string") {
    return value.trim().length > 0
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
  }

  return true
}

function normalizeRowActions<TData>(
  actions: readonly DataTableRowAction<TData>[]
): DataTableRowAction<TData>[] {
  const seenIds = new Set<string>()
  const normalizedActions: DataTableRowAction<TData>[] = []

  for (const action of actions) {
    const id = action.id.trim()
    const label = normalizeVisibleText(action.label)

    if (
      id.length === 0 ||
      label.length === 0 ||
      seenIds.has(id)
    ) {
      continue
    }

    seenIds.add(id)

    const pendingLabel =
      normalizeVisibleText(action.pendingLabel)

    normalizedActions.push({
      ...action,
      id,
      label,
      pendingLabel:
        pendingLabel.length > 0
          ? pendingLabel
          : undefined,
      separatorBefore:
        normalizedActions.length > 0 &&
        action.separatorBefore === true,
    })
  }

  return normalizedActions
}

function resolveTriggerLabel<TData>(
  label: DataTableRowActionsLabel<TData> | undefined,
  row: Row<TData>
): string {
  const resolvedLabel =
    typeof label === "function"
      ? label(row)
      : label

  const normalizedLabel =
    normalizeVisibleText(resolvedLabel)

  return (
    normalizedLabel ||
    dataTableCopy.accessibility.openRowActions
  )
}

export function DataTableRowActions<TData>({
  row,
  actions,
  label,
  modal = false,
}: DataTableRowActionsProps<TData>) {
  const normalizedActions =
    normalizeRowActions(actions)

  if (normalizedActions.length === 0) {
    return null
  }

  const triggerLabel =
    resolveTriggerLabel(label, row)

  const hasPendingAction =
    normalizedActions.some(
      (action) => action.pending === true
    )

  return (
    <DropdownMenu modal={modal}>
      <DropdownMenuTrigger asChild>
        <Button
          data-no-drag-scroll="true"
          type="button"
          variant="ghost"
          size="icon-lg"
          className="data-[state=open]:bg-muted"
          aria-busy={hasPendingAction || undefined}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          {hasPendingAction ? (
            <Spinner
              role={undefined}
              aria-label={undefined}
              aria-hidden="true"
              focusable="false"
              className="size-4"
            />
          ) : (
            <MoreHorizontal
              aria-hidden="true"
              focusable="false"
              className="size-4"
            />
          )}

          <span className="sr-only">
            {triggerLabel}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        data-no-drag-scroll="true"
        align="end"
        className="w-56"
      >
        {normalizedActions.map((action) => {
          const isActionDisabled =
            action.disabled === true ||
            action.pending === true ||
            typeof action.onSelect !== "function"

          const displayedLabel =
            action.pending &&
              action.pendingLabel
              ? action.pendingLabel
              : action.label

          const secondaryContent =
            isActionDisabled &&
              hasRenderableContent(
                action.disabledReason
              )
              ? action.disabledReason
              : action.description

          const endContent =
            action.endContent ??
            action.shortcut

          return (
            <React.Fragment key={action.id}>
              {action.separatorBefore ? (
                <DropdownMenuSeparator />
              ) : null}

              <DropdownMenuItem
                variant={action.variant}
                disabled={isActionDisabled}
                aria-keyshortcuts={
                  action.ariaKeyShortcuts
                }
                className="items-start gap-2 py-2"
                onSelect={(event) => {
                  event.stopPropagation()

                  if (
                    isActionDisabled ||
                    !action.onSelect
                  ) {
                    return
                  }

                  action.onSelect(row)
                }}
              >
                {action.pending ? (
                  <Spinner
                    role={undefined}
                    aria-label={undefined}
                    aria-hidden="true"
                    focusable="false"
                    className="mt-0.5 size-4 shrink-0"
                  />
                ) : action.icon ? (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center [&>svg]:size-4"
                  >
                    {action.icon}
                  </span>
                ) : null}

                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate font-medium">
                    {displayedLabel}
                  </span>

                  {hasRenderableContent(
                    secondaryContent
                  ) ? (
                    <span className="text-xs leading-snug text-muted-foreground">
                      {secondaryContent}
                    </span>
                  ) : null}
                </span>

                {hasRenderableContent(endContent) ? (
                  <DropdownMenuShortcut
                    aria-hidden="true"
                  >
                    {endContent}
                  </DropdownMenuShortcut>
                ) : null}
              </DropdownMenuItem>
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
