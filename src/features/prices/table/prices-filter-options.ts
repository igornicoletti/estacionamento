import { createDataTableFilterOptions } from "@/components/data-table"

import {
  priceScopeLabels,
  priceStatusLabels,
  type PriceTableRecord,
} from "../model"

function removeDuplicateBlank(values: readonly PriceTableRecord[]) {
  return values.filter((record) => record.unitName || record.unitId)
}

export function createPriceStatusOptions(records: readonly PriceTableRecord[]) {
  return createDataTableFilterOptions(
    records,
    (record) => record.status,
    (record) => priceStatusLabels[record.status]
  )
}

export function createPriceScopeOptions(records: readonly PriceTableRecord[]) {
  return createDataTableFilterOptions(
    records,
    (record) => record.scope,
    (record) => priceScopeLabels[record.scope]
  )
}

export function createPriceUnitOptions(records: readonly PriceTableRecord[]) {
  return createDataTableFilterOptions(
    removeDuplicateBlank(records),
    (record) => record.unitId ?? "global",
    (record) => record.unitName ?? "Global"
  )
}
