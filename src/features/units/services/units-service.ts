import { sanitizeErpUnitsPayload, type Unit } from "../model"
import { getUnitsGateway } from "./units-gateway"

export async function listUnits(): Promise<Unit[]> {
  const payload = await getUnitsGateway().listUnitsPayload()
  return sanitizeErpUnitsPayload(payload)
}
