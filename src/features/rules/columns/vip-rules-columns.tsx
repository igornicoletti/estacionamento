import { type ColumnDef } from "@tanstack/react-table"

import { createActionsColumn } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime, getBadgeToneClassName } from "@/lib"

import { rulesCopy } from "../rules-copy"
import {
  formatVipRuleUnitScope,
  getVipRuleStatusLabel,
  getVipRuleTargetTypeLabel,
  getVipRuleVehicleScopeLabel,
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
      accessorKey: "targetType",
      meta: { label: rulesCopy.table.type },
      header: rulesCopy.table.type,
      cell: ({ row }) => (
        <Badge variant="outline">
          {getVipRuleTargetTypeLabel(row.original.targetType)}
        </Badge>
      ),
    },
    {
      accessorKey: "clientName",
      meta: { label: rulesCopy.table.client },
      header: rulesCopy.table.client,
      cell: ({ row }) => (
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-left font-medium"
          onClick={() => {
            onOpenDetails?.(row.original)
          }}
        >
          {row.original.clientName}
        </Button>
      ),
    },
    {
      accessorKey: "vehiclePlate",
      meta: { label: rulesCopy.table.vehicle },
      header: rulesCopy.table.vehicle,
      cell: ({ row }) => getVipRuleVehicleScopeLabel(row.original),
    },
    {
      id: "scope",
      meta: { label: rulesCopy.table.scope },
      header: rulesCopy.table.scope,
      accessorFn: (rule) => formatVipRuleUnitScope(rule),
      cell: ({ row }) => formatVipRuleUnitScope(row.original),
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
