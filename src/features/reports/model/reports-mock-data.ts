import { type ReportsSnapshot } from "./reports-types"

function buildVehicleRows(unitId: string): ReportsSnapshot["vehicleMovements"] {
  return [
    {
      id: `${unitId}-rp-vm-1`,
      capturedAt: "2026-04-24T08:14:00-03:00",
      plate: "SCV1994",
      cameraType: "entrada",
      cameraName: "Entrada Principal",
      confidence: 82,
      stayMinutes: null,
      status: "no_patio",
    },
    {
      id: `${unitId}-rp-vm-2`,
      capturedAt: "2026-04-24T09:02:00-03:00",
      plate: "FRK1H24",
      cameraType: "saida",
      cameraName: "Saída Principal",
      confidence: 82,
      stayMinutes: 64,
      status: "fora_do_patio",
    },
    {
      id: `${unitId}-rp-vm-3`,
      capturedAt: "2026-04-24T10:33:00-03:00",
      plate: "FEJ8J19",
      cameraType: "entrada",
      cameraName: "Entrada Principal",
      confidence: 90,
      stayMinutes: null,
      status: "no_patio_alerta",
    },
  ]
}

export const reportsMockByUnitId: Record<string, ReportsSnapshot> = {
  "7": {
    unitId: "7",
    unitName: "Onda Verde",
    vehicleMovements: buildVehicleRows("7"),
    billingRows: [
      {
        id: "7-rp-bill-1",
        referenceDate: "2026-04-24",
        vehiclesCharged: 96,
        averageTicket: 44.38,
        grossRevenue: 4260,
        rulesVersionLabel: "RV-2026.07.20-01",
        pricesVersionLabel: "PV-2026.07.20-02",
      },
      {
        id: "7-rp-bill-2",
        referenceDate: "2026-04-23",
        vehiclesCharged: 88,
        averageTicket: 41.9,
        grossRevenue: 3687,
        rulesVersionLabel: "RV-2026.07.18-03",
        pricesVersionLabel: "PV-2026.07.18-01",
      },
    ],
    occupancyAlerts: [
      {
        id: "7-rp-oa-1",
        occurredAt: "2026-04-24T16:20:00-03:00",
        occupancyPercent: 64,
        capacity: 82,
        availableSpots: 30,
        severity: "warning",
        description:
          "Pico de ocupação próximo do limiar operacional da unidade.",
      },
      {
        id: "7-rp-oa-2",
        occurredAt: "2026-04-24T14:10:00-03:00",
        occupancyPercent: 52,
        capacity: 82,
        availableSpots: 39,
        severity: "info",
        description: "Fluxo normal dentro da capacidade operacional esperada.",
      },
    ],
  },
}
