import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENTS_CACHE_KEY } from "../constants/clients-persistence"
import { type Client } from "../model"
import { listClients } from "../services"

export function useClients() {
  return useAsyncSnapshot<Client[]>({
    cacheKey: CLIENTS_CACHE_KEY,
    errorMessage: clientsCopy.errors.clientsLoad,
    initialData: [],
    loadData: listClients,
  })
}
