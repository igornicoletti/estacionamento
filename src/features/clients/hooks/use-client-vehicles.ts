import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { CLIENT_VEHICLES_CACHE_KEY_PREFIX, clientsCopy } from "../constants"
import { type ClientsSnapshot } from "../model"
import { listClientsSnapshot } from "../services"

const initialSnapshot: ClientsSnapshot = {
  clients: [],
  vehicles: [],
}

export function useClientVehicles(clientId: number | null) {
  const snapshot = useAsyncSnapshot<ClientsSnapshot>({
    cacheKey: `${CLIENT_VEHICLES_CACHE_KEY_PREFIX}:${clientId ?? "invalid"}:v2`,
    errorMessage: clientsCopy.errors.vehiclesLoad,
    initialData: initialSnapshot,
    loadData: listClientsSnapshot,
  })

  const client = React.useMemo(() => {
    if (!clientId) {
      return null
    }

    return snapshot.data.clients.find((item) => item.cod_pessoa === clientId) ?? null
  }, [clientId, snapshot.data.clients])

  const data = React.useMemo(() => {
    if (!clientId) {
      return []
    }

    return snapshot.data.vehicles.filter((vehicle) => vehicle.cod_pessoa === clientId)
  }, [clientId, snapshot.data.vehicles])

  return { ...snapshot, client, data }
}
