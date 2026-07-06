import {
  type Client,
  type ClientVehicle,
} from "../types/clients-types"
import {
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclesPayload,
} from "../utils/clients-normalizers"
import { getClientsGateway } from "./clients-gateway"

export async function listClients(): Promise<Client[]> {
  const payload = await getClientsGateway().listClientsPayload()
  return sanitizeErpClientsPayload(payload)
}

export async function listClientVehicles(): Promise<ClientVehicle[]> {
  const payload = await getClientsGateway().listClientVehiclesPayload()
  return sanitizeErpClientVehiclesPayload(payload)
}

export interface ClientsSnapshot {
  clients: Client[]
  vehicles: ClientVehicle[]
}

export async function listClientsSnapshot(): Promise<ClientsSnapshot> {
  const [clients, vehicles] = await Promise.all([
    listClients(),
    listClientVehicles(),
  ])

  return {
    clients,
    vehicles,
  }
}
