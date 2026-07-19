import type { ColumnDef } from "@tanstack/react-table"

import { createActionsColumn } from "@/components/data-table"
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
  onDeactivate?: (record: VipRuleRecord) => void
} = {}): ColumnDef<VipRuleRecord>[] {
  return [
    {
      accessorKey: "type",
      meta: { label: rulesCopy.table.type },
      header: rulesCopy.table.type,
      cell: ({ row }) => ruleTypeLabels[row.original.type],
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
      header: rulesCopy.table.status,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={getBadgeToneClassName(row.original.active ? "success" : undefined)}
        >
          {row.original.active ? rulesCopy.labels.active : rulesCopy.labels.inactive}
        </Badge>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: rulesCopy.table.updatedAt },
      header: rulesCopy.table.updatedAt,
      cell: ({ row }) => formatNullableDateTime(row.original.updatedAt),
    },
    createActionsColumn<VipRuleRecord>([
      {
        id: "edit",
        label: rulesCopy.actions.edit,
        onSelect: (row) => options.onEdit?.(row.original),
      },
      {
        id: "deactivate",
        label: rulesCopy.actions.deactivate,
        variant: "destructive",
        onSelect: (row) => options.onDeactivate?.(row.original),
      },
      {
        id: "details",
        label: rulesCopy.actions.details,
        onSelect: (row) => options.onDetails?.(row.original),
      },
    ]),
  ]
}
