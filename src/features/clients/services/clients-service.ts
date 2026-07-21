import {
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclesPayload,
  type Client,
  type ClientsSnapshot,
  type ClientVehicle,
} from "../model"
import { getClientsGateway } from "./clients-gateway"

export async function listClients(): Promise<Client[]> {
  const payload = await getClientsGateway().listClientsPayload()
  return sanitizeErpClientsPayload(payload)
}

export async function listClientVehicles(): Promise<ClientVehicle[]> {
  const payload = await getClientsGateway().listClientVehiclesPayload()
  return sanitizeErpClientVehiclesPayload(payload)
}

export async function listClientVehiclesByClientId(clientId: number): Promise<ClientVehicle[]> {
  const payload = await getClientsGateway().listClientVehiclesPayloadByClientId(clientId)
  return sanitizeErpClientVehiclesPayload(payload)
}

export async function listClientsSnapshot(): Promise<ClientsSnapshot> {
  const [clients, vehicles] = await Promise.all([
    listClients(),
    listClientVehicles(),
  ])

  return { clients, vehicles }
}
