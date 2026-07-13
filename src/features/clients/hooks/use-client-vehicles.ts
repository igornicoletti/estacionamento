import * as React from "react"
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"
import { listClientsSnapshot } from "../services/clients-service"
import { type Client, type ClientVehicle } from "../types/clients-types"
import { clientsCopy } from "../clients-copy"

export function useClientVehicles(clientId: number) {
  const snapshot = useAsyncSnapshot<{ clients: Client[]; vehicles: ClientVehicle[] }>({
    cacheKey: `clients:vehicles:${clientId}:v2`,
    errorMessage: clientsCopy.errors.vehiclesLoad,
    initialData: { clients: [], vehicles: [] },
    loadData: listClientsSnapshot,
  })

  const client = React.useMemo(() => {
    return snapshot.data.clients.find((item) => item.cod_pessoa === clientId) ?? null
  }, [clientId, snapshot.data.clients])

  const data = React.useMemo(() => {
    return snapshot.data.vehicles.filter((vehicle) => vehicle.cod_pessoa === clientId)
  }, [clientId, snapshot.data.vehicles])

  return { ...snapshot, client, data }
}
