import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { clientsCopy } from "../constants/clients-copy"
import {
  CLIENT_VIP_RULES_CACHE_KEY,
  CLIENT_VIP_RULES_DISABLED_CACHE_KEY,
} from "../constants/clients-persistence"
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
    cacheKey: enabled ? CLIENT_VIP_RULES_CACHE_KEY : CLIENT_VIP_RULES_DISABLED_CACHE_KEY,
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
