import { ClipboardListIcon, PlusIcon, SearchXIcon, ShieldAlertIcon } from "lucide-react"
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

import { createVipRulesColumns } from "../columns/vip-rules-columns"
import { VipRuleFormDialog } from "../components/vip-rule-form-dialog"
import { useVipRules } from "../hooks/use-vip-rules"
import { rulesCopy } from "../rules-copy"
import {
  type SaveVipRuleInput,
  type VipRule,
} from "../types/vip-rules-types"
import {
  getCommercialRuleTypeLabel,
  buildVipRuleDetails,
  getVipRuleStatusLabel,
} from "../utils/vip-rules-models"

const RULES_TABLE_STATE_KEY = "rmc.table.rules.state.v3"

export function RulesRoute() {
  const auth = useAuth()
  const canManage = auth.access.hasPermission(AUTH_PERMISSION.rulesManage)
  const {
    data: rules,
    error,
    isLoading,
    isSaving,
    refetch,
    saveRule,
  } = useVipRules()
  const [selectedRule, setSelectedRule] = React.useState<VipRule | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [pendingDeactivationRule, setPendingDeactivationRule] =
    React.useState<VipRule | null>(null)

  const buildToggleInput = React.useCallback(
    (rule: VipRule, active: boolean): SaveVipRuleInput => {
      if (rule.ruleType === "vip") {
        return {
          ruleType: "vip",
          targetType: rule.targetType === "vehicle" ? "vehicle" : "client",
          clientId: rule.clientId ?? 0,
          clientName: rule.clientName ?? "",
          vehicleId: rule.vehicleId,
          vehiclePlate: rule.vehiclePlate,
          appliesToAllVehicles: rule.targetType === "client"
            ? rule.appliesToAllVehicles
            : false,
          vehicleIds: rule.targetType === "vehicle" && rule.vehicleId
            ? [rule.vehicleId]
            : rule.vehicleIds,
          appliesToAllUnits: rule.appliesToAllUnits,
          unitIds: rule.unitIds,
          active,
          notes: null,
        }
      }

      if (rule.ruleType === "fuel_benefit") {
        return {
          ruleType: "fuel_benefit",
          scope: rule.appliesToAllUnits ? "network" : "unit",
          unitIds: rule.unitIds,
          fuelMinLiters: rule.fuelMinLiters ?? 0,
          benefitHours: rule.benefitHours ?? 0,
          active,
          notes: null,
        }
      }

      if (rule.ruleType === "yard_cleaning_occupancy") {
        return {
          ruleType: "yard_cleaning_occupancy",
          unitIds: rule.unitIds,
          yardOccupancyThreshold: rule.yardOccupancyThreshold ?? 0,
          active,
          notes: null,
        }
      }

      if (rule.ruleType === "yard_cleaning") {
        return {
          ruleType: "yard_cleaning",
          unitIds: rule.unitIds,
          yardOccupancyThreshold: rule.yardOccupancyThreshold ?? 0,
          yardStaleVehicleHours: rule.yardStaleVehicleHours ?? 0,
          active,
          notes: null,
        }
      }

      return {
        ruleType: "yard_cleaning_stale_vehicle",
        scope: rule.appliesToAllUnits ? "network" : "unit",
        unitIds: rule.unitIds,
        yardStaleVehicleHours: rule.yardStaleVehicleHours ?? 0,
        active,
        notes: null,
      }
    },
    []
  )

  const handleToggleRuleActive = React.useCallback(
    (rule: VipRule) => {
      if (rule.active) {
        setPendingDeactivationRule(rule)
        return
      }

      void notify.track(
        saveRule(buildToggleInput(rule, true)),
        rulesCopy.feedback.toggle
      )
    },
    [buildToggleInput, saveRule]
  )

  const handleConfirmRuleDeactivation = React.useCallback(async () => {
    if (!pendingDeactivationRule) {
      return
    }

    await notify.track(
      saveRule(buildToggleInput(pendingDeactivationRule, false)),
      rulesCopy.feedback.toggle
    )
    setPendingDeactivationRule(null)
  }, [buildToggleInput, pendingDeactivationRule, saveRule])

  const handleCreateRule = React.useCallback(
    async (input: SaveVipRuleInput) => {
      await notify.track(saveRule(input), rulesCopy.feedback.save)
    },
    [saveRule]
  )

  const columns = React.useMemo(
    () =>
      createVipRulesColumns({
        canManage,
        onOpenDetails: setSelectedRule,
        onToggleRuleActive: handleToggleRuleActive,
      }),
    [canManage, handleToggleRuleActive]
  )

  const typeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        rules,
        (rule) => rule.ruleType,
        (rule) => getCommercialRuleTypeLabel(rule.ruleType)
      ),
    [rules]
  )

  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        rules,
        (rule) => String(rule.active),
        (rule) => getVipRuleStatusLabel(rule.active)
      ),
    [rules]
  )

  return (
    <PageSection>
      <PageHeader
        title={rulesCopy.page.title}
        subtitle={rulesCopy.page.subtitle}
        actions={canManage ? (
          <PageHeaderActions>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusIcon aria-hidden="true" />
              {rulesCopy.actions.add}
            </Button>
          </PageHeaderActions>
        ) : null}
      />

      <DataTable
        columns={columns}
        data={rules}
        tableStateStorageKey={RULES_TABLE_STATE_KEY}
        getRowId={(rule) => rule.id}
        globalSearch={{
          columnIds: ["ruleSummary", "scopeLabel", "updatedAt"],
          placeholder: rulesCopy.filters.searchPlaceholder,
        }}
        filterFields={[
          {
            id: "ruleType",
            title: rulesCopy.filters.targetType,
            options: typeOptions,
          },
          {
            id: "active",
            title: rulesCopy.filters.status,
            options: statusOptions,
          },
        ]}
        isLoading={isLoading || isSaving}
        error={error}
        emptyState={(
          <AppEmptyState
            media={<ClipboardListIcon />}
            title={rulesCopy.empty.title}
            description={rulesCopy.empty.description}
          />
        )}
        filteredEmptyState={(
          <AppEmptyState
            media={<SearchXIcon />}
            title={rulesCopy.filteredEmpty.title}
            description={rulesCopy.filteredEmpty.description}
          />
        )}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedRule)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRule(null)
          }
        }}
        title={selectedRule?.ruleSummary}
        description={selectedRule ? getCommercialRuleTypeLabel(selectedRule.ruleType) : undefined}
        items={selectedRule ? buildVipRuleDetails(selectedRule) : []}
      />

      {canManage ? (
        <VipRuleFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          isSaving={isSaving}
          onSubmit={handleCreateRule}
        />
      ) : null}

      <AppAlertDialog
        open={Boolean(pendingDeactivationRule)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeactivationRule(null)
          }
        }}
        media={<ShieldAlertIcon />}
        title={rulesCopy.dialogs.deactivateTitle}
        description={rulesCopy.dialogs.deactivateDescription}
        cancelLabel={rulesCopy.actions.cancel}
        actionLabel={rulesCopy.dialogs.deactivateConfirm}
        actionVariant="destructive"
        pendingLabel={rulesCopy.feedback.toggle.loading}
        onAction={handleConfirmRuleDeactivation}
      >
        {pendingDeactivationRule ? (
          <p className="px-4 text-sm font-medium text-foreground">
            {pendingDeactivationRule.ruleSummary}
          </p>
        ) : null}
      </AppAlertDialog>
    </PageSection>
  )
}
