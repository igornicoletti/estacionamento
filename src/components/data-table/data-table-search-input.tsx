import { SearchIcon, XIcon } from "lucide-react"
import * as React from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

import { dataTableCopy } from "./data-table-copy"
import { normalizeSearchValue } from "./data-table-filter-utils"

interface DataTableSearchInputProps {
  value: string
  placeholder: string
  ariaLabel: string
  isLoading?: boolean
  onValueChange: (value: string) => void
  onClear: () => void
}

export function DataTableSearchInput({
  value,
  placeholder,
  ariaLabel,
  isLoading = false,
  onValueChange,
  onClear,
}: DataTableSearchInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const hasValue = normalizeSearchValue(value).length > 0
  const hasTrailingAddon = isLoading || hasValue

  function handleClear() {
    onClear()
    inputRef.current?.focus()
  }

  return (
    <InputGroup className="w-full lg:w-72 xl:w-80">
      <InputGroupInput
        ref={inputRef}
        data-no-drag-scroll="true"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && hasValue) {
            event.preventDefault()
            handleClear()
          }
        }}
      />
      <InputGroupAddon align="inline-start">
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      {hasTrailingAddon ? (
        <InputGroupAddon align="inline-end">
          {isLoading ? <Spinner /> : null}
          {hasValue ? (
            <InputGroupButton
              data-no-drag-scroll="true"
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`${dataTableCopy.accessibility.clearSearchPrefix} ${ariaLabel}`}
              onClick={handleClear}
            >
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          ) : null}
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
