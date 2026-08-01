import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENTS_CACHE_KEY } from "../constants/clients-persistence"
import { mapClientToTableRow } from "../model/clients-table-mappers"
import { type ClientTableRow } from "../model/clients-types"
import { listClients } from "../services/clients-service"

export function useClients() {
  const loadData = React.useCallback(async () => {
    return (await listClients()).map(mapClientToTableRow)
  }, [])

  return useAsyncSnapshot<ClientTableRow[]>({
    cacheKey: CLIENTS_CACHE_KEY,
    errorMessage: clientsCopy.errors.clientsLoad,
    initialData: [],
    loadData,
  })
}
