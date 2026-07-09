import { type ColumnDef } from "@tanstack/react-table"

import { formatDateTime } from "@/lib"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import {
  getVipRuleScopeLabel,
  getVipRuleVehicleScopeLabel,
} from "../services/vip-rules-service"
import { type VipRule } from "../types/vip-rules-types"

interface CreateVipRulesColumnsOptions {
  onToggleRuleActive?: (rule: VipRule) => void
}

function getRuleDetails(rule: VipRule) {
  return {
    title: rule.targetType === "client" ? rule.clientName : rule.vehiclePlate ?? rule.clientName,
    description: rule.targetType === "client" ? "Regra VIP de cliente." : "Regra VIP de veículo.",
    items: [
      { label: "Tipo", value: rule.targetType === "client" ? "Cliente" : "Veículo" },
      { label: "Cliente", value: rule.clientName },
      { label: "Veículo", value: rule.vehiclePlate ?? "Todos os veículos" },
      { label: "Abrangência de veículos", value: getVipRuleVehicleScopeLabel(rule) },
      { label: "Abrangência de unidades", value: getVipRuleScopeLabel(rule) },
      { label: "Status", value: rule.active ? "Ativa" : "Inativa" },
      { label: "Atualizado em", value: formatDateTime(rule.updatedAt) },
    ],
  }
}

export function createVipRulesColumns(
  options: CreateVipRulesColumnsOptions = {}
): ColumnDef<VipRule>[] {
  const detailsAction = createDataTableDetailsAction<VipRule>((row) =>
    getRuleDetails(row.original)
  )

  return [
    {
      accessorKey: "targetType",
      meta: { label: "Tipo" },
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.targetType === "client" ? "Cliente" : "Veículo"}
        </Badge>
      ),
    },
    {
      accessorKey: "clientName",
      meta: { label: "Cliente" },
      header: "Cliente",
      cell: ({ row }) => (
        <DataTableDetails
          {...getRuleDetails(row.original)}
          trigger={
            <DataTableDetailsTextTrigger>
              {row.original.clientName}
            </DataTableDetailsTextTrigger>
          }
        />
      ),
    },
    {
      accessorKey: "vehiclePlate",
      meta: { label: "Veículo" },
      header: "Veículo",
      cell: ({ row }) => row.original.vehiclePlate ?? "Todos os veículos",
    },
    {
      id: "scope",
      meta: { label: "Abrangência" },
      header: "Abrangência",
      cell: ({ row }) => getVipRuleScopeLabel(row.original),
    },
    {
      accessorKey: "active",
      meta: { label: "Status" },
      header: () => <div className="text-center">Status</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(row.original.active ? "success" : undefined)}
          >
            {row.original.active ? "Ativa" : "Inativa"}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: "Atualizado em" },
      header: "Atualizado em",
      cell: ({ row }) => formatDateTime(row.original.updatedAt),
    },
    createActionsColumn<VipRule>((row) => [
      detailsAction,
      {
        id: "toggle-active",
        label: row.original.active ? "Inativar regra" : "Ativar regra",
        variant: row.original.active ? "destructive" : "default",
        onSelect: () => {
          options.onToggleRuleActive?.(row.original)
        },
      },
    ]),
  ]
}
