import { BadgeDollarSignIcon, SearchXIcon } from "lucide-react"
import * as React from "react"

import {
  createDataTableFilterOptions,
  DataTable,
  DataTableEmptyState,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"

import { createPricesColumns } from "../columns/prices-columns"
import { usePrices } from "../hooks/use-prices"
import {
  getPriceScopeLabel,
  getPriceStatusLabel,
} from "../utils/prices-models"

const PRICES_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.prices.columns.v1"

export function PricesRoute() {
  const { data: prices, error, isLoading, refetch } = usePrices()

  const columns = React.useMemo(() => createPricesColumns(), [])
  const scopeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        prices,
        (price) => price.scope,
        (price) => getPriceScopeLabel(price)
      ),
    [prices]
  )
  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        prices,
        (price) => price.computedStatus,
        (price) => getPriceStatusLabel(price.computedStatus)
      ),
    [prices]
  )

  return (
    <PageSection>
      <PageHeader
        title="Preços"
        subtitle="Consulte tabelas de preço, vigência, carência, tolerância e faixas comerciais."
      />

      <DataTable
        columns={columns}
        data={prices}
        columnVisibilityStorageKey={PRICES_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(price) => price.id}
        globalSearch={{
          columnIds: ["id", "unitId", "unitName", "reason", "notes"],
          placeholder: "Buscar tabelas de preço...",
        }}
        searchFields={[
          {
            id: "unitName",
            placeholder: "Buscar por unidade...",
          },
        ]}
        filterFields={[
          {
            id: "scope",
            title: "Escopo",
            options: scopeOptions,
          },
          {
            id: "computedStatus",
            title: "Status",
            options: statusOptions,
          },
        ]}
        emptyState={(
          <DataTableEmptyState
            title="Nenhuma tabela de preço cadastrada"
            description="Nenhuma configuração comercial foi retornada para o escopo atual."
            icon={<BadgeDollarSignIcon />}
          />
        )}
        filteredEmptyState={(
          <DataTableEmptyState
            title="Nenhuma tabela encontrada"
            description="Ajuste a busca ou os filtros aplicados."
            icon={<SearchXIcon />}
          />
        )}
        isLoading={isLoading}
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
