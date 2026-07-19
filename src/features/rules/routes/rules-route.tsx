import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"
import { ClipboardListIcon, PlusIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppEmptyState } from "@/components/shared/app-empty-state"
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
import { type VipRuleRecord } from "../model"
import {
  createRuleStatusOptions,
  createRuleTargetTypeOptions,
  createRuleTypeOptions,
  createRulesColumns,
} from "../table"

export function RulesRoute() {
  const { data, error, isLoading, refetch } = useVipRules()
  const [selectedRecord, setSelectedRecord] = React.useState<VipRuleRecord | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "updatedAt", desc: true },
  ])
  const [recordToDeactivate, setRecordToDeactivate] = React.useState<VipRuleRecord | null>(null)

  async function handleDeactivateRule() {
    if (!recordToDeactivate) {
      return
    }

    const normalizedType = recordToDeactivate.type
    const payload = {
      id: recordToDeactivate.id,
      type: normalizedType,
      targetType: recordToDeactivate.targetType,
      clientId: recordToDeactivate.clientId,
      clientName: recordToDeactivate.clientName,
      vehicleId: recordToDeactivate.vehicleId,
      vehiclePlate: recordToDeactivate.vehiclePlate,
      vehicleIds: recordToDeactivate.vehicleIds,
      appliesToAllUnits: recordToDeactivate.appliesToAllUnits,
      unitIds: recordToDeactivate.unitIds,
      active: false,
      fuelMinLiters: recordToDeactivate.fuelMinLiters,
      benefitHours: recordToDeactivate.benefitHours,
      yardOccupancyThreshold: recordToDeactivate.yardOccupancyThreshold,
      yardStaleVehicleHours: recordToDeactivate.yardStaleVehicleHours,
      notes: recordToDeactivate.notes,
    }

    await saveVipRule(payload)
    setRecordToDeactivate(null)
    await refetch()
  }

  const columns = React.useMemo(
    () =>
      createRulesColumns({
        onEdit(record) {
          setSelectedRecord(record)
          setIsFormOpen(true)
        },
        onDetails: setSelectedRecord,
        onDeactivate(record) {
          setRecordToDeactivate(record)
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
            size="lg"
            onClick={() => {
              setSelectedRecord(null)
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
            actions={<Button type="button" variant="secondary" size="lg" onClick={() => { setSelectedRecord(null); setIsFormOpen(true) }}>{rulesCopy.actions.add}</Button>}
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
        record={selectedRecord}
        onOpenChange={setIsFormOpen}
        onSaved={() => void refetch()}
      />

      <AppAlertDialog
        open={recordToDeactivate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRecordToDeactivate(null)
          }
        }}
        title={rulesCopy.dialogs.deactivateTitle}
        description={rulesCopy.dialogs.deactivateDescription}
        actionVariant="destructive"
        actionLabel={rulesCopy.actions.confirmDeactivate}
        pendingLabel={rulesCopy.actions.confirmDeactivate}
        onAction={handleDeactivateRule}
      />
    </PageSection>
  )
}

export default RulesRoute
