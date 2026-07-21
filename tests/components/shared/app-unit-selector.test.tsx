import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  AppUnitSelector,
  formatUnitSelectorOption,
  SelectedUnitProvider,
} from "@/components/shared/app-unit-selector"

const mocks = vi.hoisted(() => ({
  authContext: {
    profile: {
      roleKey: "owner",
      unitId: null,
    },
  },
  units: [
    {
      cod_bandeira: 1,
      cod_cidade: 1,
      cod_empresa: 24,
      des_bandeira: "Monte Carlo",
      des_coordenada_empresa: "",
      ip_rede: "",
      nom_banco_dados: "",
      nom_cidade: "Campinas",
      nom_estado: "São Paulo",
      nom_fantasia: "Iguatemi",
      nom_razao_social: "Iguatemi Ltda.",
      num_cnpj: "00.000.000/0001-00",
      sgl_estado: "SP",
    },
    {
      cod_bandeira: 1,
      cod_cidade: 2,
      cod_empresa: 25,
      des_bandeira: "Monte Carlo",
      des_coordenada_empresa: "",
      ip_rede: "",
      nom_banco_dados: "",
      nom_cidade: "Campinas",
      nom_estado: "São Paulo",
      nom_fantasia: "Dom Pedro",
      nom_razao_social: "Dom Pedro Ltda.",
      num_cnpj: "00.000.000/0002-00",
      sgl_estado: "SP",
    },
  ],
  yardConfigs: [
    {
      parkingSpots: 82,
      patioActive: true,
      unitId: "24",
      updatedAt: "2026-07-21T12:00:00.000Z",
    },
    {
      parkingSpots: 40,
      patioActive: false,
      unitId: "25",
      updatedAt: "2026-07-21T12:00:00.000Z",
    },
  ],
}))

vi.mock("@/features/auth", async () => {
  const contracts = await import("@/features/auth/contracts")

  return {
    ...contracts,
    useAuth: () => mocks.authContext,
  }
})

vi.mock("@/features/units", () => ({
  useUnitYardConfigs: () => ({
    data: mocks.yardConfigs,
    isLoading: false,
  }),
  useUnits: () => ({
    data: mocks.units,
    isLoading: false,
  }),
}))

describe("AppUnitSelector", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("formats unit options with code and name in a single line", () => {
    expect(formatUnitSelectorOption(mocks.units[0])).toBe("24 — Iguatemi")
  })

  it("renders a responsive h-9 combobox input with flat popup shell", async () => {
    const { baseElement } = render(
      <SelectedUnitProvider>
        <AppUnitSelector />
      </SelectedUnitProvider>,
    )

    const input = screen.getByRole("combobox", { name: "Selecionar unidade" })
    const inputGroup = input.closest('[data-slot="input-group"]')
    const wrapper = inputGroup?.parentElement

    expect(input).toHaveClass("h-9", "w-full")
    expect(inputGroup).toHaveClass("h-9", "w-full")
    expect(wrapper).toHaveClass("w-full", "min-w-0", "lg:w-[320px]")
    fireEvent.click(input)
    fireEvent.keyDown(input, { key: "ArrowDown" })

    await waitFor(() => {
      expect(
        baseElement.querySelector('[data-slot="combobox-group"]'),
      ).toBeNull()
      expect(
        baseElement.querySelector('[data-slot="combobox-label"]'),
      ).toBeNull()
      expect(
        baseElement.querySelector('[data-slot="combobox-content"]'),
      ).toHaveClass("w-(--anchor-width)")
      const popup = baseElement.querySelector('[data-slot="combobox-content"]')

      expect(popup).toHaveTextContent("Iguatemi")
      expect(popup).not.toHaveTextContent("Dom Pedro")
    })
  })

  it("ignores a stored unit when its yard is inactive", () => {
    window.localStorage.setItem("rmc.selected-unit-id", "25")

    render(
      <SelectedUnitProvider>
        <AppUnitSelector />
      </SelectedUnitProvider>,
    )

    expect(
      screen.getByRole("combobox", { name: "Selecionar unidade" }),
    ).toHaveValue("24 — Iguatemi")
  })
})
