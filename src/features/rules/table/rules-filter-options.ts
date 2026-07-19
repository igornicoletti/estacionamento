import { createDataTableFilterOptions } from "@/components/data-table"

import {
  ruleTargetTypeLabels,
  ruleTypeLabels,
  type VipRuleRecord,
} from "../model"
import { rulesCopy } from "../constants"

export function createRuleTypeOptions(records: readonly VipRuleRecord[]) {
  return createDataTableFilterOptions(
    records,
    (record) => record.type,
    (record) => ruleTypeLabels[record.type]
  )
}

export function createRuleTargetTypeOptions(records: readonly VipRuleRecord[]) {
  return createDataTableFilterOptions(
    records,
    (record) => record.targetType,
    (record) => ruleTargetTypeLabels[record.targetType]
  )
}

export function createRuleStatusOptions(records: readonly VipRuleRecord[]) {
  return createDataTableFilterOptions(
    records,
    (record) => String(record.active),
    (record) => (record.active ? rulesCopy.labels.active : rulesCopy.labels.inactive)
  )
}
