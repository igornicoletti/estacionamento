import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { unitsCopy } from "../constants/units-copy"
import { UNIT_YARD_CONFIGS_CACHE_KEY } from "../constants/units-persistence"
import { type UnitYardConfig } from "../model/units-types"
import { listUnitYardConfigs } from "../services/unit-yard-service"

export function useUnitYardConfigs() {
  const loadData = React.useCallback(() => listUnitYardConfigs(), [])

  return useAsyncSnapshot<UnitYardConfig[]>({
    cacheKey: UNIT_YARD_CONFIGS_CACHE_KEY,
    errorMessage: unitsCopy.errors.unitYardLoad,
    initialData: [],
    loadData,
  })
}
