import { getUnitUserStatsGateway } from "../gateways/unit-user-stats-gateway"
import { type UnitUserStats } from "../model/units-types"

export async function listUnitUserStats() {
  const rows = await getUnitUserStatsGateway().listStats()

  return new Map<string, UnitUserStats>(
    rows.map((row) => [
      String(row.unit_id),
      {
        managers: row.managers,
        operators: row.operators,
      },
    ])
  )
}
