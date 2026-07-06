import { type UnitYardConfig } from "../types/units-types"

const STORAGE_KEY = "rmc.units.yard-config.v1"

export interface UnitYardGateway {
  list(): Promise<UnitYardConfig[]>
  saveAll(configs: readonly UnitYardConfig[]): Promise<void>
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function createLocalStorageUnitYardGateway(): UnitYardGateway {
  return {
    async list() {
      await Promise.resolve()

      if (!canUseStorage()) {
        return []
      }

      const raw = window.localStorage.getItem(STORAGE_KEY)

      if (!raw) {
        return []
      }

      try {
        const parsed: unknown = JSON.parse(raw)
        return Array.isArray(parsed) ? (parsed as UnitYardConfig[]) : []
      } catch {
        return []
      }
    },
    async saveAll(configs) {
      await Promise.resolve()

      if (!canUseStorage()) {
        return
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
    },
  }
}

let unitYardGateway: UnitYardGateway = createLocalStorageUnitYardGateway()

export function getUnitYardGateway() {
  return unitYardGateway
}

export function configureUnitYardGateway(gateway: UnitYardGateway) {
  unitYardGateway = gateway
}

export function resetUnitYardGateway() {
  unitYardGateway = createLocalStorageUnitYardGateway()
}
