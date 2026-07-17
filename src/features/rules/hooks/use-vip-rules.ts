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
  const activeMutationRef = React.useRef<Promise<VipRule> | null>(null)

  const runMutation = React.useCallback(async (mutation: () => Promise<VipRule>) => {
    if (activeMutationRef.current) {
      return activeMutationRef.current
    }

    setIsSaving(true)
    activeMutationRef.current = mutation()

    try {
      return await activeMutationRef.current
    } finally {
      activeMutationRef.current = null
      setIsSaving(false)
    }
  }, [])

  const saveRule = React.useCallback(
    async (input: SaveVipRuleInput) => {
      return runMutation(async () => {
        const rule = await saveVipRule(input)
        await snapshot.refetch()
        return rule
      })
    },
    [runMutation, snapshot]
  )

  const saveClientToggle = React.useCallback(
    async (input: Parameters<typeof toggleClientVip>[0]) => {
      return runMutation(async () => {
        const rule = await toggleClientVip(input)
        await snapshot.refetch()
        return rule
      })
    },
    [runMutation, snapshot]
  )

  const saveVehicleToggle = React.useCallback(
    async (input: Parameters<typeof toggleVehicleVip>[0]) => {
      return runMutation(async () => {
        const rule = await toggleVehicleVip(input)
        await snapshot.refetch()
        return rule
      })
    },
    [runMutation, snapshot]
  )

  return {
    ...snapshot,
    isSaving,
    saveRule,
    toggleClientVip: saveClientToggle,
    toggleVehicleVip: saveVehicleToggle,
  }
}
