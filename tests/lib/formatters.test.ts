import { describe, expect, it } from "vitest"

import { formatHumanReadableText } from "@/lib/formatters"

describe("formatHumanReadableText", () => {
  it("formats uppercase and lowercase human text with Portuguese casing", () => {
    expect(formatHumanReadableText("POSTO MONTE CARLO ONDA VERDE LTDA")).toBe(
      "Posto Monte Carlo Onda Verde LTDA"
    )
    expect(formatHumanReadableText("joão da conceição")).toBe(
      "João da Conceição"
    )
  })

  it("preserves existing diacritics and approved acronyms", () => {
    expect(formatHumanReadableText("SÃO JOSÉ DO RIO PRETO")).toBe(
      "São José do Rio Preto"
    )
    expect(formatHumanReadableText("PONTA GROSSA BR-376")).toBe(
      "Ponta Grossa BR-376"
    )
    expect(formatHumanReadableText("SAO JOSE DO RIO PRETO")).toBe(
      "São José do Rio Preto"
    )
    expect(formatHumanReadableText("Sao Paulo")).toBe("São Paulo")
    expect(formatHumanReadableText("CONFIGURACAO DO PATIO")).toBe(
      "Configuração do Pátio"
    )
  })

  it("does not rewrite intentional mixed casing", () => {
    expect(formatHumanReadableText("iFood Serviços Digitais")).toBe(
      "iFood Serviços Digitais"
    )
  })
})
