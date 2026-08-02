import {
  type ErpClientCatalogRow,
  type ErpClientRow,
  type ErpClientVehicleCatalogRow,
  type ErpClientVehicleRow,
} from "../schemas/clients-gateway-schemas"

export interface ClientsGateway {
  findClientById: (clientId: number) => Promise<ErpClientRow | null>
  listClients: () => Promise<readonly ErpClientRow[]>
  searchClients: (
    query: string,
    limit: number
  ) => Promise<readonly ErpClientCatalogRow[]>
  searchVehicles: (
    query: string,
    limit: number
  ) => Promise<readonly ErpClientVehicleCatalogRow[]>
  listVehiclesByClientId: (
    clientId: number
  ) => Promise<readonly ErpClientVehicleRow[]>
}
