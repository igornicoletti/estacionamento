import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { UnitsTable } from "@/features/units/components/units-table"
import { type UnitTableRow } from "@/features/units/model/units-table-model"
import * as exportModule from "@/lib/export"

const unit: UnitTableRow = {
  cod_empresa: 1,
  nom_razao_social: "Posto Monte Carlo Centro Ltda",
  nom_fantasia: "Monte Carlo Centro",
  num_cnpj: "00.000.000/0001-00",
  cod_bandeira: 10,
  des_bandeira: "Shell",
  cod_cidade: 3550308,
  nom_cidade: "São Paulo",
  nom_estado: "São Paulo",
  sgl_estado: "SP",
  des_coordenada_empresa: "-23.550520, -46.633308",
  ip_rede: "192.168.0.10",
  nom_banco_dados: "erp_montecarlo_centro",
  userStats: null,
  yardConfig: null,
}

describe("UnitsTable export", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(exportModule, "exportRowsToXlsx").mockImplementation(() => new Blob())
  })

  afterEach(() => vi.restoreAllMocks())

  it("excludes operational secrets from the complete export", async () => {
    render(
      <UnitsTable
        data={[unit]}
        error={null}
        isLoading={false}
        onOpenDetails={vi.fn()}
        onRetry={vi.fn()}
        showUserStats={false}
      />
    )

    fireEvent.pointerDown(
      screen.getByRole("button", { name: "Abrir menu de exportação" })
    )
    fireEvent.click(
      await screen.findByRole("menuitem", { name: /Exportar todo o conteúdo/i })
    )

    const options = vi.mocked(exportModule.exportRowsToXlsx).mock.calls[0]?.[0]
    const headers = options.columns.map((column: { header: string }) => column.header)

    expect(headers).toContain("Unidade")
    expect(headers).not.toEqual(expect.arrayContaining(["CNPJ", "Coordenadas", "IP da rede"]))
    expect(JSON.stringify(options.rows)).not.toContain("00.000.000/0001-00")
    expect(JSON.stringify(options.rows)).not.toContain("-23.550520")
    expect(JSON.stringify(options.rows)).not.toContain("192.168.0.10")
  })
})
