import * as React from "react"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { accessRequestsCopy } from "../access-requests-copy"
import { createPhoneChangeRequestsColumns } from "../columns/phone-change-requests-columns"
import { createRecoveryRequestsColumns } from "../columns/recovery-requests-columns"
import { useAccessRequests } from "../hooks/use-access-requests"
import {
  type AccessRecoveryRequestRecord,
  type AccessRequestReviewDecision,
} from "../types/access-requests-types"

const RECOVERY_TABLE_COLUMN_VISIBILITY_KEY =
  "rmc.table.access-requests.recovery.columns.v1"
const PHONE_TABLE_COLUMN_VISIBILITY_KEY =
  "rmc.table.access-requests.phone.columns.v1"

interface PendingRecoveryReview {
  decision: AccessRequestReviewDecision
  request: AccessRecoveryRequestRecord
}

export function AccessRequestsRoute() {
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
  const [pendingRecoveryReview, setPendingRecoveryReview] =
    React.useState<PendingRecoveryReview | null>(null)
  const [reviewReason, setReviewReason] = React.useState("")

  const recoveryColumns = React.useMemo(
    () =>
      createRecoveryRequestsColumns({
        onReview: (request, decision) => {
          setPendingRecoveryReview({ decision, request })
          setReviewReason("")
        },
      }),
    []
  )

  const phoneColumns = React.useMemo(
    () =>
      createPhoneChangeRequestsColumns({
        onReview: (request, decision) => {
          void notify.track(reviewPhone(request.authUserId, decision), {
            error: accessRequestsCopy.feedback.phoneChanges[decision].error,
            loading: accessRequestsCopy.feedback.phoneChanges[decision].loading,
            success: accessRequestsCopy.feedback.phoneChanges[decision].success,
          })
        },
      }),
    [reviewPhone]
  )

  const isRecoveryReasonInvalid = reviewReason.trim().length < 10

  async function handleConfirmRecoveryReview() {
    if (!pendingRecoveryReview || isRecoveryReasonInvalid) {
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
  }

  return (
    <PageSection>
      <PageHeader
        title={accessRequestsCopy.page.title}
        subtitle={accessRequestsCopy.page.subtitle}
      />

      <Tabs defaultValue="recovery">
        <TabsList>
          <TabsTrigger value="recovery">
            {`${accessRequestsCopy.tabs.recovery} (${data.recoveryRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="phone-changes">
            {`${accessRequestsCopy.tabs.phoneChanges} (${data.phoneChanges.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recovery">
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
            emptyState={accessRequestsCopy.tables.recovery.empty}
            columnVisibilityStorageKey={RECOVERY_TABLE_COLUMN_VISIBILITY_KEY}
            tableStateStorageKey="rmc.table.access-requests.recovery.state.v1"
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              void refetch()
            }}
            enableViewOptions
          />
        </TabsContent>

        <TabsContent value="phone-changes">
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
            emptyState={accessRequestsCopy.tables.phoneChanges.empty}
            columnVisibilityStorageKey={PHONE_TABLE_COLUMN_VISIBILITY_KEY}
            tableStateStorageKey="rmc.table.access-requests.phone.state.v1"
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              void refetch()
            }}
            enableViewOptions
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={pendingRecoveryReview !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRecoveryReview(null)
            setReviewReason("")
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingRecoveryReview?.decision === "approved"
                ? accessRequestsCopy.dialogs.approveTitle
                : accessRequestsCopy.dialogs.denyTitle}
            </DialogTitle>
            <DialogDescription>
              {pendingRecoveryReview?.decision === "approved"
                ? accessRequestsCopy.dialogs.approveDescription
                : accessRequestsCopy.dialogs.denyDescription}
            </DialogDescription>
          </DialogHeader>

          <Field data-invalid={isRecoveryReasonInvalid}>
            <FieldLabel htmlFor="access-request-review-reason">
              {accessRequestsCopy.dialogs.reviewReasonLabel}
            </FieldLabel>
            <Textarea
              id="access-request-review-reason"
              value={reviewReason}
              onChange={(event) => {
                setReviewReason(event.target.value)
              }}
              placeholder={accessRequestsCopy.dialogs.reviewReasonPlaceholder}
              aria-invalid={isRecoveryReasonInvalid}
              disabled={isReviewing}
            />
            {isRecoveryReasonInvalid ? (
              <FieldError>{accessRequestsCopy.dialogs.reviewReasonHint}</FieldError>
            ) : null}
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg" disabled={isReviewing}>
                {accessRequestsCopy.actions.cancel}
              </Button>
            </DialogClose>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageSection>
  )
}
