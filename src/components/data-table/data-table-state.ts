import * as React from "react"

import {
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"

const DATA_TABLE_STORAGE_VERSION = 2 as const

type DataTableStorageOperation = "read" | "write" | "remove"
type DataTableStateUpdater<TState> =
  | TState
  | ((previous: TState) => TState)

export interface DataTableStateSnapshot {
  columnFilters?: ColumnFiltersState
  columnVisibility?: VisibilityState
  globalFilter?: string
  pagination?: PaginationState
  rowSelection?: RowSelectionState
  sorting?: SortingState
}

interface StoredDataTableStatePayload {
  version: typeof DATA_TABLE_STORAGE_VERSION
  state: DataTableStateSnapshot
}

export interface DataTableStorageErrorContext {
  operation: DataTableStorageOperation
  storageKey: string
  error: unknown
}

export type DataTableStorageErrorHandler = (
  context: DataTableStorageErrorContext
) => void

export interface DataTableStateStorageAdapter<TState> {
  persist?: boolean
  read: (snapshot: DataTableStateSnapshot) => TState | undefined
  write: (
    snapshot: DataTableStateSnapshot,
    value: TState
  ) => DataTableStateSnapshot
}

export interface UseControllableStateOptions<TState> {
  controlledValue?: TState
  defaultValue: TState
  onChange?: OnChangeFn<TState>
  storageKey?: string
  storageAdapter?: DataTableStateStorageAdapter<TState>
  onStorageError?: DataTableStorageErrorHandler
}

export interface CreateDataTableStorageKeyOptions {
  scope: string
  tableId: string
  application?: string
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeStorageKey(value: string | undefined): string | null {
  const normalized = value?.trim() ?? ""
  return normalized.length > 0 ? normalized : null
}

function normalizeStorageKeySegment(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) {
    throw new TypeError(
      `createDataTableStateStorageKey: ${field} deve conter texto.`
    )
  }
  return encodeURIComponent(normalized)
}

export function createDataTableStateStorageKey({
  scope,
  tableId,
  application = "app",
}: CreateDataTableStorageKeyOptions): string {
  return [
    normalizeStorageKeySegment(application, "application"),
    "data-table",
    normalizeStorageKeySegment(scope, "scope"),
    normalizeStorageKeySegment(tableId, "tableId"),
    `v${DATA_TABLE_STORAGE_VERSION}`,
  ].join(":")
}

function sanitizeVisibilityState(value: unknown): VisibilityState | undefined {
  if (!isPlainRecord(value)) return undefined

  for (const [key, entry] of Object.entries(value)) {
    if (!key.trim() || typeof entry !== "boolean") return undefined
  }

  return { ...value } as VisibilityState
}

function sanitizeSortingState(value: unknown): SortingState | undefined {
  if (!Array.isArray(value)) return undefined

  const sorting: SortingState = []
  const seen = new Set<string>()

  for (const item of value) {
    if (!isPlainRecord(item)) continue
    const id = typeof item.id === "string" ? item.id.trim() : ""
    if (!id || typeof item.desc !== "boolean" || seen.has(id)) continue
    seen.add(id)
    sorting.push({ id, desc: item.desc })
  }

  return sorting
}

function sanitizePaginationState(value: unknown): PaginationState | undefined {
  if (!isPlainRecord(value)) return undefined

  const { pageIndex, pageSize } = value
  if (
    typeof pageIndex !== "number" ||
    !Number.isSafeInteger(pageIndex) ||
    pageIndex < 0 ||
    typeof pageSize !== "number" ||
    !Number.isSafeInteger(pageSize) ||
    pageSize <= 0
  ) {
    return undefined
  }

  return { pageIndex: 0, pageSize }
}

function sanitizePersistedSnapshot(value: unknown): DataTableStateSnapshot {
  if (!isPlainRecord(value)) return {}

  const snapshot: DataTableStateSnapshot = {}
  const columnVisibility = sanitizeVisibilityState(value.columnVisibility)
  const sorting = sanitizeSortingState(value.sorting)
  const pagination = sanitizePaginationState(value.pagination)

  if (columnVisibility !== undefined) snapshot.columnVisibility = columnVisibility
  if (sorting !== undefined) snapshot.sorting = sorting
  if (pagination !== undefined) snapshot.pagination = pagination

  return snapshot
}

function reportStorageError(
  onError: DataTableStorageErrorHandler | undefined,
  operation: DataTableStorageOperation,
  storageKey: string,
  error: unknown
) {
  onError?.({ operation, storageKey, error })
}

function getLocalStorage(
  storageKey: string,
  operation: DataTableStorageOperation,
  onError?: DataTableStorageErrorHandler
): Storage | null {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage
  } catch (error) {
    reportStorageError(onError, operation, storageKey, error)
    return null
  }
}

