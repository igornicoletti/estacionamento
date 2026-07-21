import { type DashboardDataSnapshot } from "./dashboard-types"

function createMovements(
  unitId: string,
): DashboardDataSnapshot["vehicleMovements"] {
  return [
    {
      id: `${unitId}-mv-1`,
      plate: "SCV1994",
      cameraType: "entrada",
      cameraName: "Entrada Principal",
      capturedAt: "2026-04-24T08:14:00-03:00",
      confidence: 82,
      stayMinutes: null,
      status: "no_patio",
    },
    {
      id: `${unitId}-mv-2`,
      plate: "FRK1H24",
      cameraType: "saida",
      cameraName: "Saída Principal",
      capturedAt: "2026-04-24T09:02:00-03:00",
      confidence: 82,
      stayMinutes: 64,
      status: "fora_do_patio",
    },
    {
      id: `${unitId}-mv-3`,
      plate: "FEJ8J19",
      cameraType: "entrada",
      cameraName: "Entrada Principal",
      capturedAt: "2026-04-24T10:33:00-03:00",
      confidence: 90,
      stayMinutes: null,
      status: "no_patio_alerta",
    },
  ]
}

function createOccupancySeries(
  scale = 1,
): DashboardDataSnapshot["occupancySeries"] {
  return [
    {
      hour: "06:00",
      occupancyPercent: Math.min(100, 22 * scale),
      entries: 14,
      exits: 6,
    },
    {
      hour: "08:00",
      occupancyPercent: Math.min(100, 44 * scale),
      entries: 28,
      exits: 13,
    },
    {
      hour: "10:00",
      occupancyPercent: Math.min(100, 63 * scale),
      entries: 33,
      exits: 16,
    },
    {
      hour: "12:00",
      occupancyPercent: Math.min(100, 71 * scale),
      entries: 29,
      exits: 22,
    },
    {
      hour: "14:00",
      occupancyPercent: Math.min(100, 78 * scale),
      entries: 34,
      exits: 26,
    },
    {
      hour: "16:00",
      occupancyPercent: Math.min(100, 81 * scale),
      entries: 31,
      exits: 21,
    },
    {
      hour: "18:00",
      occupancyPercent: Math.min(100, 69 * scale),
      entries: 20,
      exits: 29,
    },
    {
      hour: "20:00",
      occupancyPercent: Math.min(100, 54 * scale),
      entries: 13,
      exits: 23,
    },
  ]
}

function createRevenueSeries(
  scale = 1,
): DashboardDataSnapshot["revenueSeries"] {
  return [
    {
      day: "Seg",
      revenue: Math.round(4820 * scale),
      vehicles: Math.round(126 * scale),
    },
    {
      day: "Ter",
      revenue: Math.round(5340 * scale),
      vehicles: Math.round(138 * scale),
    },
    {
      day: "Qua",
      revenue: Math.round(5590 * scale),
      vehicles: Math.round(146 * scale),
    },
    {
      day: "Qui",
      revenue: Math.round(5930 * scale),
      vehicles: Math.round(151 * scale),
    },
    {
      day: "Sex",
      revenue: Math.round(6480 * scale),
      vehicles: Math.round(169 * scale),
    },
    {
      day: "Sáb",
      revenue: Math.round(5240 * scale),
      vehicles: Math.round(139 * scale),
    },
    {
      day: "Dom",
      revenue: Math.round(4110 * scale),
      vehicles: Math.round(112 * scale),
    },
  ]
}

export const dashboardMockByUnitId: Record<string, DashboardDataSnapshot> = {
  "7": {
    unitId: "7",
    unitName: "Onda Verde",
    parkingCapacity: 82,
    indicators: [
      {
        id: "vehicles-in-yard",
        label: "Veículos no pátio",
        value: 49,
        unit: "count",
        trendPercent: 4.8,
        hint: "Comparado com o mesmo período de ontem.",
      },
      {
        id: "occupancy",
        label: "Ocupação",
        value: 60,
        unit: "percent",
        trendPercent: 3.2,
        hint: "Capacidade total configurada da unidade.",
      },
      {
        id: "avg-stay",
        label: "Permanência média",
        value: 118,
        unit: "minutes",
        trendPercent: -2.2,
        hint: "Tempo médio até a saída registrada.",
      },
      {
        id: "gross-revenue",
        label: "Faturamento bruto (dia)",
        value: 4260,
        unit: "currency",
        trendPercent: 6.5,
        hint: "Total bruto calculado pelas regras vigentes.",
      },
    ],
    occupancySeries: createOccupancySeries(0.72),
    revenueSeries: createRevenueSeries(0.32),
    vehicleMovements: createMovements("7"),
    billingRows: [
      {
        id: "7-bill-1",
        period: "2026-04-24",
        vehiclesCharged: 96,
        averageTicket: 44.38,
        occupancyPeakPercent: 64,
        grossRevenue: 4260,
      },
      {
        id: "7-bill-2",
        period: "2026-04-23",
        vehiclesCharged: 88,
        averageTicket: 41.9,
        occupancyPeakPercent: 59,
        grossRevenue: 3687,
      },
    ],
    alerts: [
      {
        id: "7-alert-1",
        severity: "warning",
        title: "Leituras com baixa confiança",
        description:
          "Saídas recentes exigem conferência por baixa confiança da placa.",
        occurredAt: "2026-04-24T16:20:00-03:00",
      },
      {
        id: "7-alert-2",
        severity: "info",
        title: "Pátio ativo configurado",
        description:
          "Capacidade inicial sincronizada com 82 vagas da unidade Onda Verde.",
        occurredAt: "2026-04-24T09:00:00-03:00",
      },
    ],
  },
}
