import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { listPriceTables } from "../services/prices-service"
import { type PriceTable } from "../types/prices-types"

const pricesLoadError = "Não foi possível carregar as tabelas de preço."

export function usePrices() {
  return useAsyncSnapshot<PriceTable[]>({
    cacheKey: "prices:list",
    errorMessage: pricesLoadError,
    initialData: [],
    loadData: listPriceTables,
  })
}
