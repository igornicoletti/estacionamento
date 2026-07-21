import * as React from "react"

import { createDataTableFilterOptions, type DataTableFilterField } from "@/components/data-table"

import { unitsCopy } from "../constants/units-copy"
import { type Unit } from "../model"

type UnitsTableFilterSource = Pick<Unit, "des_bandeira" | "sgl_estado">

export function useUnitsTableFilters(units: readonly UnitsTableFilterSource[]) {
  const brandOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        units,
        (unit) => unit.des_bandeira,
        (unit) => unit.des_bandeira
      ),
    [units]
  )
  const stateOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        units,
        (unit) => unit.sgl_estado,
        (unit) => unit.sgl_estado
      ),
    [units]
  )

  return [
    { id: "des_bandeira", title: unitsCopy.filters.brands, options: brandOptions },
    { id: "sgl_estado", title: unitsCopy.filters.states, options: stateOptions },
  ] satisfies readonly DataTableFilterField<UnitsTableFilterSource>[]
}
