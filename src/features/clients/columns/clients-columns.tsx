import { type ColumnDef } from "@tanstack/react-table"
import { CrownIcon } from "lucide-react"

import {
  createActionsColumn,
  createDataTableDetailsAction,
  DataTableDetails,
  DataTableDetailsTextTrigger,
} from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { getBadgeToneClassName } from "@/lib"

import {
  type Client,
  type ClientTableRow,
} from "../types/clients-types"

function mapYesNoToActive(value: string) {
  return value.toUpperCase() === "S" ? "Ativo" : "Inativo"
}

function getClientDetails(
  client: Client,
  isVipClient: boolean
) {
  return {
    title: client.nom_pessoa,
    description: client.num_cnpj_cpf,
    items: [
      { label: "Código do cliente", value: client.cod_pessoa },
      { label: "Nome/Razão social", value: client.nom_pessoa },
      { label: "Nome fantasia", value: client.nom_fantasia },
      { label: "Documento", value: client.num_cnpj_cpf },
      { label: "E-mail", value: client.des_email_1 },
      { label: "Telefone", value: client.num_telefone_1 },
      { label: "Cidade", value: client.nom_cidade },
      { label: "UF", value: client.sgl_estado },
      { label: "Data de cadastro", value: client.dta_cadastro },
      { label: "Cliente ativo", value: mapYesNoToActive(client.ind_pessoa_ativa) },
      {
        label: "Bloqueio financeiro",
        value: mapYesNoToActive(client.bloqueio_financeiro),
      },
      { label: "Quantidade de veículos", value: client.qtd_veiculos },
      { label: "Data da última compra", value: client.dta_ultima_compra },
      { label: "VIP", value: isVipClient ? "Ativo" : "Inativo" },
    ],
  }
}

interface CreateClientsColumnsOptions {
  onSelectVehicles?: (client: ClientTableRow) => void
  onToggleVip?: (client: ClientTableRow) => void
  vipActionLabel?: string
}

export function createClientsColumns(
  options: CreateClientsColumnsOptions = {}
): ColumnDef<ClientTableRow>[] {
  const detailsAction = createDataTableDetailsAction<ClientTableRow>((row) =>
    getClientDetails(row.original, row.original.vip === "sim")
  )

  return [
    {
      accessorKey: "cod_pessoa",
      meta: { label: "Código" },
      header: "Código",
      size: 96,
    },
    {
      accessorKey: "nom_pessoa",
      meta: { label: "Cliente" },
      header: "Cliente",
      size: 220,
      cell: ({ row }) => (
        <DataTableDetails
          {...getClientDetails(row.original, row.original.vip === "sim")}
          trigger={
            <DataTableDetailsTextTrigger>
              <span className="inline-flex items-center gap-1">
                {row.original.nom_pessoa}
                {row.original.vip === "sim" ? (
                  <CrownIcon aria-label="Cliente VIP" className="size-4 text-amber-500" />
                ) : null}
              </span>
            </DataTableDetailsTextTrigger>
          }
        />
      ),
    },
    {
      accessorKey: "num_cnpj_cpf",
      meta: { label: "CNPJ/CPF" },
      header: "CNPJ/CPF",
      size: 160,
    },
    {
      accessorKey: "nom_cidade",
      meta: { label: "Cidade/UF" },
      header: "Cidade/UF",
      size: 120,
      cell: ({ row }) =>
        [row.original.nom_cidade, row.original.sgl_estado]
          .filter(Boolean)
          .join("/") || "—",
    },
    {
      accessorKey: "status",
      meta: { label: "Status" },
      header: () => <div className="text-center text-[0.8rem] font-medium">Status</div>,
      size: 96,
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.status === "ativo"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isActive ? "success" : undefined)}
            >
              {isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: "qtd_veiculos",
      meta: { label: "Veículos" },
      header: "Veículos",
      size: 96,
      cell: ({ row }) => (
        <button
          type="button"
          className="cursor-pointer font-medium underline-offset-2 hover:underline"
          onClick={() => {
            options.onSelectVehicles?.(row.original)
          }}
        >
          {row.original.qtd_veiculos}
        </button>
      ),
    },
    {
      accessorKey: "vip",
      meta: { label: "VIP" },
      header: () => <div className="text-center text-[0.8rem] font-medium">VIP</div>,
      size: 80,
      enableSorting: false,
      cell: ({ row }) => {
        const isVip = row.original.vip === "sim"

        return (
          <div className="flex justify-center">
            <Badge
              variant="secondary"
              className={getBadgeToneClassName(isVip ? "success" : undefined)}
            >
              {isVip ? "Sim" : "Não"}
            </Badge>
          </div>
        )
      },
    },
    createActionsColumn<ClientTableRow>([
      detailsAction,
      {
        id: "vehicles",
        label: "Veículos",
        onSelect: (row) => {
          options.onSelectVehicles?.(row.original)
        },
      },
      {
        id: "vip",
        label: options.vipActionLabel ?? "Cliente VIP",
        onSelect: (row) => {
          options.onToggleVip?.(row.original)
        },
      },
    ]),
  ]
}
