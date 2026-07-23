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

type DataTableStorageOperation =
  | "read"
  | "write"
  | "remove"

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
  /**
   * false mantém a fatia somente em memória.
   */
  persist?: boolean

  read: (
    snapshot: DataTableStateSnapshot
  ) => TState | undefined

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

type DataTableStateUpdater<TState> =
  | TState
  | ((previous: TState) => TState)

function isPlainRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function normalizeStorageKey(
  value: string | undefined
): string | null {
  const normalizedValue = value?.trim() ?? ""

  return normalizedValue.length > 0
    ? normalizedValue
    : null
}

function normalizeStorageKeySegment(
  value: string,
  field: string
): string {
  const normalizedValue = value.trim()

  if (normalizedValue.length === 0) {
    throw new TypeError(
      `createDataTableStateStorageKey: ${field} deve conter texto.`
    )
  }

  return encodeURIComponent(normalizedValue)
}

export function createDataTableStateStorageKey({
  scope,
  tableId,
  application = "app",
}: CreateDataTableStorageKeyOptions): string {
  return [
    normalizeStorageKeySegment(
      application,
      "application"
    ),
    "data-table",
    normalizeStorageKeySegment(scope, "scope"),
    normalizeStorageKeySegment(
      tableId,
      "tableId"
    ),
    `v${DATA_TABLE_STORAGE_VERSION}`,
  ].join(":")
}

function isBooleanMap(
  value: unknown
): value is Record<string, boolean> {
  if (!isPlainRecord(value)) {
    return false
  }

  return Object.entries(value).every(
    ([key, entry]) =>
      key.trim().length > 0 &&
      typeof entry === "boolean"
  )
}

function sanitizeVisibilityState(
  value: unknown
): VisibilityState | undefined {
  if (!isBooleanMap(value)) {
    return undefined
  }

  return { ...value }
}

function sanitizeSortingState(
  value: unknown
): SortingState | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const sorting: SortingState = []
  const seenColumnIds = new Set<string>()

  for (const item of value) {
    if (!isPlainRecord(item)) {
      continue
    }

    const id =
      typeof item.id === "string"
        ? item.id.trim()
        : ""

    if (
      id.length === 0 ||
      typeof item.desc !== "boolean" ||
      seenColumnIds.has(id)
    ) {
      continue
    }

    seenColumnIds.add(id)

    sorting.push({
      id,
      desc: item.desc,
    })
  }

  return sorting
}

function sanitizePaginationState(
  value: unknown
): PaginationState | undefined {
  if (!isPlainRecord(value)) {
    return undefined
  }

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

  return {
    // O índice da página não é restaurado entre
    // sessões para evitar páginas vazias.
    pageIndex: 0,
    pageSize,
  }
}

function sanitizePersistedSnapshot(
  value: unknown
): DataTableStateSnapshot {
  if (!isPlainRecord(value)) {
    return {}
  }

  const snapshot: DataTableStateSnapshot = {}

  const columnVisibility =
    sanitizeVisibilityState(
      value.columnVisibility
    )

  if (columnVisibility !== undefined) {
    snapshot.columnVisibility =
      columnVisibility
  }

  const sorting = sanitizeSortingState(
    value.sorting
  )

  if (sorting !== undefined) {
    snapshot.sorting = sorting
  }

  const pagination =
    sanitizePaginationState(
      value.pagination
    )

  if (pagination !== undefined) {
    snapshot.pagination = pagination
  }

  return snapshot
}

function reportStorageError(
  onError:
    | DataTableStorageErrorHandler
    | undefined,
  operation: DataTableStorageOperation,
  storageKey: string,
  error: unknown
) {
  onError?.({
    operation,
    storageKey,
    error,
  })
}

function getLocalStorage(
  storageKey: string,
  operation: DataTableStorageOperation,
  onError?: DataTableStorageErrorHandler
): Storage | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window.localStorage
  } catch (error) {
    reportStorageError(
      onError,
      operation,
      storageKey,
      error
    )

    return null
  }
}

function parseStoredSnapshot(
  value: unknown
): DataTableStateSnapshot {
  if (
    isPlainRecord(value) &&
    (value.version === 1 ||
      value.version ===
      DATA_TABLE_STORAGE_VERSION) &&
    isPlainRecord(value.state)
  ) {
    return sanitizePersistedSnapshot(
      value.state
    )
  }

  /*
   * Migração do formato legado que armazenava
   * diretamente VisibilityState.
   */
  const legacyVisibility =
    sanitizeVisibilityState(value)

  if (legacyVisibility !== undefined) {
    return {
      columnVisibility:
        legacyVisibility,
    }
  }

  return {}
}

