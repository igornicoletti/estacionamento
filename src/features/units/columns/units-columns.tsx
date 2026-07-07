import { type ColumnDef } from "@tanstack/react-table"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import {
  type Unit,
  type UnitYardConfig,
} from "../types/units-types"
import { unitsCopy } from "../units-copy"
import {
  createUnitMapHref,
  formatUnitCityState,
  formatUnitSystemLabel,
  resolveYardStatusLabel,
} from "../utils/units-models"

export interface UnitUserStats {
  managers: number
  operators: number
}

interface CreateUnitsColumnsOptions {
  onSelectUsers?: (unit: Unit) => void
  getUserStats?: (unit: Unit) => UnitUserStats
  onConfigureYard?: (unit: Unit) => void
  getYardConfig?: (unit: Unit) => UnitYardConfig
}

function getUnitDetails(unit: Unit) {
  return {
    title: unit.nom_razao_social,
    description: unit.nom_fantasia,
    items: [
      { label: unitsCopy.table.companyCode, value: unit.cod_empresa },
      { label: unitsCopy.table.legalName, value: unit.nom_razao_social },
      { label: unitsCopy.table.tradeName, value: unit.nom_fantasia },
      { label: unitsCopy.table.cnpj, value: unit.num_cnpj },
      { label: unitsCopy.table.brand, value: unit.des_bandeira },
      { label: "Cidade", value: unit.nom_cidade },
      { label: "UF", value: unit.sgl_estado },
      { label: unitsCopy.table.coordinates, value: unit.des_coordenada_empresa },
      { label: unitsCopy.table.networkIp, value: unit.ip_rede },
      { label: unitsCopy.table.erpSystem, value: formatUnitSystemLabel(unit.nom_banco_dados) },
    ],
  }
}

export function createUnitsColumns(
  options: CreateUnitsColumnsOptions = {}
): ColumnDef<Unit>[] {
  const detailsAction = createDataTableDetailsAction<Unit>((row) =>
    getUnitDetails(row.original)
  )

  function getTotalUsers(unit: Unit) {
    const stats = options.getUserStats?.(unit)

    if (!stats) {
      return 0
    }

    return stats.managers + stats.operators
  }

  function getYardConfig(unit: Unit): UnitYardConfig {
    const unitId = String(unit.cod_empresa)

    return options.getYardConfig?.(unit) ?? {
      unitId,
      patioActive: false,
      parkingSpots: 0,
      updatedAt: new Date(0).toISOString(),
    }
  }

  return [
    {
      accessorKey: "cod_empresa",
      meta: { label: unitsCopy.table.companyCode },
      header: unitsCopy.table.companyCode,
      size: 90,
    },
    {
      accessorKey: "nom_razao_social",
      meta: { label: unitsCopy.table.legalName },
      header: unitsCopy.table.legalName,
      size: 300,
      cell: ({ row }) => (
        <DataTableDetails
          {...getUnitDetails(row.original)}
          trigger={
            <DataTableDetailsTextTrigger>
              {row.original.nom_razao_social}
            </DataTableDetailsTextTrigger>
          }
        />
      ),
    },
    {
      accessorKey: "nom_fantasia",
      meta: { label: unitsCopy.table.tradeName },
      header: unitsCopy.table.tradeName,
      size: 220,
      cell: ({ row }) => (
        <DataTableDetails
          {...getUnitDetails(row.original)}
          trigger={
            <DataTableDetailsTextTrigger>
              {row.original.nom_fantasia}
            </DataTableDetailsTextTrigger>
          }
        />
      ),
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
      meta: { label: "UF" },
      header: "UF",
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
        const mapHref = createUnitMapHref(row.original.des_coordenada_empresa)

        if (!mapHref) {
          return "-"
        }

        return (
          <a
            href={mapHref}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline-offset-4 hover:underline"
          >
            {row.original.des_coordenada_empresa}
          </a>
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
      accessorFn: (unit) => getTotalUsers(unit),
      meta: { label: unitsCopy.table.users },
      header: unitsCopy.table.users,
      size: 120,
      cell: ({ row }) => {
        const totalUsers = getTotalUsers(row.original)

        if (!options.onSelectUsers) {
          return totalUsers
        }

        return (
          <button
            type="button"
            className="font-medium underline-offset-4 hover:underline"
            aria-label={`Ver usuários da unidade ${row.original.nom_fantasia}`}
            onClick={() => {
              options.onSelectUsers?.(row.original)
            }}
          >
            {totalUsers}
          </button>
        )
      },
    },
    {
      id: "yardStatus",
      accessorFn: (unit) => resolveYardStatusLabel(getYardConfig(unit).patioActive),
      meta: { label: unitsCopy.table.yard },
      header: () => (
        <div className="text-center">
          {unitsCopy.table.yard}
        </div>
      ),
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = getYardConfig(row.original).patioActive

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isActive ? "success" : undefined)}
            >
              {resolveYardStatusLabel(isActive)}
            </Badge>
          </div>
        )
      },
    },
    {
      id: "yardSpots",
      accessorFn: (unit) => getYardConfig(unit).parkingSpots,
      meta: { label: unitsCopy.table.spots },
      header: unitsCopy.table.spots,
      size: 90,
      cell: ({ row }) => getYardConfig(row.original).parkingSpots,
    },
    createActionsColumn<Unit>([
      detailsAction,
      ...(options.onSelectUsers
        ? [
          {
            id: "users" as const,
            label: unitsCopy.actions.users,
            onSelect: (row: { original: Unit }) => {
              options.onSelectUsers?.(row.original)
            },
          },
        ]
        : []),
      ...(options.onConfigureYard
        ? [
          {
            id: "yard-settings" as const,
            label: unitsCopy.actions.configureYard,
            onSelect: (row: { original: Unit }) => {
              options.onConfigureYard?.(row.original)
            },
          },
        ]
        : []),
    ]),
  ]
}
