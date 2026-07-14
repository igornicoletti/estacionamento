import { DatabaseIcon } from "lucide-react"
import * as React from "react"
import { Navigate } from "react-router"

import { appRoutePaths } from "@/app/router/route-registry"
import { DataTable } from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppDialog } from "@/components/shared/app-dialog"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { accessRequestsCopy } from "../access-requests-copy"
import { createPhoneChangeRequestsColumns } from "../columns/phone-change-requests-columns"
import { createRecoveryRequestsColumns } from "../columns/recovery-requests-columns"
import { useAccessRequests } from "../hooks/use-access-requests"
import {
  type AccessRecoveryRequestRecord,
  type AccessRequestDetailsTarget,
  type AccessRequestReviewDecision,
  type PendingPhoneChangeRequestRecord,
} from "../types/access-requests-types"
import {
  getAccessRequestDetailItems,
  getAccessRequestDetailsDescription,
  getAccessRequestDetailsTitle,
} from "../utils/access-requests-details-model"

const RECOVERY_TABLE_STATE_KEY = "rmc.table.access-requests.recovery.state.v2"
const PHONE_TABLE_STATE_KEY = "rmc.table.access-requests.phone.state.v2"

interface PendingRecoveryReview {
  decision: AccessRequestReviewDecision
  request: AccessRecoveryRequestRecord
}

