import {
  sanitizeErpClientsPayload,
  sanitizeErpClientVehiclesPayload,
} from "../model"
import { type Client, type ClientVehicle } from "../model"
import { getClientsGateway } from "./clients-gateway"

export async function listClients(): Promise<Client[]> {
  const payload = await getClientsGateway().listClientsPayload()

  return sanitizeErpClientsPayload(payload)
}

export async function listClientVehicles(): Promise<ClientVehicle[]> {
  const payload = await getClientsGateway().listClientVehiclesPayload()

  return sanitizeErpClientVehiclesPayload(payload)
}

export async function listClientById(
  codPessoa: number
): Promise<Client | null> {
  const payload = await getClientsGateway().listClientPayloadById(codPessoa)

  return payload ? sanitizeErpClientsPayload([payload])[0] ?? null : null
}

export async function listClientVehiclesByClientId(
  codPessoa: number
): Promise<ClientVehicle[]> {
  const payload = await getClientsGateway().listClientVehiclesPayloadByClientId(
    codPessoa
  )

  return sanitizeErpClientVehiclesPayload(payload)
}

export async function listClientsSnapshot() {
  const [clients, vehicles] = await Promise.all([
    listClients(),
    listClientVehicles(),
  ])

  return { clients, vehicles }
}
