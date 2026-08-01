import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ClientsTable } from "@/features/clients/components/clients-table"
import { type ClientTableRow } from "@/features/clients/model/clients-types"
import * as exportModule from "@/lib/export"

const client: ClientTableRow = {
  bloqueio_financeiro: false,
  cod_pessoa: 1001,
  des_email_1: "contato@alfa.com.br",
  dta_cadastro: "2024-01-15",
  dta_ultima_compra: "2026-06-20",
  ind_pessoa_ativa: true,
  nom_cidade: "São Paulo",
  nom_fantasia: "Auto Center Alfa",
  nom_pessoa: "Auto Center Alfa Ltda",
  num_cnpj_cpf: "12.345.678/0001-10",
  num_telefone_1: "(11) 3333-4444",
  qtd_veiculos: 2,
  sgl_estado: "SP",
  status: "ativo",
}

describe("ClientsTable export", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(exportModule, "exportRowsToXlsx").mockImplementation(() => new Blob())
  })

  afterEach(() => vi.restoreAllMocks())

  it("excludes client PII from the complete export", async () => {
    render(
      <ClientsTable
        data={[client]}
        error={null}
        isLoading={false}
        onOpenDetails={vi.fn()}
        onRetry={vi.fn()}
        onSelectVehicles={vi.fn()}
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

    expect(headers).toContain("Cliente")
    expect(headers).not.toEqual(expect.arrayContaining(["CNPJ/CPF", "E-mail", "Telefone"]))
    expect(JSON.stringify(options.rows)).not.toContain("12.345.678/0001-10")
    expect(JSON.stringify(options.rows)).not.toContain("contato@alfa.com.br")
    expect(JSON.stringify(options.rows)).not.toContain("(11) 3333-4444")
  })
})
