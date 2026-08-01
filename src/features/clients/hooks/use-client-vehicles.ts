import * as React from "react"

import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { clientsCopy } from "../constants/clients-copy"
import { CLIENT_VEHICLES_CACHE_KEY_PREFIX } from "../constants/clients-persistence"
import { type ClientVehiclesSnapshot } from "../model/clients-types"
import {
  findClientById,
  listClientVehiclesByClientId,
} from "../services/clients-service"

const emptySnapshot: ClientVehiclesSnapshot = {
  client: null,
  vehicles: [],
}

export function useClientVehicles(clientId: number) {
  const loadData = React.useCallback(async () => {
    const [client, vehicles] = await Promise.all([
      findClientById(clientId),
      listClientVehiclesByClientId(clientId),
    ])

    return { client, vehicles }
  }, [clientId])
  const snapshot = useAsyncSnapshot<ClientVehiclesSnapshot>({
    cacheKey: `${CLIENT_VEHICLES_CACHE_KEY_PREFIX}:${clientId}`,
    errorMessage: clientsCopy.errors.vehiclesLoad,
    initialData: emptySnapshot,
    loadData,
  })

  return {
    ...snapshot,
    client: snapshot.data.client,
    data: snapshot.data.vehicles,
  }
}
