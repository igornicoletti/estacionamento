import { ClipboardListIcon, PlusIcon, SearchXIcon } from "lucide-react"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
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
  buildVipRuleDetails,
  getVipRuleStatusLabel,
  getVipRuleTargetTypeLabel,
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
    toggleClientVip,
    toggleVehicleVip,
  } = useVipRules()
  const [selectedRule, setSelectedRule] = React.useState<VipRule | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

  const handleToggleRuleActive = React.useCallback(
    (rule: VipRule) => {
      void notify.track(
        rule.targetType === "client"
          ? toggleClientVip({
            clientId: rule.clientId,
            clientName: rule.clientName,
            enabled: !rule.active,
          })
          : toggleVehicleVip({
            clientId: rule.clientId,
            clientName: rule.clientName,
            vehicleId: rule.vehicleId ?? 0,
            vehiclePlate: rule.vehiclePlate ?? "",
            enabled: !rule.active,
          }),
        rulesCopy.feedback.toggle
      )
    },
    [toggleClientVip, toggleVehicleVip]
  )

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
        (rule) => rule.targetType,
        (rule) => getVipRuleTargetTypeLabel(rule.targetType)
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
          columnIds: ["clientName", "vehiclePlate", "updatedAt"],
          placeholder: rulesCopy.filters.searchPlaceholder,
        }}
        filterFields={[
          {
            id: "targetType",
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
        title={selectedRule?.clientName}
        description={selectedRule ? getVipRuleTargetTypeLabel(selectedRule.targetType) : undefined}
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
    </PageSection>
  )
}
