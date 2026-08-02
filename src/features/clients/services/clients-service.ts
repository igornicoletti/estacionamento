import { getClientsGateway } from "../gateways/clients-gateway"
import { CLIENT_CATALOG_SEARCH_LIMIT } from "../constants/clients-persistence"
import {
  mapErpClientCatalogItem,
  mapErpClient,
  mapErpClientVehicleCatalogItem,
  mapErpClientVehicle,
} from "../model/clients-normalizers"
import {
  type Client,
  type ClientCatalogItem,
  type ClientVehicle,
  type ClientVehicleCatalogItem,
} from "../model/clients-types"

export async function listClients(): Promise<Client[]> {
  return (await getClientsGateway().listClients()).map(mapErpClient)
}

export async function findClientById(
  clientId: number
): Promise<Client | null> {
  const row = await getClientsGateway().findClientById(clientId)
  return row ? mapErpClient(row) : null
}

export async function searchClients(query: string): Promise<ClientCatalogItem[]> {
  if (query.trim().length < 2) {
    return []
  }

  return (
    await getClientsGateway().searchClients(
      query,
      CLIENT_CATALOG_SEARCH_LIMIT,
    )
  ).map(mapErpClientCatalogItem)
}

export async function searchClientVehicles(
  query: string
): Promise<ClientVehicleCatalogItem[]> {
  if (query.trim().length < 2) {
    return []
  }

  return (
    await getClientsGateway().searchVehicles(
      query,
      CLIENT_CATALOG_SEARCH_LIMIT,
    )
  ).map(mapErpClientVehicleCatalogItem)
}

export async function listClientVehiclesByClientId(
  clientId: number
): Promise<ClientVehicle[]> {
  return (await getClientsGateway().listVehiclesByClientId(clientId)).map(
    mapErpClientVehicle
  )
}
