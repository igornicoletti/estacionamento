import { getClientsGateway } from "../gateways/clients-gateway"
import {
  mapErpClient,
  mapErpClientVehicle,
} from "../model/clients-normalizers"
import {
  type Client,
  type ClientVehicle,
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

export async function listClientVehiclesByClientId(
  clientId: number
): Promise<ClientVehicle[]> {
  return (await getClientsGateway().listVehiclesByClientId(clientId)).map(
    mapErpClientVehicle
  )
}
