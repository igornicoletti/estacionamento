import { syncCopy } from "../constants"
import { type SyncRunMode, type SyncRunStatus, type SyncRunTrigger } from "./sync-history-schemas"

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

export function formatSyncDateTime(value: string | null) {
  if (!value) {
    return syncCopy.history.details.emptyValue
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return syncCopy.history.details.emptyValue
  }

  return dateTimeFormatter.format(date)
}

export function formatSyncDuration(durationSeconds: number | null) {
  if (durationSeconds === null || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return syncCopy.history.details.emptyValue
  }

  const normalizedSeconds = Math.trunc(durationSeconds)
  const minutes = Math.floor(normalizedSeconds / 60)
  const seconds = normalizedSeconds % 60

  if (minutes === 0) {
    return `${seconds}s`
  }

  return `${minutes}min ${seconds}s`
}

export function getSyncRunModeLabel(mode: SyncRunMode) {
  return syncCopy.history.mode[mode]
}

export function getSyncRunTriggerLabel(trigger: SyncRunTrigger) {
  return syncCopy.history.trigger[trigger]
}

export function getSyncRunStatusLabel(status: SyncRunStatus) {
  return syncCopy.history.status[status]
}
