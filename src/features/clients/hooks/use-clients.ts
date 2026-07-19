import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { CLIENTS_LIST_CACHE_KEY, clientsCopy } from "../constants"
import { type Client } from "../model"
import { listClients } from "../services"

export function useClients() {
  return useAsyncSnapshot<Client[]>({
    cacheKey: CLIENTS_LIST_CACHE_KEY,
    errorMessage: clientsCopy.errors.clientsLoad,
    initialData: [],
    loadData: listClients,
  })
}
