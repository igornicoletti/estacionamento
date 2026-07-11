import * as React from "react"

import {
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

export interface DataTableStateSnapshot {
  columnFilters?: ColumnFiltersState
  columnVisibility?: VisibilityState
  globalFilter?: string
  pagination?: PaginationState
  rowSelection?: RowSelectionState
  sorting?: SortingState
}

interface StoredDataTableStatePayload {
  version: 1
  state: DataTableStateSnapshot
}

export interface DataTableStateStorageAdapter<TState> {
  read: (snapshot: DataTableStateSnapshot) => TState | undefined
  write: (snapshot: DataTableStateSnapshot, value: TState) => DataTableStateSnapshot
}

export const dataTableColumnVisibilityStateAdapter: DataTableStateStorageAdapter<VisibilityState> = {
  read: (snapshot) => snapshot.columnVisibility,
  write: (snapshot, value) => ({
    ...snapshot,
    columnVisibility: value,
  }),
}

export const dataTableColumnFiltersStateAdapter: DataTableStateStorageAdapter<ColumnFiltersState> = {
  read: (snapshot) => snapshot.columnFilters,
  write: (snapshot, value) => ({
    ...snapshot,
    columnFilters: value,
  }),
}

export const dataTableSortingStateAdapter: DataTableStateStorageAdapter<SortingState> = {
  read: (snapshot) => snapshot.sorting,
  write: (snapshot, value) => ({
    ...snapshot,
    sorting: value,
  }),
}

export const dataTablePaginationStateAdapter: DataTableStateStorageAdapter<PaginationState> = {
  read: (snapshot) => snapshot.pagination,
  write: (snapshot, value) => ({
    ...snapshot,
    pagination: value,
  }),
}

export const dataTableRowSelectionStateAdapter: DataTableStateStorageAdapter<RowSelectionState> = {
  read: (snapshot) => snapshot.rowSelection,
  write: (snapshot, value) => ({
    ...snapshot,
    rowSelection: value,
  }),
}

export const dataTableGlobalFilterStateAdapter: DataTableStateStorageAdapter<string> = {
  read: (snapshot) => snapshot.globalFilter,
  write: (snapshot, value) => ({
    ...snapshot,
    globalFilter: value,
  }),
}

export interface UseControllableStateOptions<TState> {
  controlledValue?: TState
  defaultValue: TState
  onChange?: OnChangeFn<TState>
  storageKey?: string
  storageAdapter?: DataTableStateStorageAdapter<TState>
}

type DataTableStateUpdater<TState> = TState | ((previous: TState) => TState)

function isDataTableStateUpdaterFunction<TState>(
  value: DataTableStateUpdater<TState>
): value is (previous: TState) => TState {
  return typeof value === "function"
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function isVersionedSnapshot(value: unknown): value is StoredDataTableStatePayload {
  return Boolean(
    value &&
    typeof value === "object" &&
    (value as StoredDataTableStatePayload).version === 1 &&
    typeof (value as StoredDataTableStatePayload).state === "object"
  )
}

function isBooleanMap(value: unknown) {
  if (!value || typeof value !== "object") {
    return false
  }

  return Object.values(value as Record<string, unknown>).every(
    (entry) => typeof entry === "boolean"
  )
}

export function readDataTableSnapshot(storageKey: string): DataTableStateSnapshot {
  if (!canUseStorage()) {
    return {}
  }

  const raw = window.localStorage.getItem(storageKey)

  if (!raw) {
    return {}
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (isVersionedSnapshot(parsed)) {
      return parsed.state
    }

    if (isBooleanMap(parsed)) {
      return {
        columnVisibility: parsed as VisibilityState,
      }
    }
  } catch {
    return {}
  }

  return {}
}

export function writeDataTableSnapshot(
  storageKey: string,
  snapshot: DataTableStateSnapshot
) {
  if (!canUseStorage()) {
    return
  }

  const payload: StoredDataTableStatePayload = {
    version: 1,
    state: snapshot,
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch {
    return
  }
}

export function useControllableDataTableState<TState>({
  controlledValue,
  defaultValue,
  onChange,
  storageKey,
  storageAdapter,
}: UseControllableStateOptions<TState>) {
  const [internalValue, setInternalValue] = React.useState<TState>(() => {
    if (controlledValue !== undefined) {
      return controlledValue
    }

    if (!storageKey || !storageAdapter) {
      return defaultValue
    }

    const snapshot = readDataTableSnapshot(storageKey)
    return storageAdapter.read(snapshot) ?? defaultValue
  })

  const setValue = React.useCallback(
    (updater: DataTableStateUpdater<TState>) => {
      if (onChange) {
        onChange(updater)
        return
      }

      if (controlledValue !== undefined) {
        return
      }

      setInternalValue((current) => {
        const nextValue = isDataTableStateUpdaterFunction(updater)
          ? updater(current)
          : updater

        if (storageKey && storageAdapter) {
          writeDataTableSnapshot(
            storageKey,
            storageAdapter.write(readDataTableSnapshot(storageKey), nextValue)
          )
        }

        return nextValue
      })
    },
    [controlledValue, onChange, storageAdapter, storageKey]
  )

  return [controlledValue ?? internalValue, setValue] as const
}
