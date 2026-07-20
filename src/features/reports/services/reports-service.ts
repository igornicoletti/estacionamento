import { reportsMockByUnitId } from "../model/reports-mock-data"
import { type ReportsSnapshot } from "../model/reports-types"

const defaultUnitId = "1"

function cloneSnapshot(snapshot: ReportsSnapshot): ReportsSnapshot {
  return {
    ...snapshot,
    vehicleMovements: snapshot.vehicleMovements.map((item) => ({ ...item })),
    billingRows: snapshot.billingRows.map((item) => ({ ...item })),
    occupancyAlerts: snapshot.occupancyAlerts.map((item) => ({ ...item })),
  }
}

export async function getReportsSnapshotByUnitId(unitId: string | null) {
  await Promise.resolve()

  const resolvedId = unitId ?? defaultUnitId
  const snapshot = reportsMockByUnitId[resolvedId] ?? reportsMockByUnitId[defaultUnitId]

  return cloneSnapshot(snapshot)
}
