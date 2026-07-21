import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import { pricesCopy } from "../constants"
import {
  formatCurrency,
  formatIntegerUnit,
  formatNullableDateTime,
} from "./prices-formatting"
import { priceScopeLabels, priceStatusLabels, type PriceTableRecord } from "./prices-types"

function emptyFallback(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "—" : value
}

export function getPriceTableDetailItems(record: PriceTableRecord): readonly AppDetailsSheetItem[] {
  return [
    { label: pricesCopy.table.name, value: record.name },
    { label: pricesCopy.table.scope, value: priceScopeLabels[record.scope] },
    { label: pricesCopy.table.unit, value: emptyFallback(record.unitName) },
    { label: pricesCopy.table.amount, value: formatCurrency(record.amount) },
    { label: pricesCopy.table.cycleHours, value: formatIntegerUnit(record.cycleHours, "h") },
    { label: pricesCopy.table.graceMinutes, value: formatIntegerUnit(record.graceMinutes, "min") },
    { label: pricesCopy.table.toleranceMinutes, value: formatIntegerUnit(record.toleranceMinutes, "min") },
    { label: pricesCopy.table.startsAt, value: formatNullableDateTime(record.startsAt) },
    { label: pricesCopy.table.endsAt, value: formatNullableDateTime(record.endsAt) },
    { label: pricesCopy.table.status, value: priceStatusLabels[record.status] },
    { label: pricesCopy.form.notes, value: emptyFallback(record.notes) },
  ]
}
