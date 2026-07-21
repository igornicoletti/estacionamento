import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENT_VEHICLES_CACHE_KEY_PREFIX } from "../constants/clients-persistence"
import { type ClientVehicle } from "../model"
import { listClientVehiclesByClientId } from "../services"

interface UseClientVehiclesOptions {
  enabled?: boolean
}

export function useClientVehicles(
  clientId: number | null,
  options: UseClientVehiclesOptions = {}
) {
  const enabled = options.enabled ?? true

  return useAsyncSnapshot<ClientVehicle[]>({
    cacheKey: `${CLIENT_VEHICLES_CACHE_KEY_PREFIX}:${clientId ?? "invalid"}:${enabled ? "enabled" : "disabled"}`,
    errorMessage: clientsCopy.errors.vehiclesLoad,
    initialData: [],
    loadData: () => {
      if (!enabled || clientId === null) {
        return Promise.resolve([])
      }

      return listClientVehiclesByClientId(clientId)
    },
  })
}