interface PendingPhoneReview {
  decision: AccessRequestReviewDecision
  request: PendingPhoneChangeRequestRecord
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

function getPhoneDialogTitle(decision: AccessRequestReviewDecision) {
  return decision === "approved"
    ? accessRequestsCopy.dialogs.phoneApproveTitle
    : accessRequestsCopy.dialogs.phoneDenyTitle
}

function getPhoneDialogDescription(decision: AccessRequestReviewDecision) {
  return decision === "approved"
    ? accessRequestsCopy.dialogs.phoneApproveDescription
    : accessRequestsCopy.dialogs.phoneDenyDescription
}

interface AccessRequestsPanelProps {
  canReview?: boolean
  className?: string
  showHeader?: boolean
}

export function AccessRequestsPanel({
  canReview = true,
  className,
  showHeader = true,
}: AccessRequestsPanelProps = {}) {
  const {
    data,
    error,
    isLoading,
    isReviewing,
    refetch,
    reviewPhone,
    reviewRecovery,
  } = useAccessRequests()
  const [recoverySearch, setRecoverySearch] = React.useState("")
  const [phoneSearch, setPhoneSearch] = React.useState("")
  const [detailsTarget, setDetailsTarget] =
    React.useState<AccessRequestDetailsTarget | null>(null)
  const [pendingRecoveryReview, setPendingRecoveryReview] =
    React.useState<PendingRecoveryReview | null>(null)
  const [pendingPhoneReview, setPendingPhoneReview] =
    React.useState<PendingPhoneReview | null>(null)
  const [reviewReason, setReviewReason] = React.useState("")
  const [isReasonTouched, setIsReasonTouched] = React.useState(false)

  const isRecoveryReasonInvalid = reviewReason.trim().length < 10
  const showRecoveryReasonError = isReasonTouched && isRecoveryReasonInvalid

  const recoveryColumns = React.useMemo(
    () =>
      createRecoveryRequestsColumns({
        canReview,
        onOpenDetails: (request) => {
          setDetailsTarget({ type: "recovery", request })
        },
        onReview: (request, decision) => {
          setPendingRecoveryReview({ decision, request })
          setReviewReason("")
          setIsReasonTouched(false)
        },
      }),
    [canReview]
  )

  const phoneColumns = React.useMemo(
    () =>
      createPhoneChangeRequestsColumns({
        canReview,
        onOpenDetails: (request) => {
          setDetailsTarget({ type: "phone", request })
        },
        onReview: (request, decision) => {
          setPendingPhoneReview({ decision, request })
        },
      }),
    [canReview]
  )

  async function handleConfirmRecoveryReview() {
    if (!pendingRecoveryReview) {
      return
    }

    setIsReasonTouched(true)

    if (isRecoveryReasonInvalid) {
      return
    }

    const { decision, request } = pendingRecoveryReview

    await notify.track(
      reviewRecovery(request.id, decision, reviewReason.trim()),
      {
        error: accessRequestsCopy.feedback.recovery[decision].error,
        loading: accessRequestsCopy.feedback.recovery[decision].loading,
        success: accessRequestsCopy.feedback.recovery[decision].success,
      }
    )

    setPendingRecoveryReview(null)
    setReviewReason("")
    setIsReasonTouched(false)
  }

  async function handleConfirmPhoneReview() {
    if (!pendingPhoneReview) {
      return
    }

    const { decision, request } = pendingPhoneReview

    await notify.track(reviewPhone(request.authUserId, decision), {
      error: accessRequestsCopy.feedback.phoneChanges[decision].error,
      loading: accessRequestsCopy.feedback.phoneChanges[decision].loading,
      success: accessRequestsCopy.feedback.phoneChanges[decision].success,
    })

    setPendingPhoneReview(null)
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}>
      {showHeader ? (
        <PageHeader
          title={accessRequestsCopy.page.title}
          subtitle={accessRequestsCopy.page.subtitle}
        />
      ) : null}

      <Tabs defaultValue="recovery" className="min-h-0 flex-1">
        <TabsList>
          <TabsTrigger value="recovery">
            {`${accessRequestsCopy.tabs.recovery} (${data.recoveryRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="phone-changes">
            {`${accessRequestsCopy.tabs.phoneChanges} (${data.phoneChanges.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="recovery"
          className="min-h-0 flex-1 data-[state=active]:flex data-[state=inactive]:hidden"
        >
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
            emptyState={(
              <AppEmptyState
                media={<DatabaseIcon />}
                title={accessRequestsCopy.tables.recovery.emptyTitle}
                description={accessRequestsCopy.tables.recovery.emptyDescription}
              />
            )}
            filteredEmptyState={(
              <AppEmptyState
                media={<DatabaseIcon />}
                title={accessRequestsCopy.tables.recovery.filteredEmptyTitle}
                description={accessRequestsCopy.tables.recovery.filteredEmptyDescription}
              />
            )}
            tableStateStorageKey={RECOVERY_TABLE_STATE_KEY}
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              void refetch()
            }}
            enableViewOptions
          />
        </TabsContent>

        <TabsContent
          value="phone-changes"
          className="min-h-0 flex-1 data-[state=active]:flex data-[state=inactive]:hidden"
        >
          <DataTable
            columns={phoneColumns}
            data={data.phoneChanges}
            getRowId={(request) => request.id}
            globalSearch={{
              columnIds: ["name", "currentPhoneMasked", "pendingPhoneMasked"],
              placeholder: accessRequestsCopy.tables.phoneChanges.searchPlaceholder,
            }}
            globalFilterValue={phoneSearch}
            onGlobalFilterChange={setPhoneSearch}
            emptyState={(
              <AppEmptyState
                media={<DatabaseIcon />}
                title={accessRequestsCopy.tables.phoneChanges.emptyTitle}
                description={accessRequestsCopy.tables.phoneChanges.emptyDescription}
              />
            )}
            filteredEmptyState={(
              <AppEmptyState
                media={<DatabaseIcon />}
                title={accessRequestsCopy.tables.phoneChanges.filteredEmptyTitle}
                description={accessRequestsCopy.tables.phoneChanges.filteredEmptyDescription}
              />
            )}
            tableStateStorageKey={PHONE_TABLE_STATE_KEY}
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              void refetch()
            }}
            enableViewOptions
          />
        </TabsContent>
      </Tabs>

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
        open={pendingRecoveryReview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRecoveryReview(null)
            setReviewReason("")
            setIsReasonTouched(false)
          }
        }}
        title={
          pendingRecoveryReview
            ? getRecoveryDialogTitle(pendingRecoveryReview.decision)
            : undefined
        }
        description={
          pendingRecoveryReview
            ? getRecoveryDialogDescription(pendingRecoveryReview.decision)
            : undefined
        }
        footer={(
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={isReviewing}
              onClick={() => {
                setPendingRecoveryReview(null)
                setReviewReason("")
                setIsReasonTouched(false)
              }}
            >
              {accessRequestsCopy.actions.cancel}
            </Button>
            <Button
              type="button"
              size="lg"
              variant={
                pendingRecoveryReview?.decision === "denied"
                  ? "destructive"
                  : "default"
              }
              disabled={isReviewing || isRecoveryReasonInvalid}
              onClick={() => {
                void handleConfirmRecoveryReview()
              }}
            >
              {pendingRecoveryReview?.decision === "approved"
                ? accessRequestsCopy.actions.confirmApprove
                : accessRequestsCopy.actions.confirmDeny}
            </Button>
          </>
        )}
      >
        <Field data-invalid={showRecoveryReasonError}>
          <FieldLabel htmlFor="access-request-review-reason">
            {accessRequestsCopy.dialogs.reviewReasonLabel}
          </FieldLabel>
          <Textarea
            id="access-request-review-reason"
            value={reviewReason}
            onBlur={() => {
              setIsReasonTouched(true)
            }}
            onChange={(event) => {
              setReviewReason(event.target.value)
            }}
            placeholder={accessRequestsCopy.dialogs.reviewReasonPlaceholder}
            aria-invalid={showRecoveryReasonError}
            disabled={isReviewing}
          />
          {showRecoveryReasonError ? (
            <FieldError>{accessRequestsCopy.dialogs.reviewReasonHint}</FieldError>
          ) : null}
        </Field>
      </AppDialog>

      <AppAlertDialog
        open={pendingPhoneReview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingPhoneReview(null)
          }
        }}
        title={
          pendingPhoneReview
            ? getPhoneDialogTitle(pendingPhoneReview.decision)
            : undefined
        }
        description={
          pendingPhoneReview
            ? getPhoneDialogDescription(pendingPhoneReview.decision)
            : undefined
        }
        cancelLabel={accessRequestsCopy.actions.cancel}
        actionLabel={
          pendingPhoneReview?.decision === "approved"
            ? accessRequestsCopy.actions.confirmApprove
            : accessRequestsCopy.actions.confirmDeny
        }
        closeOnAction={false}
        onAction={handleConfirmPhoneReview}
      />
    </div>
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
  return (
    <Navigate
      to={`${appRoutePaths.users}?tab=solicitacoes`}
      replace
    />
  )
}
