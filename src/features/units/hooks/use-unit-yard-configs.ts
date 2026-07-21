import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_YARD_CONFIGS_CACHE_KEY } from "../constants/units-persistence"
import { normalizeUnitYardConfig, type UnitYardConfig, type UpsertUnitYardConfigInput } from "../model"
import { listUnitYardConfigs, upsertUnitYardConfig } from "../services"

function mergeConfigs(snapshotConfigs: readonly UnitYardConfig[], optimisticConfigs: ReadonlyMap<string, UnitYardConfig>) {
  if (optimisticConfigs.size === 0) {
    return [...snapshotConfigs]
  }
  const merged = new Map<string, UnitYardConfig>()
  for (const config of snapshotConfigs) {
    merged.set(config.unitId, normalizeUnitYardConfig(config))
  }
  for (const [unitId, config] of optimisticConfigs) {
    merged.set(unitId, normalizeUnitYardConfig(config))
  }
  return Array.from(merged.values()).sort((left, right) => left.unitId.localeCompare(right.unitId, "pt-BR", { numeric: true }))
}

export function useUnitYardConfigs() {
  const snapshot = useAsyncSnapshot<UnitYardConfig[]>({
    cacheKey: UNIT_YARD_CONFIGS_CACHE_KEY,
    errorMessage: unitsCopy.errors.unitYardLoad,
    initialData: [],
    loadData: listUnitYardConfigs,
  })
  const { data: snapshotData, refetch } = snapshot
  const [isSaving, setIsSaving] = React.useState(false)
  const [optimisticConfigs, setOptimisticConfigs] = React.useState<ReadonlyMap<string, UnitYardConfig>>(() => new Map())
  const activeSaveRef = React.useRef<Promise<UnitYardConfig> | null>(null)
  const data = React.useMemo(() => mergeConfigs(snapshotData, optimisticConfigs), [optimisticConfigs, snapshotData])

  const saveConfig = React.useCallback(async (input: UpsertUnitYardConfigInput) => {
    if (activeSaveRef.current) {
      return activeSaveRef.current
    }
    setIsSaving(true)
    activeSaveRef.current = (async () => {
      const optimisticConfig = normalizeUnitYardConfig({
        unitId: input.unitId,
        patioActive: input.patioActive,
        parkingSpots: input.parkingSpots,
        updatedAt: new Date().toISOString(),
      })
      setOptimisticConfigs((current) => {
        const next = new Map(current)
        next.set(optimisticConfig.unitId, optimisticConfig)
        return next
      })
      const config = normalizeUnitYardConfig(await upsertUnitYardConfig(input))
      setOptimisticConfigs((current) => {
        const next = new Map(current)
        next.set(config.unitId, config)
        return next
      })
      await refetch()
      return config
    })()
    try {
      return await activeSaveRef.current
    } finally {
      activeSaveRef.current = null
      setIsSaving(false)
    }
  }, [refetch])

  return { ...snapshot, data, isSaving, saveConfig }
}