function parseStoredSnapshot(value: unknown): DataTableStateSnapshot {
  if (
    isPlainRecord(value) &&
    (value.version === 1 || value.version === DATA_TABLE_STORAGE_VERSION) &&
    isPlainRecord(value.state)
  ) {
    return sanitizePersistedSnapshot(value.state)
  }

  const legacyVisibility = sanitizeVisibilityState(value)
  return legacyVisibility ? { columnVisibility: legacyVisibility } : {}
}

export function readDataTableSnapshot(
  storageKey: string,
  onError?: DataTableStorageErrorHandler
): DataTableStateSnapshot {
  const key = normalizeStorageKey(storageKey)
  if (!key) return {}

  const storage = getLocalStorage(key, "read", onError)
  if (!storage) return {}

  try {
    const raw = storage.getItem(key)
    return raw ? parseStoredSnapshot(JSON.parse(raw) as unknown) : {}
  } catch (error) {
    reportStorageError(onError, "read", key, error)
    return {}
  }
}

export function writeDataTableSnapshot(
  storageKey: string,
  snapshot: DataTableStateSnapshot,
  onError?: DataTableStorageErrorHandler
): boolean {
  const key = normalizeStorageKey(storageKey)
  if (!key) return false

  const storage = getLocalStorage(key, "write", onError)
  if (!storage) return false

  const payload: StoredDataTableStatePayload = {
    version: DATA_TABLE_STORAGE_VERSION,
    state: sanitizePersistedSnapshot(snapshot),
  }

  try {
    storage.setItem(key, JSON.stringify(payload))
    return true
  } catch (error) {
    reportStorageError(onError, "write", key, error)
    return false
  }
}

export function clearDataTableSnapshot(
  storageKey: string,
  onError?: DataTableStorageErrorHandler
): boolean {
  const key = normalizeStorageKey(storageKey)
  if (!key) return false

  const storage = getLocalStorage(key, "remove", onError)
  if (!storage) return false

  try {
    storage.removeItem(key)
    return true
  } catch (error) {
    reportStorageError(onError, "remove", key, error)
    return false
  }
}

function resolveUpdater<TState>(
  updater: DataTableStateUpdater<TState>,
  previous: TState
): TState {
  return typeof updater === "function"
    ? (updater as (value: TState) => TState)(previous)
    : updater
}

function shouldPersistState<TState>(
  storageKey: string | null,
  adapter: DataTableStateStorageAdapter<TState> | undefined
): adapter is DataTableStateStorageAdapter<TState> {
  return Boolean(storageKey && adapter && adapter.persist !== false)
}

export const dataTableColumnVisibilityStateAdapter: DataTableStateStorageAdapter<VisibilityState> = {
  persist: true,
  read: (snapshot) => snapshot.columnVisibility,
  write: (snapshot, value) => ({ ...snapshot, columnVisibility: value }),
}

export const dataTableSortingStateAdapter: DataTableStateStorageAdapter<SortingState> = {
  persist: true,
  read: (snapshot) => snapshot.sorting,
  write: (snapshot, value) => ({ ...snapshot, sorting: value }),
}

export const dataTablePaginationStateAdapter: DataTableStateStorageAdapter<PaginationState> = {
  persist: true,
  read: (snapshot) => snapshot.pagination,
  write: (snapshot, value) => ({
    ...snapshot,
    pagination: { pageIndex: 0, pageSize: value.pageSize },
  }),
}

export const dataTableColumnFiltersStateAdapter: DataTableStateStorageAdapter<ColumnFiltersState> = {
  persist: false,
  read: (snapshot) => snapshot.columnFilters,
  write: (snapshot, value) => ({ ...snapshot, columnFilters: value }),
}

