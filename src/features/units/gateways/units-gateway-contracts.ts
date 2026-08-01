import {
  type ErpUnitRow,
  type UnitUserStatsRow,
  type UnitYardConfigRow,
} from "../schemas/units-gateway-schemas"

export interface UnitsGateway {
  findUnitById: (unitId: number) => Promise<ErpUnitRow | null>
  listUnits: () => Promise<readonly ErpUnitRow[]>
}

export interface UnitYardGateway {
  findConfigByUnitId: (
    unitId: string
  ) => Promise<UnitYardConfigRow | null>
  listConfigs: () => Promise<readonly UnitYardConfigRow[]>
}

export interface UnitUserStatsGateway {
  listStats: () => Promise<readonly UnitUserStatsRow[]>
}
