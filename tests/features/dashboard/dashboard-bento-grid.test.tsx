import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DashboardBentoGrid } from "@/features/dashboard/components"
import {
  getDashboardCapacitySummary,
  getDashboardMovementStatusSummary,
} from "@/features/dashboard/model/dashboard-analytics"
import { dashboardMockByUnitId } from "@/features/dashboard/model/dashboard-mock-data"

const snapshot = dashboardMockByUnitId["7"]

describe("DashboardBentoGrid", () => {
  it("renders the supported bento blocks from the dashboard snapshot", () => {
    render(<DashboardBentoGrid snapshot={snapshot} />)

    expect(screen.getByText("Vagas da unidade")).toBeInTheDocument()
    expect(screen.getByText("49 de 82")).toBeInTheDocument()
    expect(screen.getByText("Entradas e saídas")).toBeInTheDocument()
    expect(screen.getByText("Indicadores operacionais")).toBeInTheDocument()
    expect(screen.getByText("Status das movimentações")).toBeInTheDocument()
    expect(screen.getByText("Resultado monitorado")).toBeInTheDocument()
    expect(screen.getByText("Balanço de fluxo")).toBeInTheDocument()
    expect(
      screen.getByText("Movimentações recentes de veículos"),
    ).toBeInTheDocument()
    expect(screen.getByText("Alertas operacionais")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Filtros e ações/ }),
    ).not.toBeInTheDocument()
  })

  it("opens row details from movement and alert actions", () => {
    const onOpenMovementDetails = vi.fn()
    const onOpenAlertDetails = vi.fn()

    render(
      <DashboardBentoGrid
        snapshot={snapshot}
        onOpenMovementDetails={onOpenMovementDetails}
        onOpenAlertDetails={onOpenAlertDetails}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "SCV1994" }))
    fireEvent.click(
      screen.getByRole("button", { name: /Leituras com baixa confiança/ }),
    )

    expect(onOpenMovementDetails).toHaveBeenCalledWith(
      snapshot.vehicleMovements[0],
    )
    expect(onOpenAlertDetails).toHaveBeenCalledWith(snapshot.alerts[0])
  })

  it("switches the main bar chart between movement and revenue", async () => {
    render(<DashboardBentoGrid snapshot={snapshot} />)

    const chartMode = screen.getByRole("combobox", {
      name: "Selecionar visualização do gráfico",
    })

    fireEvent.keyDown(chartMode, { key: "ArrowDown" })
    fireEvent.click(await screen.findByRole("option", { name: "Receita" }))

    expect(screen.getByText("Receita por dia")).toBeInTheDocument()
    expect(
      screen.getByText("Faturamento monitorado por dia da semana."),
    ).toBeInTheDocument()
  })

  it("derives capacity and movement status without synthetic dashboard data", () => {
    expect(getDashboardCapacitySummary(snapshot)).toEqual({
      available: 33,
      capacity: 82,
      occupied: 49,
      occupancyPercent: 60,
    })
    expect(
      getDashboardMovementStatusSummary(snapshot.vehicleMovements),
    ).toEqual([
      {
        key: "fora_do_patio",
        label: "Saída confirmada",
        value: 1,
      },
      {
        key: "no_patio",
        label: "No pátio",
        value: 1,
      },
      {
        key: "no_patio_alerta",
        label: "No pátio em alerta",
        value: 1,
      },
    ])
  })
})
