import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { listClients } from "../services/clients-service"
import { type Client } from "../types/clients-types"
import { clientsCopy } from "../clients-copy"

export function useClients() {
  return useAsyncSnapshot<Client[]>({
    cacheKey: "clients:list:v2",
    errorMessage: clientsCopy.errors.clientsLoad,
    initialData: [],
    loadData: listClients,
  })
}
