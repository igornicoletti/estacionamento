import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"
import { ClipboardListIcon, PlusIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import {
  saveVipRule,
} from "@/features/rules/services/vip-rules-service"

import { VipRuleFormDialog } from "../components"
import {
  RULES_TABLE_COLUMN_VISIBILITY_KEY,
  RULES_TABLE_STATE_KEY,
  rulesCopy,
} from "../constants"
import { useVipRules } from "../hooks"
import { getRuleDetailItems, type VipRuleRecord } from "../model"
import {
  createRuleStatusOptions,
  createRuleTargetTypeOptions,
  createRuleTypeOptions,
  createRulesColumns,
} from "../table"

export function RulesRoute() {
  const { data, error, isLoading, refetch } = useVipRules()
  const [editingRecord, setEditingRecord] = React.useState<VipRuleRecord | null>(null)
  const [detailsRecord, setDetailsRecord] = React.useState<VipRuleRecord | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ])
  const [recordToUpdateStatus, setRecordToUpdateStatus] = React.useState<VipRuleRecord | null>(null)

  const statusDialogTitle = recordToUpdateStatus?.active
    ? rulesCopy.dialogs.deactivateTitle
    : rulesCopy.dialogs.activateTitle
  const statusDialogDescription = recordToUpdateStatus?.active
    ? rulesCopy.dialogs.deactivateDescription
    : rulesCopy.dialogs.activateDescription
  const statusActionLabel = recordToUpdateStatus?.active
    ? rulesCopy.actions.confirmDeactivate
    : rulesCopy.actions.confirmActivate

  async function handleUpdateRuleStatus() {
    if (!recordToUpdateStatus) {
      return
    }

    const normalizedType = recordToUpdateStatus.type
    const payload = {
      id: recordToUpdateStatus.id,
      type: normalizedType,
      targetType: recordToUpdateStatus.targetType,
      clientId: recordToUpdateStatus.clientId,
      clientName: recordToUpdateStatus.clientName,
      vehicleId: recordToUpdateStatus.vehicleId,
      vehiclePlate: recordToUpdateStatus.vehiclePlate,
      vehicleIds: recordToUpdateStatus.vehicleIds,
      appliesToAllUnits: recordToUpdateStatus.appliesToAllUnits,
      unitIds: recordToUpdateStatus.unitIds,
      active: !recordToUpdateStatus.active,
      fuelMinLiters: recordToUpdateStatus.fuelMinLiters,
      benefitHours: recordToUpdateStatus.benefitHours,
      yardOccupancyThreshold: recordToUpdateStatus.yardOccupancyThreshold,
      yardStaleVehicleHours: recordToUpdateStatus.yardStaleVehicleHours,
      notes: recordToUpdateStatus.notes,
    }

    await notify.track(saveVipRule(payload), {
      loading: rulesCopy.actions.saving,
      success: rulesCopy.feedback.statusSuccess,
      error: rulesCopy.feedback.statusError,
    })
    setRecordToUpdateStatus(null)
    await refetch()
  }

  const columns = React.useMemo(
    () =>
      createRulesColumns({
        onEdit(record) {
          setEditingRecord(record)
          setIsFormOpen(true)
        },
        onDetails: setDetailsRecord,
        onStatusChange(record) {
          setRecordToUpdateStatus(record)
        },
      }),
    []
  )

  const typeOptions = React.useMemo(() => createRuleTypeOptions(data), [data])
  const targetTypeOptions = React.useMemo(() => createRuleTargetTypeOptions(data), [data])
  const statusOptions = React.useMemo(() => createRuleStatusOptions(data), [data])

  return (
    <PageSection>
      <PageHeader
        title={rulesCopy.page.title}
        subtitle={rulesCopy.page.subtitle}
        actions={
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => {
              setEditingRecord(null)
              setIsFormOpen(true)
            }}
          >
            <PlusIcon />
            {rulesCopy.actions.add}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        sourceRowCount={data.length}
        columnVisibilityStorageKey={RULES_TABLE_COLUMN_VISIBILITY_KEY}
        tableStateStorageKey={RULES_TABLE_STATE_KEY}
        getRowId={(record: VipRuleRecord) => record.id}
        globalSearch={{
          columnIds: ["clientName", "vehiclePlate", "notes"],
          placeholder: rulesCopy.page.searchPlaceholder,
        }}
        globalFilterValue={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        sorting={sorting}
        onSortingChange={setSorting}
        filterFields={[
          { id: "type", title: rulesCopy.filters.type, options: typeOptions, showCounts: true },
          {
            id: "targetType",
            title: rulesCopy.filters.targetType,
            options: targetTypeOptions,
            showCounts: true,
          },
          { id: "active", title: rulesCopy.filters.active, options: statusOptions, showCounts: true },
        ]}
        emptyState={
          <AppEmptyState
            media={<ClipboardListIcon />}
            title={rulesCopy.empty.title}
            description={rulesCopy.empty.description}
            actions={<Button type="button" variant="secondary" size="lg" onClick={() => { setEditingRecord(null); setIsFormOpen(true) }}>{rulesCopy.actions.add}</Button>}
          />
        }
        filteredEmptyState={
          <AppEmptyState
            media={<ClipboardListIcon />}
            title={rulesCopy.filteredEmpty.title}
            description={rulesCopy.filteredEmpty.description}
          />
        }
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        enablePagination
        enableViewOptions
      />

      <VipRuleFormDialog
        open={isFormOpen}
        record={editingRecord}
        onOpenChange={setIsFormOpen}
        onSaved={() => void refetch()}
      />

      <AppDetailsSheet
        open={Boolean(detailsRecord)}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDetailsRecord(null)
          }
        }}
        title={detailsRecord ? rulesCopy.actions.details : undefined}
        description={detailsRecord ? rulesCopy.form.description : undefined}
        items={detailsRecord ? getRuleDetailItems(detailsRecord) : []}
      />

      <AppAlertDialog
        open={recordToUpdateStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRecordToUpdateStatus(null)
          }
        }}
        title={statusDialogTitle}
        description={statusDialogDescription}
        actionVariant={recordToUpdateStatus?.active ? "destructive" : "default"}
        actionLabel={statusActionLabel}
        pendingLabel={rulesCopy.actions.saving}
        onAction={handleUpdateRuleStatus}
      />
    </PageSection>
  )
}

export default RulesRoute
