import { type DashboardDataSnapshot } from "./dashboard-types"

function createMovements(unitId: string): DashboardDataSnapshot["vehicleMovements"] {
  return [
    {
      id: `${unitId}-mv-1`,
      plate: "ABC1D23",
      cameraType: "entrada",
      cameraName: "Entrada Principal",
      capturedAt: "2026-07-20T08:14:00-03:00",
      confidence: 98.6,
      stayMinutes: 140,
      status: "no_patio",
    },
    {
      id: `${unitId}-mv-2`,
      plate: "QWE4R56",
      cameraType: "saida",
      cameraName: "Saída Sul",
      capturedAt: "2026-07-20T09:02:00-03:00",
      confidence: 96.4,
      stayMinutes: 88,
      status: "fora_do_patio",
    },
    {
      id: `${unitId}-mv-3`,
      plate: "ZXC7V89",
      cameraType: "entrada",
      cameraName: "Entrada Principal",
      capturedAt: "2026-07-20T10:33:00-03:00",
      confidence: 91.2,
      stayMinutes: 260,
      status: "no_patio_alerta",
    },
  ]
}

function createOccupancySeries(scale = 1): DashboardDataSnapshot["occupancySeries"] {
  return [
    { hour: "06:00", occupancyPercent: Math.min(100, 22 * scale), entries: 14, exits: 6 },
    { hour: "08:00", occupancyPercent: Math.min(100, 44 * scale), entries: 28, exits: 13 },
    { hour: "10:00", occupancyPercent: Math.min(100, 63 * scale), entries: 33, exits: 16 },
    { hour: "12:00", occupancyPercent: Math.min(100, 71 * scale), entries: 29, exits: 22 },
    { hour: "14:00", occupancyPercent: Math.min(100, 78 * scale), entries: 34, exits: 26 },
    { hour: "16:00", occupancyPercent: Math.min(100, 81 * scale), entries: 31, exits: 21 },
    { hour: "18:00", occupancyPercent: Math.min(100, 69 * scale), entries: 20, exits: 29 },
    { hour: "20:00", occupancyPercent: Math.min(100, 54 * scale), entries: 13, exits: 23 },
  ]
}

function createRevenueSeries(scale = 1): DashboardDataSnapshot["revenueSeries"] {
  return [
    { day: "Seg", revenue: Math.round(4820 * scale), vehicles: Math.round(126 * scale) },
    { day: "Ter", revenue: Math.round(5340 * scale), vehicles: Math.round(138 * scale) },
    { day: "Qua", revenue: Math.round(5590 * scale), vehicles: Math.round(146 * scale) },
    { day: "Qui", revenue: Math.round(5930 * scale), vehicles: Math.round(151 * scale) },
    { day: "Sex", revenue: Math.round(6480 * scale), vehicles: Math.round(169 * scale) },
    { day: "Sáb", revenue: Math.round(5240 * scale), vehicles: Math.round(139 * scale) },
    { day: "Dom", revenue: Math.round(4110 * scale), vehicles: Math.round(112 * scale) },
  ]
}

export const dashboardMockByUnitId: Record<string, DashboardDataSnapshot> = {
  "1": {
    unitId: "1",
    unitName: "Monte Carlo Centro",
    parkingCapacity: 180,
    indicators: [
      {
        id: "vehicles-in-yard",
        label: "Veículos no pátio",
        value: 142,
        unit: "count",
        trendPercent: 6.1,
        hint: "Comparado com o mesmo período de ontem.",
      },
      {
        id: "occupancy",
        label: "Ocupação",
        value: 78,
        unit: "percent",
        trendPercent: 4.3,
        hint: "Capacidade total configurada da unidade.",
      },
      {
        id: "avg-stay",
        label: "Permanência média",
        value: 124,
        unit: "minutes",
        trendPercent: -2.2,
        hint: "Tempo médio até a saída registrada.",
      },
      {
        id: "gross-revenue",
        label: "Faturamento bruto (dia)",
        value: 18340,
        unit: "currency",
        trendPercent: 8.7,
        hint: "Total bruto calculado pelas regras vigentes.",
      },
    ],
    occupancySeries: createOccupancySeries(1),
    revenueSeries: createRevenueSeries(1),
    vehicleMovements: createMovements("1"),
    billingRows: [
      {
        id: "1-bill-1",
        period: "2026-07-20",
        vehiclesCharged: 412,
        averageTicket: 44.51,
        occupancyPeakPercent: 88,
        grossRevenue: 18340,
      },
      {
        id: "1-bill-2",
        period: "2026-07-19",
        vehiclesCharged: 389,
        averageTicket: 43.12,
        occupancyPeakPercent: 81,
        grossRevenue: 16778,
      },
    ],
    alerts: [
      {
        id: "1-alert-1",
        severity: "warning",
        title: "Ocupação acima de 80%",
        description: "Pico de ocupação atingiu 88% entre 15:40 e 16:20.",
        occurredAt: "2026-07-20T16:20:00-03:00",
      },
      {
        id: "1-alert-2",
        severity: "info",
        title: "Atualização de preços aplicada",
        description: "Nova tabela de preços foi publicada para a unidade.",
        occurredAt: "2026-07-20T09:00:00-03:00",
      },
    ],
  },
  "2": {
    unitId: "2",
    unitName: "Monte Carlo Norte",
    parkingCapacity: 120,
    indicators: [
      {
        id: "vehicles-in-yard",
        label: "Veículos no pátio",
        value: 66,
        unit: "count",
        trendPercent: 1.4,
        hint: "Comparado com o mesmo período de ontem.",
      },
      {
        id: "occupancy",
        label: "Ocupação",
        value: 55,
        unit: "percent",
        trendPercent: 3.1,
        hint: "Capacidade total configurada da unidade.",
      },
      {
        id: "avg-stay",
        label: "Permanência média",
        value: 97,
        unit: "minutes",
        trendPercent: -1.1,
        hint: "Tempo médio até a saída registrada.",
      },
      {
        id: "gross-revenue",
        label: "Faturamento bruto (dia)",
        value: 9940,
        unit: "currency",
        trendPercent: 5.5,
        hint: "Total bruto calculado pelas regras vigentes.",
      },
    ],
    occupancySeries: createOccupancySeries(0.72),
    revenueSeries: createRevenueSeries(0.63),
    vehicleMovements: createMovements("2"),
    billingRows: [
      {
        id: "2-bill-1",
        period: "2026-07-20",
        vehiclesCharged: 241,
        averageTicket: 41.24,
        occupancyPeakPercent: 63,
        grossRevenue: 9940,
      },
    ],
    alerts: [
      {
        id: "2-alert-1",
        severity: "info",
        title: "Fluxo estável",
        description: "Unidade opera abaixo de 65% de ocupação nas últimas 4 horas.",
        occurredAt: "2026-07-20T18:00:00-03:00",
      },
    ],
  },
}
