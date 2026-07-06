import { type Unit } from "../types/units-types"
import { sanitizeErpUnitsPayload } from "../utils/units-normalizers"
import { getUnitsGateway } from "./units-gateway"

export async function listUnits(): Promise<Unit[]> {
  const payload = await getUnitsGateway().listUnitsPayload()
  return sanitizeErpUnitsPayload(payload)
}
