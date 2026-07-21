import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { clientsCopy } from "../constants/clients-copy"
import { type ClientVipRuleRecord } from "../model"
import {
  listClientVipRules,
  toggleClientVipRule,
  toggleVehicleVipRule,
} from "../services"

interface UseClientVipRulesOptions {
  enabled?: boolean
}

function resolveEmptyVipRules() {
  return Promise.resolve([])
}

export function useClientVipRules(options: UseClientVipRulesOptions = {}) {
  const enabled = options.enabled ?? true
  const snapshot = useAsyncSnapshot<ClientVipRuleRecord[]>({
    cacheKey: `clients:vip-rules:v1:${enabled ? "enabled" : "disabled"}`,
    errorMessage: clientsCopy.errors.vipRulesLoad,
    initialData: [],
    loadData: enabled ? listClientVipRules : resolveEmptyVipRules,
  })

  return {
    ...snapshot,
    toggleClientVip: toggleClientVipRule,
    toggleVehicleVip: toggleVehicleVipRule,
  }
}
