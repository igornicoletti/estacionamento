import * as React from "react"
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { listUnitYardConfigs, upsertUnitYardConfig } from "../services/unit-yard-service"
import { type UnitYardConfig, type UpsertUnitYardConfigInput } from "../types/units-types"
import { unitsCopy } from "../units-copy"

export function useUnitYardConfigs() {
  const snapshot = useAsyncSnapshot<UnitYardConfig[]>({
    cacheKey: "units:yard-configs:v2",
    errorMessage: unitsCopy.errors.unitYardLoad,
    initialData: [],
    loadData: listUnitYardConfigs,
  })
  const [isSaving, setIsSaving] = React.useState(false)

  const saveConfig = React.useCallback(async (input: UpsertUnitYardConfigInput) => {
    setIsSaving(true)

    try {
      const config = await upsertUnitYardConfig(input)
      await snapshot.refetch()
      return config
    } finally {
      setIsSaving(false)
    }
  }, [snapshot])

  return { ...snapshot, isSaving, saveConfig }
}
