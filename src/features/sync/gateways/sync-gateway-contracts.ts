import {
  type SyncPhaseCommand,
  type SyncPhaseResult,
  type SyncResource,
} from "../model/sync-types"
import {
  type ClientSyncRunWire,
  type SyncStateWire,
  type UnitSyncRunWire,
} from "../schemas/sync-gateway-schemas"

export interface SyncHistoryWireSnapshot {
  clientRuns?: ClientSyncRunWire[]
  unitRuns?: UnitSyncRunWire[]
  state: SyncStateWire
}

export interface SyncGateway {
  listHistory(resource: SyncResource): Promise<SyncHistoryWireSnapshot>
  runPhase(command: SyncPhaseCommand): Promise<SyncPhaseResult>
}
