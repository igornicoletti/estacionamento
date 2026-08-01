import {
  type ErpClientRow,
  type ErpClientVehicleRow,
} from "../schemas/clients-gateway-schemas"

export interface ClientsGateway {
  findClientById: (clientId: number) => Promise<ErpClientRow | null>
  listClients: () => Promise<readonly ErpClientRow[]>
  listVehiclesByClientId: (
    clientId: number
  ) => Promise<readonly ErpClientVehicleRow[]>
}
