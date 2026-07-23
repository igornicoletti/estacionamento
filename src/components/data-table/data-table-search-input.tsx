import { SearchIcon, XIcon } from "lucide-react"
import * as React from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

import { dataTableCopy } from "./data-table-copy"

type DataTableSearchInputNativeProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  | "aria-label"
  | "className"
  | "defaultValue"
  | "onChange"
  | "placeholder"
  | "value"
>

export interface DataTableSearchInputProps
  extends DataTableSearchInputNativeProps {
  value: string
  placeholder: string
  ariaLabel: string
  clearAriaLabel?: string
  loadingAnnouncement?: string
  isLoading?: boolean
  className?: string
  inputClassName?: string
  onValueChange: (value: string) => void
  onClear: () => void
}

function normalizeAccessibleText(
  value: string | undefined
): string {
  return value
    ?.trim()
    .replace(/\s+/gu, " ") ?? ""
}

export function DataTableSearchInput({
  value,
  placeholder,
  ariaLabel,
  clearAriaLabel,
  loadingAnnouncement,
  isLoading = false,
  className,
  inputClassName,
  disabled,
  readOnly,
  onKeyDown: externalOnKeyDown,
  onValueChange,
  onClear,
  ...inputProps
}: DataTableSearchInputProps) {
  const inputRef =
    React.useRef<HTMLInputElement>(null)

  const hasInputValue = value.length > 0

  const canClear =
    hasInputValue &&
    disabled !== true &&
    readOnly !== true

  const hasTrailingAddon =
    isLoading || canClear

  const resolvedAriaLabel =
    normalizeAccessibleText(ariaLabel) ||
    dataTableCopy.toolbar.search

  const resolvedPlaceholder =
    normalizeAccessibleText(placeholder) ||
    dataTableCopy.toolbar.searchPlaceholder

  const clearSearchPrefix =
    normalizeAccessibleText(
      dataTableCopy.accessibility
        .clearSearchPrefix
    ) || "Limpar busca"

  const resolvedClearAriaLabel =
    normalizeAccessibleText(
      clearAriaLabel
    ) ||
    `${clearSearchPrefix}: ${resolvedAriaLabel}`

  const resolvedLoadingAnnouncement =
    normalizeAccessibleText(
      loadingAnnouncement
    )

  function handleClear() {
    if (!canClear) {
      return
    }

    onClear()
    inputRef.current?.focus()
  }

  return (
    <InputGroup
      data-no-drag-scroll="true"
      data-loading={
        isLoading || undefined
      }
      aria-busy={
        isLoading || undefined
      }
      className={cn(
        "w-full lg:w-72 xl:w-80",
        className
      )}
    >
      <InputGroupInput
        {...inputProps}
        ref={inputRef}
        data-no-drag-scroll="true"
        aria-label={resolvedAriaLabel}
        placeholder={resolvedPlaceholder}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        className={inputClassName}
        onChange={(event) => {
          onValueChange(
            event.currentTarget.value
          )
        }}
        onKeyDown={(event) => {
          externalOnKeyDown?.(event)

          if (
            event.defaultPrevented ||
            event.nativeEvent.isComposing ||
            event.key !== "Escape" ||
            !canClear
          ) {
            return
          }

          event.preventDefault()
          event.stopPropagation()
          handleClear()
        }}
      />

      <InputGroupAddon align="inline-start">
        <SearchIcon
          aria-hidden="true"
          focusable="false"
        />
      </InputGroupAddon>

      {hasTrailingAddon ? (
        <InputGroupAddon align="inline-end">
          {isLoading ? (
            <Spinner
              role={undefined}
              aria-label={undefined}
              aria-hidden="true"
              focusable="false"
            />
          ) : null}

          {isLoading &&
            resolvedLoadingAnnouncement ? (
            <span
              role="status"
              className="sr-only"
            >
              {resolvedLoadingAnnouncement}
            </span>
          ) : null}

          {canClear ? (
            <InputGroupButton
              data-no-drag-scroll="true"
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                resolvedClearAriaLabel
              }
              onClick={handleClear}
            >
              <XIcon
                aria-hidden="true"
                focusable="false"
              />
            </InputGroupButton>
          ) : null}
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
