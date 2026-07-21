import { type UnitSyncRunStatus } from "../model"

interface UnitSyncExecutionResult {
  status: UnitSyncRunStatus
}

interface ExecuteUnitSyncWithRefreshOptions<TResult extends UnitSyncExecutionResult> {
  triggerSync: () => Promise<TResult>
  refreshSnapshots: () => Promise<unknown>
  isInProgressError: (error: unknown) => boolean
  onSuccess: () => void
  onWarning: () => void
  onError: () => void
}

export async function executeUnitSyncWithRefresh<TResult extends UnitSyncExecutionResult>({
  triggerSync,
  refreshSnapshots,
  isInProgressError,
  onSuccess,
  onWarning,
  onError,
}: ExecuteUnitSyncWithRefreshOptions<TResult>): Promise<void> {
  try {
    const result = await triggerSync()
    await refreshSnapshots()
    if (result.status === "failed") {
      onError()
      return
    }
    if (result.status === "warning") {
      onWarning()
      return
    }
    onSuccess()
  } catch (caughtError) {
    await refreshSnapshots()
    if (isInProgressError(caughtError)) {
      onWarning()
      return
    }
    onError()
  }
}
