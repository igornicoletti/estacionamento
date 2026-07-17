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
  const activeSaveRef = React.useRef<Promise<PriceTable> | null>(null)
  const activeStatusRef = React.useRef<Promise<PriceTable> | null>(null)

  const savePrice = React.useCallback(
    async (input: SavePriceTableInput) => {
      if (activeSaveRef.current) {
        return activeSaveRef.current
      }

      setIsSaving(true)
      activeSaveRef.current = (async () => {
        const price = await savePriceTable(input)
        await snapshot.refetch()
        return price
      })()

      try {
        return await activeSaveRef.current
      } finally {
        activeSaveRef.current = null
        setIsSaving(false)
      }
    },
    [snapshot]
  )

  const updateStatus = React.useCallback(
    async (id: string, status: PriceRecordStatus) => {
      if (activeStatusRef.current) {
        return activeStatusRef.current
      }

      setIsSaving(true)
      activeStatusRef.current = (async () => {
        const price = await updatePriceTableStatus(id, status)
        await snapshot.refetch()
        return price
      })()

      try {
        return await activeStatusRef.current
      } finally {
        activeStatusRef.current = null
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
