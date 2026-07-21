import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import { rulesCopy } from "../constants"
import {
  formatNullableDateTime,
  formatRuleBenefit,
  formatRuleCondition,
  formatRuleTarget,
  formatRuleUnits,
} from "./rules-formatting"
import { ruleTargetTypeLabels, ruleTypeLabels, type VipRuleRecord } from "./rules-types"

function emptyFallback(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "—" : value
}

export function getRuleDetailItems(record: VipRuleRecord): readonly AppDetailsSheetItem[] {
  return [
    { label: rulesCopy.table.type, value: ruleTypeLabels[record.type] },
    { label: rulesCopy.table.target, value: ruleTargetTypeLabels[record.targetType] },
    { label: rulesCopy.form.clientName, value: emptyFallback(formatRuleTarget(record)) },
    { label: rulesCopy.table.units, value: formatRuleUnits(record) },
    { label: rulesCopy.table.benefit, value: formatRuleBenefit(record) },
    { label: rulesCopy.table.condition, value: formatRuleCondition(record) },
    { label: rulesCopy.table.status, value: record.active ? rulesCopy.labels.active : rulesCopy.labels.inactive },
    { label: rulesCopy.form.notes, value: emptyFallback(record.notes) },
    { label: rulesCopy.table.updatedAt, value: formatNullableDateTime(record.updatedAt) },
  ]
}
