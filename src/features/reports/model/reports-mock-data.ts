import { type ReportsSnapshot } from "./reports-types"

function buildVehicleRows(unitId: string): ReportsSnapshot["vehicleMovements"] {
  return [
    {
      id: `${unitId}-rp-vm-1`,
      capturedAt: "2026-07-20T08:14:00-03:00",
      plate: "ABC1D23",
      cameraType: "entrada",
      cameraName: "Entrada Principal",
      confidence: 98.6,
      stayMinutes: 140,
      status: "no_patio",
    },
    {
      id: `${unitId}-rp-vm-2`,
      capturedAt: "2026-07-20T09:02:00-03:00",
      plate: "QWE4R56",
      cameraType: "saida",
      cameraName: "Saída Sul",
      confidence: 96.4,
      stayMinutes: 88,
      status: "fora_do_patio",
    },
    {
      id: `${unitId}-rp-vm-3`,
      capturedAt: "2026-07-20T10:33:00-03:00",
      plate: "ZXC7V89",
      cameraType: "entrada",
      cameraName: "Entrada Principal",
      confidence: 91.2,
      stayMinutes: 260,
      status: "no_patio_alerta",
    },
  ]
}

export const reportsMockByUnitId: Record<string, ReportsSnapshot> = {
  "1": {
    unitId: "1",
    unitName: "Monte Carlo Centro",
    vehicleMovements: buildVehicleRows("1"),
    billingRows: [
      {
        id: "1-rp-bill-1",
        referenceDate: "2026-07-20",
        vehiclesCharged: 412,
        averageTicket: 44.51,
        grossRevenue: 18340,
        rulesVersionLabel: "RV-2026.07.20-01",
        pricesVersionLabel: "PV-2026.07.20-02",
      },
      {
        id: "1-rp-bill-2",
        referenceDate: "2026-07-19",
        vehiclesCharged: 389,
        averageTicket: 43.12,
        grossRevenue: 16778,
        rulesVersionLabel: "RV-2026.07.18-03",
        pricesVersionLabel: "PV-2026.07.18-01",
      },
    ],
    occupancyAlerts: [
      {
        id: "1-rp-oa-1",
        occurredAt: "2026-07-20T16:20:00-03:00",
        occupancyPercent: 88,
        capacity: 180,
        availableSpots: 22,
        severity: "warning",
        description: "Pico de ocupação acima do limiar operacional da unidade.",
      },
      {
        id: "1-rp-oa-2",
        occurredAt: "2026-07-20T16:55:00-03:00",
        occupancyPercent: 94,
        capacity: 180,
        availableSpots: 10,
        severity: "critical",
        description: "Risco de superlotação. Acionar regra de contenção de entrada.",
      },
    ],
  },
  "2": {
    unitId: "2",
    unitName: "Monte Carlo Norte",
    vehicleMovements: buildVehicleRows("2"),
    billingRows: [
      {
        id: "2-rp-bill-1",
        referenceDate: "2026-07-20",
        vehiclesCharged: 241,
        averageTicket: 41.24,
        grossRevenue: 9940,
        rulesVersionLabel: "RV-2026.07.19-01",
        pricesVersionLabel: "PV-2026.07.19-01",
      },
    ],
    occupancyAlerts: [
      {
        id: "2-rp-oa-1",
        occurredAt: "2026-07-20T14:10:00-03:00",
        occupancyPercent: 63,
        capacity: 120,
        availableSpots: 44,
        severity: "info",
        description: "Fluxo normal dentro da capacidade operacional esperada.",
      },
    ],
  },
}
