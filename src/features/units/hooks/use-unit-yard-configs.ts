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
  const activeSaveRef = React.useRef<Promise<UnitYardConfig> | null>(null)

  const saveConfig = React.useCallback(async (input: UpsertUnitYardConfigInput) => {
    if (activeSaveRef.current) {
      return activeSaveRef.current
    }

    setIsSaving(true)
    activeSaveRef.current = (async () => {
      const config = await upsertUnitYardConfig(input)
      await snapshot.refetch()
      return config
    })()

    try {
      return await activeSaveRef.current
    } finally {
      activeSaveRef.current = null
      setIsSaving(false)
    }
  }, [snapshot])

  return { ...snapshot, isSaving, saveConfig }
}
