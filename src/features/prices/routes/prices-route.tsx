import { BadgeDollarSignIcon, PlusIcon, SearchXIcon, ShieldAlertIcon } from "lucide-react"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"

import { createPricesColumns } from "../columns/prices-columns"
import { PriceTableFormDialog } from "../components/price-table-form-dialog"
import { usePrices } from "../hooks/use-prices"
import { pricesCopy } from "../prices-copy"
import {
  type PriceTable,
  type SavePriceTableInput,
} from "../types/prices-types"
import {
  buildPriceDetails,
  getPriceScopeLabel,
  getPriceStatusLabel,
  getPriceUnitLabel,
} from "../utils/prices-models"

const PRICES_TABLE_STATE_KEY = "rmc.table.prices.state.v3"

export function PricesRoute() {
  const auth = useAuth()
  const canManage = auth.access.hasPermission(AUTH_PERMISSION.pricesManage)
  const {
    data: prices,
    error,
    isLoading,
    isSaving,
    refetch,
    savePrice,
    updateStatus,
  } = usePrices()
  const [selectedPrice, setSelectedPrice] = React.useState<PriceTable | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [pendingDeactivationPrice, setPendingDeactivationPrice] =
    React.useState<PriceTable | null>(null)

  const handleTogglePriceStatus = React.useCallback(
    (price: PriceTable) => {
      if (price.status === "active") {
        setPendingDeactivationPrice(price)
        return
      }

      void notify.track(
        updateStatus(price.id, "active"),
        pricesCopy.feedback.toggle
      )
    },
    [updateStatus]
  )

  const handleConfirmPriceDeactivation = React.useCallback(async () => {
    if (!pendingDeactivationPrice) {
      return
    }

    await notify.track(
      updateStatus(pendingDeactivationPrice.id, "inactive"),
      pricesCopy.feedback.toggle
    )
    setPendingDeactivationPrice(null)
  }, [pendingDeactivationPrice, updateStatus])

  const columns = React.useMemo(
    () =>
      createPricesColumns({
        canManage,
        onOpenDetails: setSelectedPrice,
        onTogglePriceStatus: handleTogglePriceStatus,
      }),
    [canManage, handleTogglePriceStatus]
  )

  const scopeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        prices,
        (price) => price.scope,
        (price) => getPriceScopeLabel(price)
      ),
    [prices]
  )

  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        prices,
        (price) => price.computedStatus,
        (price) => getPriceStatusLabel(price.computedStatus)
      ),
    [prices]
  )

  const handleCreatePrice = React.useCallback(
    async (input: SavePriceTableInput) => {
      await notify.track(savePrice(input), pricesCopy.feedback.save)
    },
    [savePrice]
  )

  return (
    <PageSection>
      <PageHeader
        title={pricesCopy.page.title}
        subtitle={pricesCopy.page.subtitle}
        actions={canManage ? (
          <PageHeaderActions>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusIcon aria-hidden="true" />
              {pricesCopy.actions.add}
            </Button>
          </PageHeaderActions>
        ) : null}
      />

      <DataTable
        columns={columns}
        data={prices}
        tableStateStorageKey={PRICES_TABLE_STATE_KEY}
        getRowId={(price) => price.id}
        globalSearch={{
          columnIds: ["id", "unitId", "unitName", "notes"],
          placeholder: pricesCopy.filters.searchPlaceholder,
        }}
        searchFields={[
          {
            id: "unitName",
            placeholder: pricesCopy.filters.unitSearchPlaceholder,
          },
        ]}
        filterFields={[
          {
            id: "scope",
            title: pricesCopy.filters.scope,
            options: scopeOptions,
          },
          {
            id: "computedStatus",
            title: pricesCopy.filters.status,
            options: statusOptions,
          },
        ]}
        emptyState={(
          <AppEmptyState
            media={<BadgeDollarSignIcon />}
            title={pricesCopy.empty.title}
            description={pricesCopy.empty.description}
          />
        )}
        filteredEmptyState={(
          <AppEmptyState
            media={<SearchXIcon />}
            title={pricesCopy.filteredEmpty.title}
            description={pricesCopy.filteredEmpty.description}
          />
        )}
        isLoading={isLoading || isSaving}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedPrice)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPrice(null)
          }
        }}
        title={selectedPrice ? getPriceUnitLabel(selectedPrice) : undefined}
        description={selectedPrice ? getPriceScopeLabel(selectedPrice) : undefined}
        items={selectedPrice ? buildPriceDetails(selectedPrice) : []}
      />

      {canManage ? (
        <PriceTableFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          isSaving={isSaving}
          onSubmit={handleCreatePrice}
        />
      ) : null}

      <AppAlertDialog
        open={Boolean(pendingDeactivationPrice)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeactivationPrice(null)
          }
        }}
        media={<ShieldAlertIcon />}
        title={pricesCopy.dialogs.deactivateTitle}
        description={pricesCopy.dialogs.deactivateDescription}
        cancelLabel={pricesCopy.actions.cancel}
        actionLabel={pricesCopy.dialogs.deactivateConfirm}
        actionVariant="destructive"
        pendingLabel={pricesCopy.feedback.toggle.loading}
        onAction={handleConfirmPriceDeactivation}
      >
        {pendingDeactivationPrice ? (
          <p className="px-4 text-sm font-medium text-foreground">
            {getPriceUnitLabel(pendingDeactivationPrice)}
          </p>
        ) : null}
      </AppAlertDialog>
    </PageSection>
  )
}
