export const UNIT_SYNC_FETCH_ERROR_MESSAGE = "Failed to fetch"
export const UNIT_SYNC_FUNCTION_NAME = "units-sync"
export const UNIT_SYNC_IN_PROGRESS_ERROR_CODE = "sync_in_progress"

export const UNIT_SYNC_RUN_MODES = ["full", "incremental"] as const
export const UNIT_SYNC_TRIGGERS = ["automatic", "manual"] as const
export const UNIT_SYNC_STATUSES = ["success", "warning", "failed"] as const

export const UNIT_SYNC_DEFAULT_MODE = "incremental" satisfies (typeof UNIT_SYNC_RUN_MODES)[number]
export const UNIT_SYNC_MANUAL_TRIGGER = "manual" satisfies (typeof UNIT_SYNC_TRIGGERS)[number]
export const UNIT_SYNC_FAILED_STATUS = "failed" satisfies (typeof UNIT_SYNC_STATUSES)[number]
export const UNIT_SYNC_SUCCESS_STATUS = "success" satisfies (typeof UNIT_SYNC_STATUSES)[number]
