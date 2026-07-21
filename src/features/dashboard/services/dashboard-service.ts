import { getUnitYardConfig } from "@/features/units/services/unit-yard-service"

import { dashboardMockByUnitId } from "../model/dashboard-mock-data"
import { type DashboardDataSnapshot } from "../model/dashboard-types"

const defaultUnitId = "7"

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

function applyYardConfigToSnapshot(
  snapshot: DashboardDataSnapshot,
  parkingCapacity: number | null,
) {
  if (!parkingCapacity || parkingCapacity <= 0) {
    return snapshot
  }

  const occupied =
    snapshot.indicators.find((indicator) => indicator.id === "vehicles-in-yard")
      ?.value ?? 0
  const occupancyPercent =
    parkingCapacity > 0
      ? Math.min(100, Math.round((occupied / parkingCapacity) * 100))
      : 0

  return {
    ...snapshot,
    parkingCapacity,
    indicators: snapshot.indicators.map((indicator) =>
      indicator.id === "occupancy"
        ? {
            ...indicator,
            value: occupancyPercent,
          }
        : indicator,
    ),
  }
}

export async function getDashboardSnapshotByUnitId(unitId: string | null) {
  if (import.meta.env.PROD) {
    throw new Error("Dashboard indisponível sem fonte de dados operacional.")
  }

  await Promise.resolve()

  const resolvedId = unitId ?? defaultUnitId
  const snapshot = dashboardMockByUnitId[resolvedId]
  if (!snapshot) {
    throw new Error(
      "Dashboard sem dados operacionais para a unidade selecionada.",
    )
  }
  const yardConfig = await getUnitYardConfig(resolvedId)

  return applyYardConfigToSnapshot(
    cloneSnapshot(snapshot),
    yardConfig?.parkingSpots ?? null,
  )
}
