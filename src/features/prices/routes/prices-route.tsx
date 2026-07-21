import type { ColumnFiltersState, SortingState } from "@tanstack/react-table"
import { BadgeDollarSignIcon, PlusIcon } from "lucide-react"
import * as React from "react"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

import { updatePriceTableStatus } from "@/features/prices/services/prices-service"
import { PriceTableFormDialog } from "../components"
import {
  PRICES_TABLE_COLUMN_VISIBILITY_KEY,
  PRICES_TABLE_STATE_KEY,
  pricesCopy,
} from "../constants"
import { usePriceTables } from "../hooks"
import { getPriceTableDetailItems, type PriceTableRecord } from "../model"
import {
  createPriceScopeOptions,
  createPriceStatusOptions,
  createPriceUnitOptions,
  createPricesColumns,
} from "../table"

export function PricesRoute() {
  const { data, error, isLoading, refetch } = usePriceTables()
  const [editingRecord, setEditingRecord] = React.useState<PriceTableRecord | null>(null)
  const [detailsRecord, setDetailsRecord] = React.useState<PriceTableRecord | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "startsAt", desc: true },
  ])
  const [recordToDeactivate, setRecordToDeactivate] = React.useState<PriceTableRecord | null>(null)

  async function handleDeactivatePriceTable() {
    if (!recordToDeactivate) {
      return
    }

    await updatePriceTableStatus(recordToDeactivate.id, "inactive")
    setRecordToDeactivate(null)
    await refetch()
  }

  const columns = React.useMemo(
    () => createPricesColumns({
      onEdit(record) {
        setEditingRecord(record)
        setIsFormOpen(true)
      },
      onDetails: setDetailsRecord,
      onDeactivate(record) {
        setRecordToDeactivate(record)
      },
    }),
    []
  )

  const statusOptions = React.useMemo(
    () => createPriceStatusOptions(data),
    [data]
  )
  const scopeOptions = React.useMemo(
    () => createPriceScopeOptions(data),
    [data]
  )
  const unitOptions = React.useMemo(
    () => createPriceUnitOptions(data),
    [data]
  )

  return (
    <PageSection>
      <PageHeader
        title={pricesCopy.page.title}
        subtitle={pricesCopy.page.subtitle}
        actions={
          <Button type="button" variant="secondary" size="lg" onClick={() => { setEditingRecord(null); setIsFormOpen(true) }}>
            <PlusIcon />
            {pricesCopy.actions.add}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        sourceRowCount={data.length}
        columnVisibilityStorageKey={PRICES_TABLE_COLUMN_VISIBILITY_KEY}
        tableStateStorageKey={PRICES_TABLE_STATE_KEY}
        getRowId={(record: PriceTableRecord) => record.id}
        globalSearch={{
          columnIds: ["name", "unitName", "notes"],
          placeholder: pricesCopy.page.searchPlaceholder,
        }}
        globalFilterValue={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        sorting={sorting}
        onSortingChange={setSorting}
        filterFields={[
          { id: "status", title: pricesCopy.filters.status, options: statusOptions, showCounts: true },
          { id: "scope", title: pricesCopy.filters.scope, options: scopeOptions, showCounts: true },
          { id: "unitId", title: pricesCopy.filters.unit, options: unitOptions, showCounts: true },
        ]}
        emptyState={<AppEmptyState media={<BadgeDollarSignIcon />} title={pricesCopy.empty.title} description={pricesCopy.empty.description} actions={<Button type="button" variant="secondary" size="lg" onClick={() => { setEditingRecord(null); setIsFormOpen(true) }}>{pricesCopy.actions.add}</Button>} />}
        filteredEmptyState={<AppEmptyState media={<BadgeDollarSignIcon />} title={pricesCopy.filteredEmpty.title} description={pricesCopy.filteredEmpty.description} />}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        enablePagination
        enableViewOptions
      />

      <PriceTableFormDialog
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
        title={detailsRecord?.name}
        description={detailsRecord ? pricesCopy.form.description : undefined}
        items={detailsRecord ? getPriceTableDetailItems(detailsRecord) : []}
      />

      <AppAlertDialog
        open={recordToDeactivate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRecordToDeactivate(null)
          }
        }}
        title={pricesCopy.dialogs.deactivateTitle}
        description={pricesCopy.dialogs.deactivateDescription}
        actionVariant="destructive"
        actionLabel={pricesCopy.actions.confirmDeactivate}
        pendingLabel={pricesCopy.actions.confirmDeactivate}
        onAction={handleDeactivatePriceTable}
      />
    </PageSection>
  )
}

export default PricesRoute
