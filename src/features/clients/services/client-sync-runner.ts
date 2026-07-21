import { type ClientSyncStatus } from "../model"

interface ClientSyncExecutionResult {
  status: ClientSyncStatus
}

interface ExecuteClientSyncWithRefreshOptions<TResult extends ClientSyncExecutionResult> {
  triggerSync: () => Promise<TResult>
  refreshSnapshots: () => Promise<unknown>
  isInProgressError: (error: unknown) => boolean
  onSuccess: () => void
  onWarning: () => void
  onError: () => void
}

export async function executeClientSyncWithRefresh<TResult extends ClientSyncExecutionResult>({
  triggerSync,
  refreshSnapshots,
  isInProgressError,
  onSuccess,
  onWarning,
  onError,
}: ExecuteClientSyncWithRefreshOptions<TResult>): Promise<void> {
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
