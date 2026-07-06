
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { listClients } from "../services/clients-service"
import { type Client } from "../types/clients-types"

const clientsLoadError = "Não foi possível carregar os clientes."

export function useClients() {
  return useAsyncSnapshot<Client[]>({
    cacheKey: "clients:list",
    initialData: [],
    loadData: listClients,
    errorMessage: clientsLoadError,
  })
}
