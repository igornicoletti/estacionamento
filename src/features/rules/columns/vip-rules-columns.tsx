import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn, DataTableTextAction } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import { rulesCopy } from "../rules-copy"
import {
  getCommercialRuleTypeLabel,
  getVipRuleStatusLabel,
} from "../utils/vip-rules-models"
import { type VipRule } from "../types/vip-rules-types"

interface CreateVipRulesColumnsOptions {
  onOpenDetails?: (rule: VipRule) => void
  onToggleRuleActive?: (rule: VipRule) => void
  canManage?: boolean
}

export function createVipRulesColumns({
  onOpenDetails,
  onToggleRuleActive,
  canManage = false,
}: CreateVipRulesColumnsOptions = {}): ColumnDef<VipRule>[] {
  return [
    {
      accessorKey: "ruleType",
      meta: { label: rulesCopy.table.type },
      header: rulesCopy.table.type,
      cell: ({ row }) => (
        <Badge variant="outline">
          {getCommercialRuleTypeLabel(row.original.ruleType)}
        </Badge>
      ),
    },
    {
      accessorKey: "ruleSummary",
      meta: { label: rulesCopy.table.summary },
      header: rulesCopy.table.summary,
      cell: ({ row }) => (
        <DataTableTextAction
          onClick={() => {
            onOpenDetails?.(row.original)
          }}
        >
          {row.original.ruleSummary}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "scopeLabel",
      meta: { label: rulesCopy.table.scope },
      header: rulesCopy.table.scope,
      cell: ({ row }) => row.original.scopeLabel,
    },
    {
      accessorKey: "active",
      meta: { label: rulesCopy.table.status },
      header: () => <div className="text-center">{rulesCopy.table.status}</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={getBadgeToneClassName(row.original.active ? "success" : undefined)}
          >
            {getVipRuleStatusLabel(row.original.active)}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      meta: { label: rulesCopy.table.updatedAt },
      header: rulesCopy.table.updatedAt,
      cell: ({ row }) => formatDateTime(row.original.updatedAt),
    },
    createActionsColumn<VipRule>((row) => [
      {
        id: "details",
        label: rulesCopy.actions.details,
        onSelect: () => {
          onOpenDetails?.(row.original)
        },
      },
      ...(canManage
        ? [
          {
            id: "toggle-active" as const,
            label: row.original.active ? rulesCopy.actions.deactivate : rulesCopy.actions.activate,
            variant: row.original.active ? "destructive" as const : "default" as const,
            onSelect: () => {
              onToggleRuleActive?.(row.original)
            },
          },
        ]
        : []),
    ]),
  ]
}
