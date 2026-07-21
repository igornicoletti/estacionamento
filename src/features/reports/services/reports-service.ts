import { getUnitYardConfig } from "@/features/units/services/unit-yard-service"

import { reportsMockByUnitId } from "../model/reports-mock-data"
import { type ReportsSnapshot } from "../model/reports-types"

const defaultUnitId = "7"

function cloneSnapshot(snapshot: ReportsSnapshot): ReportsSnapshot {
  return {
    ...snapshot,
    vehicleMovements: snapshot.vehicleMovements.map((item) => ({ ...item })),
    billingRows: snapshot.billingRows.map((item) => ({ ...item })),
    occupancyAlerts: snapshot.occupancyAlerts.map((item) => ({ ...item })),
  }
}

function applyYardConfigToSnapshot(
  snapshot: ReportsSnapshot,
  parkingCapacity: number | null,
) {
  if (!parkingCapacity || parkingCapacity <= 0) {
    return snapshot
  }

  return {
    ...snapshot,
    occupancyAlerts: snapshot.occupancyAlerts.map((alert) => ({
      ...alert,
      availableSpots: Math.max(
        parkingCapacity -
          Math.round((parkingCapacity * alert.occupancyPercent) / 100),
        0,
      ),
      capacity: parkingCapacity,
    })),
  }
}

export async function getReportsSnapshotByUnitId(unitId: string | null) {
  if (import.meta.env.PROD) {
    throw new Error("Relatórios indisponíveis sem fonte de dados operacional.")
  }

  await Promise.resolve()

  const resolvedId = unitId ?? defaultUnitId
  const snapshot = reportsMockByUnitId[resolvedId]
  if (!snapshot) {
    throw new Error(
      "Relatórios sem dados operacionais para a unidade selecionada.",
    )
  }
  const yardConfig = await getUnitYardConfig(resolvedId)

  return applyYardConfigToSnapshot(
    cloneSnapshot(snapshot),
    yardConfig?.parkingSpots ?? null,
  )
}
