import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { pricesCopy } from "../prices-copy"
import {
  listPriceTables,
  savePriceTable,
  updatePriceTableStatus,
} from "../services/prices-service"
import {
  type PriceRecordStatus,
  type PriceTable,
  type SavePriceTableInput,
} from "../types/prices-types"

export function usePrices() {
  const snapshot = useAsyncSnapshot<PriceTable[]>({
    cacheKey: "prices:list:v3",
    errorMessage: pricesCopy.feedback.loadError,
    initialData: [],
    loadData: listPriceTables,
  })
  const [isSaving, setIsSaving] = React.useState(false)

  const savePrice = React.useCallback(
    async (input: SavePriceTableInput) => {
      setIsSaving(true)

      try {
        const price = await savePriceTable(input)
        await snapshot.refetch()
        return price
      } finally {
        setIsSaving(false)
      }
    },
    [snapshot]
  )

  const updateStatus = React.useCallback(
    async (id: string, status: PriceRecordStatus) => {
      setIsSaving(true)

      try {
        const price = await updatePriceTableStatus(id, status)
        await snapshot.refetch()
        return price
      } finally {
        setIsSaving(false)
      }
    },
    [snapshot]
  )

  return {
    ...snapshot,
    isSaving,
    savePrice,
    updateStatus,
  }
}
