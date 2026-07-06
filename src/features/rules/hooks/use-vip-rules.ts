import * as React from "react"

import {
  listVipRules,
  toggleClientVip,
  toggleVehicleVip,
} from "../services/vip-rules-service"
import { type VipRule } from "../types/vip-rules-types"

const vipRulesLoadError = "Não foi possível carregar as regras VIP."

export function useVipRules() {
  const [data, setData] = React.useState<VipRule[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const refetch = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const rules = await listVipRules()
      setData(rules)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError : new Error(vipRulesLoadError)
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleToggleClientVip = React.useCallback(
    async (input: Parameters<typeof toggleClientVip>[0]) => {
      setIsSaving(true)
      try {
        const savedRule = await toggleClientVip(input)
        setData((current) => {
          const next = current.filter((rule) => rule.id !== savedRule.id)
          return [savedRule, ...next]
        })
        return savedRule
      } finally {
        setIsSaving(false)
      }
    },
    []
  )

  const handleToggleVehicleVip = React.useCallback(
    async (input: Parameters<typeof toggleVehicleVip>[0]) => {
      setIsSaving(true)
      try {
        const savedRule = await toggleVehicleVip(input)
        setData((current) => {
          const next = current.filter((rule) => rule.id !== savedRule.id)
          return [savedRule, ...next]
        })
        return savedRule
      } finally {
        setIsSaving(false)
      }
    },
    []
  )

  React.useEffect(() => {
    let isMounted = true

    void (async () => {
      try {
        const rules = await listVipRules()

        if (isMounted) {
          setData(rules)
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError
              : new Error(vipRulesLoadError)
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    data,
    error,
    isLoading,
    isSaving,
    refetch,
    toggleClientVip: handleToggleClientVip,
    toggleVehicleVip: handleToggleVehicleVip,
  }
}
