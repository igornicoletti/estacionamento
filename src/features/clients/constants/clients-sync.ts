export const CLIENT_SYNC_FETCH_ERROR_MESSAGE = "Failed to fetch"
export const CLIENT_SYNC_FUNCTION_NAME = "clients-sync"
export const CLIENT_SYNC_IN_PROGRESS_ERROR_CODE = "sync_in_progress"

export const CLIENT_SYNC_RUN_MODES = ["full", "incremental"] as const
export const CLIENT_SYNC_TRIGGERS = ["automatic", "manual"] as const
export const CLIENT_SYNC_STATUSES = ["success", "warning", "failed"] as const

export const CLIENT_SYNC_DEFAULT_MODE = "incremental" satisfies (typeof CLIENT_SYNC_RUN_MODES)[number]
export const CLIENT_SYNC_MANUAL_TRIGGER = "manual" satisfies (typeof CLIENT_SYNC_TRIGGERS)[number]
export const CLIENT_SYNC_FAILED_STATUS = "failed" satisfies (typeof CLIENT_SYNC_STATUSES)[number]
export const CLIENT_SYNC_SUCCESS_STATUS = "success" satisfies (typeof CLIENT_SYNC_STATUSES)[number]