export function readDataTableSnapshot(
  storageKey: string,
  onError?: DataTableStorageErrorHandler
): DataTableStateSnapshot {
  const normalizedStorageKey =
    normalizeStorageKey(storageKey)

  if (!normalizedStorageKey) {
    return {}
  }

  const storage = getLocalStorage(
    normalizedStorageKey,
    "read",
    onError
  )

  if (!storage) {
    return {}
  }

  try {
    const raw = storage.getItem(
      normalizedStorageKey
    )

    if (!raw) {
      return {}
    }

    const parsed: unknown = JSON.parse(raw)

    return parseStoredSnapshot(parsed)
  } catch (error) {
    reportStorageError(
      onError,
      "read",
      normalizedStorageKey,
      error
    )

    return {}
  }
}

export function writeDataTableSnapshot(
  storageKey: string,
  snapshot: DataTableStateSnapshot,
  onError?: DataTableStorageErrorHandler
): boolean {
  const normalizedStorageKey =
    normalizeStorageKey(storageKey)

  if (!normalizedStorageKey) {
    return false
  }

  const storage = getLocalStorage(
    normalizedStorageKey,
    "write",
    onError
  )

  if (!storage) {
    return false
  }

  const payload: StoredDataTableStatePayload =
  {
    version:
      DATA_TABLE_STORAGE_VERSION,

    /*
     * Remove filtros, busca global,
     * seleção e pageIndex antes de gravar.
     */
    state:
      sanitizePersistedSnapshot(
        snapshot
      ),
  }

  try {
    storage.setItem(
      normalizedStorageKey,
      JSON.stringify(payload)
    )

    return true
  } catch (error) {
    reportStorageError(
      onError,
      "write",
      normalizedStorageKey,
      error
    )

    return false
  }
}

export function clearDataTableSnapshot(
  storageKey: string,
  onError?: DataTableStorageErrorHandler
): boolean {
  const normalizedStorageKey =
    normalizeStorageKey(storageKey)

  if (!normalizedStorageKey) {
    return false
  }

  const storage = getLocalStorage(
    normalizedStorageKey,
    "remove",
    onError
  )

  if (!storage) {
    return false
  }

  try {
    storage.removeItem(
      normalizedStorageKey
    )

    return true
  } catch (error) {
    reportStorageError(
      onError,
      "remove",
      normalizedStorageKey,
      error
    )

    return false
  }
}

function isUpdaterFunction<TState>(
  updater: DataTableStateUpdater<TState>
): updater is (
  previous: TState
) => TState {
  return typeof updater === "function"
}

function resolveUpdater<TState>(
  updater: DataTableStateUpdater<TState>,
  previous: TState
): TState {
  return isUpdaterFunction(updater)
    ? updater(previous)
    : updater
}

function shouldPersistState<TState>(
  storageKey: string | null,
  storageAdapter:
    | DataTableStateStorageAdapter<TState>
    | undefined
): storageAdapter is DataTableStateStorageAdapter<TState> {
  return (
    storageKey !== null &&
    storageAdapter !== undefined &&
    storageAdapter.persist !== false
  )
}

export const dataTableColumnVisibilityStateAdapter: DataTableStateStorageAdapter<VisibilityState> =
{
  persist: true,

  read: (snapshot) =>
    snapshot.columnVisibility,

  write: (snapshot, value) => ({
    ...snapshot,
    columnVisibility: value,
  }),
}

export const dataTableSortingStateAdapter: DataTableStateStorageAdapter<SortingState> =
{
  persist: true,

  read: (snapshot) =>
    snapshot.sorting,

  write: (snapshot, value) => ({
    ...snapshot,
    sorting: value,
  }),
}

export const dataTablePaginationStateAdapter: DataTableStateStorageAdapter<PaginationState> =
{
  persist: true,

  read: (snapshot) =>
    snapshot.pagination,

  write: (snapshot, value) => ({
    ...snapshot,
    pagination: {
      pageIndex: 0,
      pageSize: value.pageSize,
    },
  }),
}

/*
 * Estados abaixo continuam controláveis pelo hook,
 * porém não são persistidos no localStorage.
 */
