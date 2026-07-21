import * as React from "react"

import {
  createDataTableFilterOptions,
  type DataTableFilterField,
  type DataTableFilterOption,
  type DataTableFilterOptionGroup,
} from "@/components/data-table"

import { unitsCopy } from "../constants/units-copy"
import { type Unit } from "../model"

type UnitsTableFilterSource = Pick<Unit, "des_bandeira" | "nom_cidade" | "sgl_estado">

function formatCityState(unit: UnitsTableFilterSource) {
  return [unit.nom_cidade, unit.sgl_estado].filter(Boolean).join("/")
}

function createCityFilterGroups(
  units: readonly UnitsTableFilterSource[],
  options: readonly DataTableFilterOption[]
): readonly DataTableFilterOptionGroup[] {
  const optionByValue = new Map(options.map((option) => [option.value, option]))
  const groupedOptions = new Map<string, DataTableFilterOption[]>()

  units.forEach((unit) => {
    const value = formatCityState(unit)
    const option = optionByValue.get(value)

    if (!option) {
      return
    }

    const state = unit.sgl_estado.toUpperCase() || unitsCopy.details.emptyValue
    const currentOptions = groupedOptions.get(state) ?? []

    if (!currentOptions.some((item) => item.value === option.value)) {
      currentOptions.push(option)
      groupedOptions.set(state, currentOptions)
    }
  })

  return Array.from(groupedOptions.entries())
    .sort(([stateA], [stateB]) => stateA.localeCompare(stateB, "pt-BR"))
    .map(([label, groupOptions]) => ({
      label,
      options: groupOptions.sort((optionA, optionB) =>
        optionA.label.localeCompare(optionB.label, "pt-BR")
      ),
    }))
}

export function useUnitsTableFilters(units: readonly UnitsTableFilterSource[]) {
  const brandOptions = React.useMemo(
    () => createDataTableFilterOptions(units, (unit) => unit.des_bandeira, (unit) => unit.des_bandeira),
    [units]
  )
  const cityOptions = React.useMemo(
    () => createDataTableFilterOptions(
      units,
      (unit) => formatCityState(unit),
      (unit) => unit.nom_cidade || formatCityState(unit)
    ),
    [units]
  )
  const cityGroups = React.useMemo(
    () => createCityFilterGroups(units, cityOptions),
    [cityOptions, units]
  )

  return [
    { id: "des_bandeira", title: unitsCopy.filters.brands, options: brandOptions },
    { id: "cidadeUf", title: unitsCopy.filters.cities, options: cityOptions, groups: cityGroups },
  ] satisfies readonly DataTableFilterField<UnitsTableFilterSource>[]
}
