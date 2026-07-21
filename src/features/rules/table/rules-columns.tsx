import type { ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { rulesCopy } from "../constants"
import {
  formatNullableDateTime,
  formatRuleBenefit,
  formatRuleCondition,
  formatRuleTarget,
  formatRuleUnits,
  ruleTypeLabels,
  type VipRuleRecord,
} from "../model"

export function createRulesColumns(options: {
  onEdit?: (record: VipRuleRecord) => void
  onDetails?: (record: VipRuleRecord) => void
  onStatusChange?: (record: VipRuleRecord) => void
} = {}): ColumnDef<VipRuleRecord>[] {
  return [
    {
      accessorKey: "type",
      meta: { label: rulesCopy.table.type },
      header: rulesCopy.table.type,
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onDetails?.(row.original)}>
          {ruleTypeLabels[row.original.type]}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "targetType",
      header: () => null,
      cell: () => null,
      enableHiding: false,
      meta: { enableExport: false },
    },
    {
      id: "target",
      meta: { label: rulesCopy.table.target },
      header: rulesCopy.table.target,
      cell: ({ row }) => {
        const value = formatRuleTarget(row.original)

        return row.original.targetType === "client" && value === ruleTypeLabels.vip
          ? "—"
          : value
      },
    },
    {
      id: "units",
      meta: { label: rulesCopy.table.units },
      header: rulesCopy.table.units,
      cell: ({ row }) => formatRuleUnits(row.original),
    },
    {
      id: "benefit",
      meta: { label: rulesCopy.table.benefit },
      header: rulesCopy.table.benefit,
      cell: ({ row }) => formatRuleBenefit(row.original),
    },
    {
      id: "condition",
      meta: { label: rulesCopy.table.condition },
      header: rulesCopy.table.condition,
      cell: ({ row }) => formatRuleCondition(row.original),
    },
    {
      accessorKey: "active",
      meta: { label: rulesCopy.table.status },
      header: () => <div className="text-center font-medium">{rulesCopy.table.status}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(row.original.active ? "success" : undefined)}
          >
            {row.original.active ? rulesCopy.labels.active : rulesCopy.labels.inactive}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: rulesCopy.table.updatedAt },
      header: rulesCopy.table.updatedAt,
      cell: ({ row }) => formatNullableDateTime(row.original.updatedAt),
    },
    createActionsColumn<VipRuleRecord>((row) => [
      {
        id: "details",
        label: rulesCopy.actions.details,
        onSelect: (selectedRow) => options.onDetails?.(selectedRow.original),
      },
      {
        id: "edit",
        label: rulesCopy.actions.edit,
        onSelect: (selectedRow) => options.onEdit?.(selectedRow.original),
      },
      ...(options.onStatusChange
        ? [
          {
            id: "status" as const,
            label: row.original.active ? rulesCopy.actions.deactivate : rulesCopy.actions.activate,
            variant: row.original.active ? "destructive" as const : "default" as const,
            separatorBefore: true,
            onSelect: (selectedRow: { original: VipRuleRecord }) => options.onStatusChange?.(selectedRow.original),
          },
        ]
        : []),
    ]),
  ]
}