export const dataTableColumnFiltersStateAdapter: DataTableStateStorageAdapter<ColumnFiltersState> =
{
  persist: false,

  read: (snapshot) =>
    snapshot.columnFilters,

  write: (snapshot, value) => ({
    ...snapshot,
    columnFilters: value,
  }),
}

export const dataTableRowSelectionStateAdapter: DataTableStateStorageAdapter<RowSelectionState> =
{
  persist: false,

  read: (snapshot) =>
    snapshot.rowSelection,

  write: (snapshot, value) => ({
    ...snapshot,
    rowSelection: value,
  }),
}

export const dataTableGlobalFilterStateAdapter: DataTableStateStorageAdapter<string> =
{
  persist: false,

  read: (snapshot) =>
    snapshot.globalFilter,

  write: (snapshot, value) => ({
    ...snapshot,
    globalFilter: value,
  }),
}

export function useControllableDataTableState<TState>({
  controlledValue,
  defaultValue,
  onChange,
  storageKey,
  storageAdapter,
  onStorageError,
}: UseControllableStateOptions<TState>) {
  const normalizedStorageKey =
    normalizeStorageKey(storageKey)

  const isControlled =
    controlledValue !== undefined

  const defaultValueRef =
    React.useRef(defaultValue)

  defaultValueRef.current = defaultValue

  const shouldPersist =
    shouldPersistState(
      normalizedStorageKey,
      storageAdapter
    )

  const [internalValue, setInternalValue] =
    React.useState<TState>(() => {
      if (isControlled) {
        return controlledValue
      }

      if (
        !shouldPersist ||
        !normalizedStorageKey
      ) {
        return defaultValue
      }

      const snapshot =
        readDataTableSnapshot(
          normalizedStorageKey,
          onStorageError
        )

      return (
        storageAdapter.read(snapshot) ??
        defaultValue
      )
    })

  const previousStorageConfigRef =
    React.useRef({
      storageKey: normalizedStorageKey,
      storageAdapter,
    })

  const skipNextPersistenceRef =
    React.useRef(false)

  /*
   * Reidrata quando usuário, tenant,
   * tabela ou adapter mudarem.
   */
  React.useEffect(() => {
    const previousConfig =
      previousStorageConfigRef.current

    const storageConfigChanged =
      previousConfig.storageKey !==
      normalizedStorageKey ||
      previousConfig.storageAdapter !==
      storageAdapter

    previousStorageConfigRef.current = {
      storageKey: normalizedStorageKey,
      storageAdapter,
    }

    if (
      isControlled ||
      !storageConfigChanged
    ) {
      return
    }

    const nextValue =
      shouldPersist &&
        normalizedStorageKey &&
        storageAdapter
        ? storageAdapter.read(
          readDataTableSnapshot(
            normalizedStorageKey,
            onStorageError
          )
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

  const resolvedValue = isControlled
    ? controlledValue
    : internalValue

  /*
   * Persiste o estado já resolvido.
   * Não há efeito colateral dentro do updater React.
   */
  React.useEffect(() => {
    if (
      !shouldPersist ||
      !normalizedStorageKey ||
      !storageAdapter
    ) {
      return
    }

    if (skipNextPersistenceRef.current) {
      skipNextPersistenceRef.current =
        false

      return
    }

    const currentSnapshot =
      readDataTableSnapshot(
        normalizedStorageKey,
        onStorageError
      )

    const nextSnapshot =
      storageAdapter.write(
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

  /*
   * Sincronização com outras abas da mesma origem.
   */
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

    function handleStorage(
      event: StorageEvent
    ) {
      if (
        event.key !==
        normalizedStorageKey
      ) {
        return
      }

      const nextValue =
        storageAdapter.read(
          readDataTableSnapshot(
            normalizedStorageKey,
            onStorageError
          )
        ) ?? defaultValueRef.current

      skipNextPersistenceRef.current =
        true

      setInternalValue(nextValue)
    }

    window.addEventListener(
      "storage",
      handleStorage
    )

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      )
    }
  }, [
    isControlled,
    normalizedStorageKey,
    onStorageError,
    shouldPersist,
    storageAdapter,
  ])

  const setValue =
    React.useCallback<OnChangeFn<TState>>(
      (updater) => {
        if (!isControlled) {
          setInternalValue((previous) =>
            resolveUpdater(
              updater,
              previous
            )
          )
        }

        onChange?.(updater)
      },
      [isControlled, onChange]
    )

  return [
    resolvedValue,
    setValue,
  ] as const
}
