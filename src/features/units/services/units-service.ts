import { getUnitsGateway } from "../gateways/units-gateway"
import { mapErpUnit } from "../model/units-normalization"
import { type Unit } from "../model/units-types"

export async function listUnits(): Promise<Unit[]> {
  return (await getUnitsGateway().listUnits()).map(mapErpUnit)
}

export async function findUnitById(unitId: number): Promise<Unit | null> {
  const row = await getUnitsGateway().findUnitById(unitId)
  return row ? mapErpUnit(row) : null
}
