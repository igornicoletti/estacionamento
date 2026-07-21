import { type ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon } from "lucide-react"

import {
  createActionsColumn,
  DataTableTextAction,
  DataTableTextLink,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_SUCCESS_BADGE_TONE } from "../constants/units-ui"
import {
  createUnitMapHref,
  formatUnitCityState,
  resolveYardStatusLabel,
  type Unit,
  type UnitUserStats,
  type UnitYardConfig,
} from "../model"

export type UnitTableRow = Unit & {
  userStats: UnitUserStats
  yardConfig: UnitYardConfig
}

interface CreateUnitsColumnsOptions {
  onOpenDetails: (unit: UnitTableRow) => void
  onSelectUsers?: (unit: UnitTableRow) => void
  onConfigureYard?: (unit: UnitTableRow) => void
}

function getTotalUsers(unit: UnitTableRow) {
  return unit.userStats.managers + unit.userStats.operators
}

function resolveTextExportValue(value: string) {
  return value.trim() || unitsCopy.details.emptyValue
}

function resolveActiveBadgeClassName(isActive: boolean) {
  return getBadgeToneClassName(isActive ? UNIT_SUCCESS_BADGE_TONE : undefined)
}

export function createUnitsColumns(options: CreateUnitsColumnsOptions): ColumnDef<UnitTableRow>[] {
  return [
    {
      accessorKey: "cod_empresa",
      meta: { label: unitsCopy.table.companyCode },
      header: unitsCopy.table.companyCode,
      size: 90,
    },
    {
      accessorKey: "nom_fantasia",
      meta: { label: unitsCopy.table.tradeName },
      header: unitsCopy.table.tradeName,
      size: 220,
      cell: ({ row }) => (
        <DataTableTextAction onClick={() => options.onOpenDetails(row.original)}>
          {row.original.nom_fantasia}
        </DataTableTextAction>
      ),
    },
    {
      accessorKey: "nom_razao_social",
      meta: { label: unitsCopy.table.legalName },
      header: unitsCopy.table.legalName,
      size: 300,
    },
    {
      accessorKey: "num_cnpj",
      meta: { label: unitsCopy.table.cnpj },
      header: unitsCopy.table.cnpj,
      size: 170,
    },
    {
      accessorKey: "des_bandeira",
      meta: { label: unitsCopy.table.brand },
      header: unitsCopy.table.brand,
      size: 150,
    },
    {
      accessorKey: "sgl_estado",
      meta: { label: unitsCopy.table.state },
      header: unitsCopy.table.state,
      size: 90,
      cell: ({ row }) => row.original.sgl_estado.toUpperCase(),
      enableHiding: false,
    },
    {
      id: "cidadeUf",
      accessorFn: (unit) => formatUnitCityState(unit),
      meta: {
        label: unitsCopy.table.cityState,
        exportValue: (_value, row) => formatUnitCityState(row),
      },
      header: unitsCopy.table.cityState,
      size: 170,
      cell: ({ row }) => formatUnitCityState(row.original),
    },
    {
      accessorKey: "des_coordenada_empresa",
      meta: {
        label: unitsCopy.table.coordinates,
        exportValue: (_value, row) => resolveTextExportValue(row.des_coordenada_empresa),
      },
      header: unitsCopy.table.coordinates,
      size: 210,
      cell: ({ row }) => {
        const href = createUnitMapHref(row.original.des_coordenada_empresa)

        if (!href) {
          return unitsCopy.details.emptyValue
        }

        return (
          <DataTableTextLink href={href} target="_blank" rel="noreferrer">
            {row.original.des_coordenada_empresa}
            <ExternalLinkIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
          </DataTableTextLink>
        )
      },
    },
    {
      accessorKey: "ip_rede",
      meta: {
        label: unitsCopy.table.networkIp,
        exportValue: (_value, row) => resolveTextExportValue(row.ip_rede),
      },
      header: unitsCopy.table.networkIp,
      size: 140,
    },
    {
      id: "unitUsers",
      accessorFn: (unit) => getTotalUsers(unit),
      meta: {
        label: unitsCopy.table.users,
        exportValue: (_value, row) => getTotalUsers(row),
      },
      header: unitsCopy.table.users,
      size: 120,
      cell: ({ row }) => {
        const totalUsers = getTotalUsers(row.original)

        if (!options.onSelectUsers || totalUsers === 0) {
          return totalUsers === 0 ? unitsCopy.details.emptyValue : totalUsers
        }

        return (
          <DataTableTextAction onClick={() => options.onSelectUsers?.(row.original)}>
            {totalUsers}
          </DataTableTextAction>
        )
      },
    },
    {
      id: "yardStatus",
      accessorFn: (unit) => resolveYardStatusLabel(unit.yardConfig.patioActive),
      meta: {
        label: unitsCopy.table.yard,
        exportValue: (_value, row) => resolveYardStatusLabel(row.yardConfig.patioActive),
      },
      header: () => <div className="text-center">{unitsCopy.table.yard}</div>,
      size: 110,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge
            variant="secondary"
            className={resolveActiveBadgeClassName(row.original.yardConfig.patioActive)}
          >
            {resolveYardStatusLabel(row.original.yardConfig.patioActive)}
          </Badge>
        </div>
      ),
    },
    {
      id: "yardSpots",
      accessorFn: (unit) => unit.yardConfig.parkingSpots,
      meta: {
        label: unitsCopy.table.spots,
        exportValue: (_value, row) => row.yardConfig.parkingSpots,
      },
      header: unitsCopy.table.spots,
      size: 90,
      cell: ({ row }) => row.original.yardConfig.parkingSpots,
    },
    createActionsColumn<UnitTableRow>((row) => {
      const totalUsers = getTotalUsers(row.original)

      return [
        {
          id: "details",
          label: unitsCopy.actions.details,
          onSelect: () => options.onOpenDetails(row.original),
        },
        ...(options.onConfigureYard
          ? [
            {
              id: "yard-settings" as const,
              label: unitsCopy.actions.configureYard,
              onSelect: () => options.onConfigureYard?.(row.original),
            },
          ]
          : []),
        ...(options.onSelectUsers && totalUsers > 0
          ? [
            {
              id: "users" as const,
              label: unitsCopy.actions.users,
              onSelect: () => options.onSelectUsers?.(row.original),
            },
          ]
          : []),
      ]
    }),
  ]
}
