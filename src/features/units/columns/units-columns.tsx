import { type ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon } from "lucide-react"

import { createActionsColumn } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getBadgeToneClassName } from "@/lib"

import { type Unit, type UnitYardConfig } from "../types/units-types"
import { unitsCopy } from "../units-copy"
import {
  createUnitMapHref,
  formatUnitCityState,
  resolveYardStatusLabel,
} from "../utils/units-models"

export interface UnitUserStats {
  managers: number
  operators: number
}

interface CreateUnitsColumnsOptions {
  onOpenDetails: (unit: Unit) => void
  onSelectUsers?: (unit: Unit) => void
  onConfigureYard?: (unit: Unit) => void
  getUserStats?: (unit: Unit) => UnitUserStats
  getYardConfig?: (unit: Unit) => UnitYardConfig
}

function getTotalUsers(unit: Unit, getUserStats?: (unit: Unit) => UnitUserStats) {
  const stats = getUserStats?.(unit)
  return stats ? stats.managers + stats.operators : 0
}

function getFallbackYardConfig(unit: Unit): UnitYardConfig {
  return {
    unitId: String(unit.cod_empresa),
    patioActive: false,
    parkingSpots: 0,
    updatedAt: new Date(0).toISOString(),
  }
}

export function createUnitsColumns(options: CreateUnitsColumnsOptions): ColumnDef<Unit>[] {
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
        <Button
          type="button"
          variant="link"
          className="h-auto justify-start px-0 text-left font-medium"
          onClick={() => options.onOpenDetails(row.original)}
        >
          {row.original.nom_fantasia}
        </Button>
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
      meta: { label: unitsCopy.table.cityState },
      header: unitsCopy.table.cityState,
      size: 170,
      cell: ({ row }) => formatUnitCityState(row.original),
    },
    {
      accessorKey: "des_coordenada_empresa",
      meta: { label: unitsCopy.table.coordinates },
      header: unitsCopy.table.coordinates,
      size: 210,
      cell: ({ row }) => {
        const href = createUnitMapHref(row.original.des_coordenada_empresa)

        if (!href) {
          return "—"
        }

        return (
          <Button asChild variant="link" className="h-auto px-0 font-medium">
            <a href={href} target="_blank" rel="noreferrer">
              {row.original.des_coordenada_empresa}
              <ExternalLinkIcon aria-hidden="true" />
            </a>
          </Button>
        )
      },
    },
    {
      accessorKey: "ip_rede",
      meta: { label: unitsCopy.table.networkIp },
      header: unitsCopy.table.networkIp,
      size: 140,
    },
    {
      id: "unitUsers",
      accessorFn: (unit) => getTotalUsers(unit, options.getUserStats),
      meta: { label: unitsCopy.table.users },
      header: unitsCopy.table.users,
      size: 120,
      cell: ({ row }) => {
        const totalUsers = getTotalUsers(row.original, options.getUserStats)

        if (!options.onSelectUsers) {
          return totalUsers
        }

        return (
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 font-medium"
            onClick={() => options.onSelectUsers?.(row.original)}
          >
            {totalUsers}
          </Button>
        )
      },
    },
    {
      id: "yardStatus",
      accessorFn: (unit) => resolveYardStatusLabel((options.getYardConfig?.(unit) ?? getFallbackYardConfig(unit)).patioActive),
      meta: { label: unitsCopy.table.yard },
      header: () => <div className="text-center">{unitsCopy.table.yard}</div>,
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        const config = options.getYardConfig?.(row.original) ?? getFallbackYardConfig(row.original)

        return (
          <div className="flex justify-center">
            <Badge variant="secondary" className={getBadgeToneClassName(config.patioActive ? "success" : undefined)}>
              {resolveYardStatusLabel(config.patioActive)}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "yardSpots",
      accessorFn: (unit) => (options.getYardConfig?.(unit) ?? getFallbackYardConfig(unit)).parkingSpots,
      meta: { label: unitsCopy.table.spots },
      header: unitsCopy.table.spots,
      size: 90,
    },
    createActionsColumn<Unit>([
      {
        id: "details",
        label: "Detalhes",
        onSelect: (row) => options.onOpenDetails(row.original),
      },
      ...(options.onSelectUsers ? [{ id: "users" as const, label: unitsCopy.actions.users, onSelect: (row: { original: Unit }) => options.onSelectUsers?.(row.original) }] : []),
      ...(options.onConfigureYard ? [{ id: "yard-settings" as const, label: unitsCopy.actions.configureYard, onSelect: (row: { original: Unit }) => options.onConfigureYard?.(row.original) }] : []),
    ]),
  ]
}
