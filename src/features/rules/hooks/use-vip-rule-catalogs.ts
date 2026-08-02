import * as React from "react"

import {
  searchClients,
  searchClientVehicles,
} from "@/features/clients"
import { formatUnitOptionLabel, listUnits } from "@/features/units"

const CATALOG_SEARCH_DEBOUNCE_MS = 250
const CATALOG_SEARCH_MIN_LENGTH = 2

export interface ClientOption {
  clientId: number
  document: string | null
  label: string
  name: string
  value: string
}

export interface VehicleOption {
  clientId: number
  clientName: string
  label: string
  plate: string
  value: string
}

export interface UnitOption {
  label: string
  value: string
}

interface CatalogSearchState<Option> {
  isLoading: boolean
  isUnavailable: boolean
  options: readonly Option[]
}

const emptyCatalogState = {
  isLoading: false,
  isUnavailable: false,
  options: [],
} as const

function useClientCatalogSearch(enabled: boolean, query: string) {
  const [state, setState] = React.useState<
    CatalogSearchState<ClientOption>
  >({ isLoading: false, isUnavailable: false, options: [] })

  const normalizedQuery = query.trim()
  const canSearch =
    enabled && normalizedQuery.length >= CATALOG_SEARCH_MIN_LENGTH

  React.useEffect(() => {
    if (!canSearch) {
      return
    }

    let isCurrent = true
    const timeoutId = globalThis.setTimeout(() => {
      setState({
        isLoading: true,
        isUnavailable: false,
        options: [],
      })

      void searchClients(normalizedQuery)
        .then((clients) => {
          if (!isCurrent) {
            return
          }

          setState({
            isLoading: false,
            isUnavailable: false,
            options: clients.map((client) => {
              const name = client.nom_fantasia || client.nom_pessoa

              return {
                clientId: client.cod_pessoa,
                document: client.num_cnpj_cpf,
                label: `${client.cod_pessoa} — ${name}`,
                name,
                value: String(client.cod_pessoa),
              }
            }),
          })
        })
        .catch(() => {
          if (isCurrent) {
            setState({
              isLoading: false,
              isUnavailable: true,
              options: [],
            })
          }
        })
    }, CATALOG_SEARCH_DEBOUNCE_MS)

    return () => {
      isCurrent = false
      globalThis.clearTimeout(timeoutId)
    }
  }, [canSearch, normalizedQuery])

  return canSearch ? state : emptyCatalogState
}

function useVehicleCatalogSearch(enabled: boolean, query: string) {
  const [state, setState] = React.useState<
    CatalogSearchState<VehicleOption>
  >({ isLoading: false, isUnavailable: false, options: [] })

  const normalizedQuery = query.trim()
  const canSearch =
    enabled && normalizedQuery.length >= CATALOG_SEARCH_MIN_LENGTH

  React.useEffect(() => {
    if (!canSearch) {
      return
    }

    let isCurrent = true
    const timeoutId = globalThis.setTimeout(() => {
      setState({
        isLoading: true,
        isUnavailable: false,
        options: [],
      })

      void searchClientVehicles(normalizedQuery)
        .then((vehicles) => {
          if (!isCurrent) {
            return
          }

          setState({
            isLoading: false,
            isUnavailable: false,
            options: vehicles.map((vehicle) => ({
              clientId: vehicle.cod_pessoa,
              clientName: vehicle.nom_fantasia || vehicle.nom_pessoa,
              label: `${vehicle.num_placa} — ${vehicle.des_veiculo}`,
              plate: vehicle.num_placa,
              value: String(vehicle.cod_veiculo),
            })),
          })
        })
        .catch(() => {
          if (isCurrent) {
            setState({
              isLoading: false,
              isUnavailable: true,
              options: [],
            })
          }
        })
    }, CATALOG_SEARCH_DEBOUNCE_MS)

    return () => {
      isCurrent = false
      globalThis.clearTimeout(timeoutId)
    }
  }, [canSearch, normalizedQuery])

  return canSearch ? state : emptyCatalogState
}

function useUnitCatalog(open: boolean) {
  const [state, setState] = React.useState<
    CatalogSearchState<UnitOption>
  >({ isLoading: true, isUnavailable: false, options: [] })

  React.useEffect(() => {
    if (!open) {
      return
    }

    let isCurrent = true
    const timeoutId = globalThis.setTimeout(() => {
      setState({ isLoading: true, isUnavailable: false, options: [] })

      void listUnits()
        .then((units) => {
          if (!isCurrent) {
            return
          }

          setState({
            isLoading: false,
            isUnavailable: false,
            options: units.map((unit) => ({
              label: formatUnitOptionLabel(
                unit.cod_empresa,
                unit.nom_fantasia || unit.nom_razao_social,
              ),
              value: String(unit.cod_empresa),
            })),
          })
        })
        .catch(() => {
          if (isCurrent) {
            setState({
              isLoading: false,
              isUnavailable: true,
              options: [],
            })
          }
        })
    }, 0)

    return () => {
      isCurrent = false
      globalThis.clearTimeout(timeoutId)
    }
  }, [open])

  return open ? state : emptyCatalogState
}

export function useVipRuleCatalogs(input: {
  clientQuery: string
  open: boolean
  targetType: string
  vehicleQuery: string
}) {
  return {
    clients: useClientCatalogSearch(
      input.open && input.targetType === "client",
      input.clientQuery,
    ),
    units: useUnitCatalog(input.open),
    vehicles: useVehicleCatalogSearch(
      input.open && input.targetType === "vehicle",
      input.vehicleQuery,
    ),
  }
}
