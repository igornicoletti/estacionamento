import { dashboardMockByUnitId } from "../model/dashboard-mock-data"
import { type DashboardDataSnapshot } from "../model/dashboard-types"

const defaultUnitId = "1"

function cloneSnapshot(snapshot: DashboardDataSnapshot): DashboardDataSnapshot {
  return {
    ...snapshot,
    indicators: snapshot.indicators.map((item) => ({ ...item })),
    occupancySeries: snapshot.occupancySeries.map((item) => ({ ...item })),
    revenueSeries: snapshot.revenueSeries.map((item) => ({ ...item })),
    vehicleMovements: snapshot.vehicleMovements.map((item) => ({ ...item })),
    billingRows: snapshot.billingRows.map((item) => ({ ...item })),
    alerts: snapshot.alerts.map((item) => ({ ...item })),
  }
}

export async function getDashboardSnapshotByUnitId(unitId: string | null) {
  await Promise.resolve()

  const resolvedId = unitId ?? defaultUnitId
  const snapshot = dashboardMockByUnitId[resolvedId] ?? dashboardMockByUnitId[defaultUnitId]

  return cloneSnapshot(snapshot)
}
