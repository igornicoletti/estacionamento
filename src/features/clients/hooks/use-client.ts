import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENTS_CACHE_KEY } from "../constants/clients-persistence"
import { type Client } from "../model"
import { listClientById } from "../services"

interface UseClientOptions {
  enabled?: boolean
}

export function useClient(clientId: number | null, options: UseClientOptions = {}) {
  const enabled = options.enabled ?? true

  return useAsyncSnapshot<Client | null>({
    cacheKey: `${CLIENTS_CACHE_KEY}:detail:${clientId ?? "invalid"}:${enabled ? "enabled" : "disabled"}`,
    errorMessage: clientsCopy.errors.clientsLoad,
    initialData: null,
    loadData: () => {
      if (!enabled || clientId === null) {
        return Promise.resolve(null)
      }

      return listClientById(clientId)
    },
  })
}
