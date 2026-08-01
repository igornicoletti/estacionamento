import * as React from "react"

import {
  type SyncExecutionSummary,
  type SyncProgress,
  type SyncResource,
} from "../model/sync-types"
import { executeManualSync } from "../services/sync-service"

export type SyncControllerPhase = "idle" | "running" | "success" | "error"

export function useSyncController(
  resource: SyncResource,
  onSynchronized?: () => void | Promise<void>
) {
  const [phase, setPhase] = React.useState<SyncControllerPhase>("idle")
  const [progress, setProgress] = React.useState<SyncProgress>({
    completedSteps: 0,
    totalSteps: resource === "clients" ? 9 : 1,
    estimatedSeconds: null,
  })
  const [summary, setSummary] = React.useState<SyncExecutionSummary | null>(null)
  const [error, setError] = React.useState<Error | null>(null)
  const [startedAt, setStartedAt] = React.useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)
  const runningRef = React.useRef(false)

  React.useEffect(() => {
    if (phase !== "running" || startedAt === null) return

    const updateElapsed = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1_000)))
    }
    updateElapsed()
    const intervalId = window.setInterval(updateElapsed, 1_000)

    return () => window.clearInterval(intervalId)
  }, [phase, startedAt])

  const start = React.useCallback(async () => {
    if (runningRef.current) return

    runningRef.current = true
    setPhase("running")
    setError(null)
    setSummary(null)
    setElapsedSeconds(0)
    setStartedAt(Date.now())
    setProgress({
      completedSteps: 0,
      totalSteps: resource === "clients" ? 9 : 1,
      estimatedSeconds: null,
    })

    try {
      const result = await executeManualSync(
        resource,
        "incremental",
        setProgress
      )
      setSummary(result)
      setPhase("success")
      void Promise.resolve(onSynchronized?.()).catch(() => undefined)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError
          : new Error("Não foi possível concluir a sincronização.")
      )
      setPhase("error")
    } finally {
      runningRef.current = false
    }
  }, [onSynchronized, resource])

  const reset = React.useCallback(() => {
    if (runningRef.current) return
    setPhase("idle")
    setSummary(null)
    setError(null)
    setStartedAt(null)
    setElapsedSeconds(0)
  }, [])

  const remainingSeconds = progress.estimatedSeconds === null
    ? null
    : Math.max(0, progress.estimatedSeconds - elapsedSeconds)

  return {
    elapsedSeconds,
    error,
    isBlocking: phase === "running",
    phase,
    progress,
    remainingSeconds,
    reset,
    start,
    summary,
  }
}
