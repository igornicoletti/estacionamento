import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
import { notify } from "@/components/toast"

import { createVipRulesColumns } from "../columns/vip-rules-columns"
import { useVipRules } from "../hooks/use-vip-rules"
import { type VipRule } from "../types/vip-rules-types"

const RULES_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.rules.columns.v1"

export function RulesRoute() {
  const { data: rules, error, isLoading, isSaving, refetch, toggleClientVip, toggleVehicleVip } = useVipRules()

  const handleToggleRuleActive = React.useCallback(
    (rule: VipRule) => {
      void notify.promise(
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
        {
          loading: "Atualizando regra VIP...",
          success: "Regra VIP atualizada.",
          error: "Não foi possível atualizar a regra VIP.",
        }
      )
    },
    [toggleClientVip, toggleVehicleVip]
  )

  const columns = React.useMemo(
    () =>
      createVipRulesColumns({
        onToggleRuleActive: handleToggleRuleActive,
      }),
    [handleToggleRuleActive]
  )

  const typeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        rules,
        (rule) => rule.targetType,
        (rule) => (rule.targetType === "client" ? "Cliente" : "Veículo")
      ),
    [rules]
  )

  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        rules,
        (rule) => String(rule.active),
        (rule) => (rule.active ? "Ativa" : "Inativa")
      ),
    [rules]
  )

  return (
    <PageSection>
      <PageHeader
        title="Regras"
        subtitle="Gerencie regras VIP e isenções de estacionamento para clientes e veículos."
      />

      <DataTable
        columns={columns}
        data={rules}
        columnVisibilityStorageKey={RULES_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(rule) => rule.id}
        globalSearch={{
          columnIds: ["clientName", "vehiclePlate", "updatedAt"],
          placeholder: "Buscar regras VIP...",
        }}
        filterFields={[
          {
            id: "targetType",
            title: "Tipo",
            options: typeOptions,
          },
          {
            id: "active",
            title: "Status",
            options: statusOptions,
          },
        ]}
        isLoading={isLoading || isSaving}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />
    </PageSection>
  )
}