export const dataTableRowSelectionStateAdapter: DataTableStateStorageAdapter<RowSelectionState> = {
  persist: false,
  read: (snapshot) => snapshot.rowSelection,
  write: (snapshot, value) => ({ ...snapshot, rowSelection: value }),
}

export const dataTableGlobalFilterStateAdapter: DataTableStateStorageAdapter<string> = {
  persist: false,
  read: (snapshot) => snapshot.globalFilter,
  write: (snapshot, value) => ({ ...snapshot, globalFilter: value }),
}

export function useControllableDataTableState<TState>({
  controlledValue,
  defaultValue,
  onChange,
  storageKey,
  storageAdapter,
  onStorageError,
}: UseControllableStateOptions<TState>) {
  const normalizedStorageKey = normalizeStorageKey(storageKey)
  const isControlled = controlledValue !== undefined
  const defaultValueRef = React.useRef(defaultValue)

  React.useEffect(() => {
    defaultValueRef.current = defaultValue
  }, [defaultValue])

  const shouldPersist = shouldPersistState(
    normalizedStorageKey,
    storageAdapter
  )

  const [internalValue, setInternalValue] = React.useState<TState>(() => {
    if (isControlled) return controlledValue
    if (!shouldPersist || !normalizedStorageKey) return defaultValue

    const snapshot = readDataTableSnapshot(
      normalizedStorageKey,
      onStorageError
    )
    return storageAdapter.read(snapshot) ?? defaultValue
  })

  const previousStorageConfigRef = React.useRef({
    storageKey: normalizedStorageKey,
    storageAdapter,
  })
  const skipNextPersistenceRef = React.useRef(false)

  React.useEffect(() => {
    const previous = previousStorageConfigRef.current
    const changed =
      previous.storageKey !== normalizedStorageKey ||
      previous.storageAdapter !== storageAdapter

    previousStorageConfigRef.current = {
      storageKey: normalizedStorageKey,
      storageAdapter,
    }

    if (isControlled || !changed) return

    const nextValue =
      shouldPersist && normalizedStorageKey && storageAdapter
        ? storageAdapter.read(
            readDataTableSnapshot(normalizedStorageKey, onStorageError)
          ) ?? defaultValueRef.current
        : defaultValueRef.current

    skipNextPersistenceRef.current = true
    setInternalValue(nextValue)
  }, [
    isControlled,
    normalizedStorageKey,
    onStorageError,
    shouldPersist,
    storageAdapter,
  ])

  const resolvedValue = isControlled ? controlledValue : internalValue

  React.useEffect(() => {
    if (!shouldPersist || !normalizedStorageKey || !storageAdapter) return
    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current = false
      return
    }

    const currentSnapshot = readDataTableSnapshot(
      normalizedStorageKey,
      onStorageError
    )
    const nextSnapshot = storageAdapter.write(
      currentSnapshot,
      resolvedValue
    )
    writeDataTableSnapshot(
      normalizedStorageKey,
      nextSnapshot,
      onStorageError
    )
  }, [
    normalizedStorageKey,
    onStorageError,
    resolvedValue,
    shouldPersist,
    storageAdapter,
  ])

  React.useEffect(() => {
    if (
      isControlled ||
      !shouldPersist ||
      !normalizedStorageKey ||
      !storageAdapter ||
      typeof window === "undefined"
    ) {
      return
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== normalizedStorageKey) return

      const nextValue =
        storageAdapter!.read(
          readDataTableSnapshot(normalizedStorageKey!, onStorageError)
        ) ?? defaultValueRef.current

      skipNextPersistenceRef.current = true
      setInternalValue(nextValue)
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [
    isControlled,
    normalizedStorageKey,
    onStorageError,
    shouldPersist,
    storageAdapter,
  ])

  const setValue = React.useCallback<OnChangeFn<TState>>(
    (updater) => {
      if (!isControlled) {
        setInternalValue((previous) => resolveUpdater(updater, previous))
      }
      onChange?.(updater)
    },
    [isControlled, onChange]
  )

  return [resolvedValue, setValue] as const
}
