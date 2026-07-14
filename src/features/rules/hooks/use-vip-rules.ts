import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { rulesCopy } from "../rules-copy"
import {
  listVipRules,
  saveVipRule,
  toggleClientVip,
  toggleVehicleVip,
} from "../services/vip-rules-service"
import { type SaveVipRuleInput, type VipRule } from "../types/vip-rules-types"

export function useVipRules() {
  const snapshot = useAsyncSnapshot<VipRule[]>({
    cacheKey: "rules:commercial:v1",
    errorMessage: rulesCopy.feedback.loadError,
    initialData: [],
    loadData: listVipRules,
  })
  const [isSaving, setIsSaving] = React.useState(false)

  const saveRule = React.useCallback(
    async (input: SaveVipRuleInput) => {
      setIsSaving(true)

      try {
        const rule = await saveVipRule(input)
        await snapshot.refetch()
        return rule
      } finally {
        setIsSaving(false)
      }
    },
    [snapshot]
  )

  const saveClientToggle = React.useCallback(
    async (input: Parameters<typeof toggleClientVip>[0]) => {
      setIsSaving(true)

      try {
        const rule = await toggleClientVip(input)
        await snapshot.refetch()
        return rule
      } finally {
        setIsSaving(false)
      }
    },
    [snapshot]
  )

  const saveVehicleToggle = React.useCallback(
    async (input: Parameters<typeof toggleVehicleVip>[0]) => {
      setIsSaving(true)

      try {
        const rule = await toggleVehicleVip(input)
        await snapshot.refetch()
        return rule
      } finally {
        setIsSaving(false)
      }
    },
    [snapshot]
  )

  return {
    ...snapshot,
    isSaving,
    saveRule,
    toggleClientVip: saveClientToggle,
    toggleVehicleVip: saveVehicleToggle,
  }
}
