type SyncExecutionStatus = "success" | "warning" | "failed"

interface SyncExecutionResult {
  status: SyncExecutionStatus
}

interface ExecuteSyncWithRefreshOptions<TResult extends SyncExecutionResult> {
  triggerSync: () => Promise<TResult>
  refreshSnapshots: () => Promise<unknown>
  isInProgressError: (error: unknown) => boolean
  onSuccess: () => void
  onWarning: () => void
  onError: () => void
}

export async function executeSyncWithRefresh<TResult extends SyncExecutionResult>({
  triggerSync,
  refreshSnapshots,
  isInProgressError,
  onSuccess,
  onWarning,
  onError,
}: ExecuteSyncWithRefreshOptions<TResult>): Promise<void> {
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
