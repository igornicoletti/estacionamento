import { DatabaseIcon, ShieldAlertIcon } from "lucide-react"
import * as React from "react"
import { Navigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { DataTable } from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppDialog } from "@/components/shared/app-dialog"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppPasswordField } from "@/components/shared/app-password-field"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { newPasswordSchema } from "@/features/auth/validation"

import { AccessRequestDenySummary } from "../components"
import { accessRequestsCopy, ACCESS_REQUESTS_RECOVERY_TABLE_STATE_KEY } from "../constants"
import { useAccessRequests } from "../hooks"
import type {
  AccessRecoveryRequestRecord,
  AccessRequestDetailsTarget,
  AccessRequestReviewDecision,
} from "../model"
import {
  getAccessRequestDetailItems,
  getAccessRequestDetailsDescription,
  getAccessRequestDetailsTitle,
} from "../model"
import { createRecoveryRequestsColumns } from "../table"

interface PendingRecoveryReview {
  decision: AccessRequestReviewDecision
  request: AccessRecoveryRequestRecord
}

interface AccessRequestsPanelProps {
  canReview?: boolean
  showHeader?: boolean
}

function getRecoveryDialogTitle(decision: AccessRequestReviewDecision) {
  return decision === "approved"
    ? accessRequestsCopy.dialogs.approveTitle
    : accessRequestsCopy.dialogs.denyTitle
}

function getRecoveryDialogDescription(decision: AccessRequestReviewDecision) {
  return decision === "approved"
    ? accessRequestsCopy.dialogs.approveDescription
    : accessRequestsCopy.dialogs.denyDescription
}

function getPasswordError(value: string) {
  const result = newPasswordSchema.safeParse(value.trim())

  return result.success ? null : result.error.issues[0]?.message ?? null
}

