import { HistoryIcon, RefreshCwIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"

import { syncCopy } from "../constants/sync-copy"
import { type SyncResource } from "../model/sync-types"
import { SyncDialog } from "./sync-dialog"
import { SyncHistorySheet } from "./sync-history-sheet"

interface SyncOperationsProps {
  resource: SyncResource
  onSynchronized?: () => void | Promise<void>
}

export function SyncOperations({ resource, onSynchronized }: SyncOperationsProps) {
  const auth = useAuth()
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [syncOpen, setSyncOpen] = React.useState(false)
  const canExecute = auth.access.hasPermission(AUTH_PERMISSION.syncExecute)
  const canReadHistory =
    canExecute || auth.access.hasPermission(AUTH_PERMISSION.auditRead)

  if (!canReadHistory && !canExecute) return null

  return (
    <>
      {canReadHistory ? (
        <Button type="button" variant="secondary" onClick={() => setHistoryOpen(true)}>
          <HistoryIcon data-icon="inline-start" aria-hidden="true" />
          {syncCopy.actions.history}
        </Button>
      ) : null}
      {canExecute ? (
        <Button type="button" variant="secondary" onClick={() => setSyncOpen(true)}>
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
          {syncCopy.actions.synchronize}
        </Button>
      ) : null}

      <SyncHistorySheet
        open={historyOpen}
        resource={resource}
        onOpenChange={setHistoryOpen}
      />
      <SyncDialog
        open={syncOpen}
        resource={resource}
        onOpenChange={setSyncOpen}
        onSynchronized={onSynchronized}
      />
    </>
  )
}
