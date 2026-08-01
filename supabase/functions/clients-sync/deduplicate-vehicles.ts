export interface VehicleIdentity {
  cod_veiculo: number
  num_placa: string
  source_updated_at: string | null
}

function resolveTimestamp(value: string | null) {
  if (!value) {
    return Number.NEGATIVE_INFINITY
  }

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY
}

function shouldReplaceVehicle<T extends VehicleIdentity>(current: T, candidate: T) {
  const currentTimestamp = resolveTimestamp(current.source_updated_at)
  const candidateTimestamp = resolveTimestamp(candidate.source_updated_at)

  if (candidateTimestamp !== currentTimestamp) {
    return candidateTimestamp > currentTimestamp
  }

  if (candidate.cod_veiculo !== current.cod_veiculo) {
    return candidate.cod_veiculo > current.cod_veiculo
  }

  return candidate.num_placa.localeCompare(current.num_placa) > 0
}

function collapseByKey<T extends VehicleIdentity>(
  rows: readonly T[],
  resolveKey: (row: T) => number | string
) {
  const rowsByKey = new Map<number | string, T>()

  for (const row of rows) {
    const key = resolveKey(row)
    const current = rowsByKey.get(key)

    if (!current || shouldReplaceVehicle(current, row)) {
      rowsByKey.set(key, row)
    }
  }

  return Array.from(rowsByKey.values())
}

export function deduplicateVehicles<T extends VehicleIdentity>(rows: readonly T[]) {
  const uniqueById = collapseByKey(rows, (row) => row.cod_veiculo)
  const uniqueByPlate = collapseByKey(uniqueById, (row) => row.num_placa)

  return {
    rows: uniqueByPlate,
    collapsed: rows.length - uniqueByPlate.length,
  }
}
