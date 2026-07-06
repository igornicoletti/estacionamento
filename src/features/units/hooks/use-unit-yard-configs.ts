import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { toError } from "@/lib"

import {
  listUnitYardConfigs,
  upsertUnitYardConfig,
} from "../services/unit-yard-service"
import {
  type UnitYardConfig,
  type UpsertUnitYardConfigInput,
} from "../types/units-types"
import { unitsCopy } from "../units-copy"

const unitYardLoadError = unitsCopy.errors.unitYardLoad

export function useUnitYardConfigs() {
  const {
    data,
    setData,
    isLoading,
    error,
    setError,
    refetch,
  } = useAsyncSnapshot<UnitYardConfig[]>({
    cacheKey: "units:yard-configs",
    initialData: [],
    loadData: listUnitYardConfigs,
    errorMessage: unitYardLoadError,
  })

  const [isSaving, setIsSaving] = React.useState(false)

  const saveConfig = React.useCallback(async (input: UpsertUnitYardConfigInput) => {
    setIsSaving(true)
    setError(null)

    try {
      const savedConfig = await upsertUnitYardConfig(input)

      setData((current) => {
        const next = current.filter((item) => item.unitId !== savedConfig.unitId)
        return [savedConfig, ...next]
      })

      return savedConfig
    } catch (caughtError) {
      const nextError = toError(caughtError, unitsCopy.errors.unitYardSave)

      setError(nextError)
      throw nextError
    } finally {
      setIsSaving(false)
    }
  }, [setData, setError])

  return {
    data,
    isLoading,
    isSaving,
    error,
    refetch,
    saveConfig,
  }
}
