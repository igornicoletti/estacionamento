import { buildUnitYardConfigMap } from "./units-formatting"
import {
  type Unit,
  type UnitUserStats,
  type UnitYardConfig,
} from "./units-types"

export type UnitTableRow = Unit & {
  userStats: UnitUserStats | null
  yardConfig: UnitYardConfig | null
}

export function createUnitTableRows({
  units,
  userStats,
  yardConfigs,
}: {
  units: readonly Unit[]
  userStats: ReadonlyMap<string, UnitUserStats> | null
  yardConfigs: readonly UnitYardConfig[]
}): UnitTableRow[] {
  const yardConfigByUnitId = buildUnitYardConfigMap(yardConfigs)

  return units.map((unit) => {
    const unitId = String(unit.cod_empresa)

    return {
      ...unit,
      userStats: userStats?.get(unitId) ?? null,
      yardConfig: yardConfigByUnitId.get(unitId) ?? null,
    }
  })
}