export function AccessRequestsPanel({ canReview = true, showHeader = true }: AccessRequestsPanelProps = {}) {
  const { data, error, isLoading, isReviewing, refetch, reviewRecovery } = useAccessRequests()
  const [recoverySearch, setRecoverySearch] = React.useState("")
  const [detailsTarget, setDetailsTarget] = React.useState<AccessRequestDetailsTarget | null>(null)
  const [pendingRecoveryReview, setPendingRecoveryReview] = React.useState<PendingRecoveryReview | null>(null)
  const [temporaryPassword, setTemporaryPassword] = React.useState("")
  const [isPasswordTouched, setIsPasswordTouched] = React.useState(false)

  const passwordError = React.useMemo(() => getPasswordError(temporaryPassword), [temporaryPassword])
  const showPasswordError =
    Boolean(isPasswordTouched && passwordError) && pendingRecoveryReview?.decision === "approved"
  const isApprovalPasswordInvalid =
    pendingRecoveryReview?.decision === "approved" && Boolean(passwordError)

  const recoveryColumns = React.useMemo(
    () =>
      createRecoveryRequestsColumns({
        canReview,
        onOpenDetails: (request) => {
          setDetailsTarget({ request, type: "recovery" })
        },
        onReview: (request, decision) => {
          setPendingRecoveryReview({ decision, request })
          setTemporaryPassword("")
          setIsPasswordTouched(false)
        },
      }),
    [canReview]
  )

  const resetPendingReview = React.useCallback(() => {
    setPendingRecoveryReview(null)
    setTemporaryPassword("")
    setIsPasswordTouched(false)
  }, [])

  const handleConfirmRecoveryReview = React.useCallback(async () => {
    if (!pendingRecoveryReview) {
      return
    }

    if (pendingRecoveryReview.decision === "approved") {
      setIsPasswordTouched(true)
    }

    if (isApprovalPasswordInvalid) {
      return
    }

    const { decision, request } = pendingRecoveryReview

    await notify.track(
      reviewRecovery(
        request.id,
        decision,
        decision === "approved" ? temporaryPassword.trim() : undefined
      ),
      {
        error: accessRequestsCopy.feedback.recovery[decision].error,
        loading: accessRequestsCopy.feedback.recovery[decision].loading,
        success: accessRequestsCopy.feedback.recovery[decision].success,
      }
    )

    resetPendingReview()
  }, [isApprovalPasswordInvalid, pendingRecoveryReview, resetPendingReview, reviewRecovery, temporaryPassword])

  return (
    <>
      {showHeader ? (
        <PageHeader title={accessRequestsCopy.page.title} subtitle={accessRequestsCopy.page.subtitle} />
      ) : null}

      <DataTable
        columns={recoveryColumns}
        data={data.recoveryRequests}
        getRowId={(request) => request.id}
        globalSearch={{
          columnIds: ["phoneMasked", "email", "description"],
          placeholder: accessRequestsCopy.tables.recovery.searchPlaceholder,
        }}
        globalFilterValue={recoverySearch}
        onGlobalFilterChange={setRecoverySearch}
        emptyState={
          <AppEmptyState
            media={<DatabaseIcon />}
            title={accessRequestsCopy.tables.recovery.emptyTitle}
            description={accessRequestsCopy.tables.recovery.emptyDescription}
          />
        }
        filteredEmptyState={
          <AppEmptyState
            media={<DatabaseIcon />}
            title={accessRequestsCopy.tables.recovery.filteredEmptyTitle}
            description={accessRequestsCopy.tables.recovery.filteredEmptyDescription}
          />
        }
        tableStateStorageKey={ACCESS_REQUESTS_RECOVERY_TABLE_STATE_KEY}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(detailsTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsTarget(null)
          }
        }}
        title={getAccessRequestDetailsTitle(detailsTarget)}
        description={getAccessRequestDetailsDescription(detailsTarget)}
        items={getAccessRequestDetailItems(detailsTarget)}
      />

      <AppDialog
        open={pendingRecoveryReview?.decision === "approved"}
        onOpenChange={(open) => {
          if (!open) {
            resetPendingReview()
          }
        }}
        title={
          pendingRecoveryReview ? getRecoveryDialogTitle(pendingRecoveryReview.decision) : undefined
        }
        description={
          pendingRecoveryReview ? getRecoveryDialogDescription(pendingRecoveryReview.decision) : undefined
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isReviewing}
              onClick={resetPendingReview}
            >
              {accessRequestsCopy.actions.cancel}
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={isReviewing || isApprovalPasswordInvalid}
              onClick={() => {
                void handleConfirmRecoveryReview()
              }}
            >
              {accessRequestsCopy.actions.confirmApprove}
            </Button>
          </>
        }
      >
        <AppPasswordField
          id="access-request-temporary-password"
          label={accessRequestsCopy.dialogs.temporaryPasswordLabel}
          value={temporaryPassword}
          onChange={(event) => {
            setTemporaryPassword(event.target.value)
            setIsPasswordTouched(true)
          }}
          error={showPasswordError ? passwordError ?? undefined : undefined}
          disabled={isReviewing}
          autoComplete="new-password"
          description={accessRequestsCopy.dialogs.temporaryPasswordHint}
          required
        />
      </AppDialog>

      <AppAlertDialog
        open={pendingRecoveryReview?.decision === "denied"}
        onOpenChange={(open) => {
          if (!open) {
            resetPendingReview()
          }
        }}
        media={<ShieldAlertIcon />}
        title={accessRequestsCopy.dialogs.denyTitle}
        description={accessRequestsCopy.dialogs.denyDescription}
        cancelLabel={accessRequestsCopy.actions.cancel}
        actionLabel={accessRequestsCopy.actions.confirmDeny}
        actionVariant="destructive"
        pendingLabel={accessRequestsCopy.feedback.recovery.denied.loading}
        onAction={async () => {
          try {
            await handleConfirmRecoveryReview()
          } catch {
            return
          }
        }}
      >
        {pendingRecoveryReview ? <AccessRequestDenySummary request={pendingRecoveryReview.request} /> : null}
      </AppAlertDialog>
    </>
  )
}

export function AccessRequestsRoute() {
  return (
    <PageSection>
      <AccessRequestsPanel />
    </PageSection>
  )
}

export function AccessRequestsRedirectRoute() {
  return <Navigate to={`${appRoutePaths.users}?tab=solicitacoes`} replace />
}

export default AccessRequestsRoute
