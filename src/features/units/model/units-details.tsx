import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import {
  appUserStatusLabels,
  resolveLastAccessLabel,
  resolvePasskeyLabel,
  type UserRecord,
  userRoleLabels,
} from "@/features/users"

import { unitsCopy } from "../constants/units-copy"
import { createUnitMapHref, formatUnitCityState, formatUnitSystemLabel, resolveYardStatusLabel } from "./units-formatting"
import { type Unit, type UnitUserStats, type UnitYardConfig } from "./units-types"

export function getUnitDetailItems(unit: Unit, yardConfig: UnitYardConfig, userStats: UnitUserStats): readonly AppDetailsSheetItem[] {
  const mapHref = createUnitMapHref(unit.des_coordenada_empresa)
  return [
    { label: unitsCopy.table.companyCode, value: unit.cod_empresa },
    { label: unitsCopy.table.legalName, value: unit.nom_razao_social },
    { label: unitsCopy.table.tradeName, value: unit.nom_fantasia },
    { label: unitsCopy.table.cnpj, value: unit.num_cnpj },
    { label: unitsCopy.table.brand, value: unit.des_bandeira },
    { label: unitsCopy.table.cityState, value: formatUnitCityState(unit) },
    {
      label: unitsCopy.table.coordinates,
      value: mapHref ? (
        <a href={mapHref} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
          {unit.des_coordenada_empresa}
        </a>
      ) : unitsCopy.details.noMap,
    },
    { label: unitsCopy.table.networkIp, value: unit.ip_rede || unitsCopy.details.emptyValue },
    { label: unitsCopy.table.erpSystem, value: formatUnitSystemLabel(unit.nom_banco_dados) },
    { label: unitsCopy.table.yard, value: resolveYardStatusLabel(yardConfig.patioActive) },
    { label: unitsCopy.table.spots, value: yardConfig.parkingSpots },
    { label: unitsCopy.table.managers, value: userStats.managers },
    { label: unitsCopy.table.operators, value: userStats.operators },
  ]
}

export function getUnitUserDetailItems(user: UserRecord): readonly AppDetailsSheetItem[] {
  return [
    { label: unitsCopy.table.name, value: user.name },
    { label: unitsCopy.table.cpf, value: user.cpf || unitsCopy.details.emptyValue },
    { label: unitsCopy.table.email, value: user.email || unitsCopy.table.noEmail },
    { label: unitsCopy.table.phone, value: user.phoneMasked || unitsCopy.details.emptyValue },
    { label: unitsCopy.table.profile, value: userRoleLabels[user.role] },
    { label: unitsCopy.table.status, value: appUserStatusLabels[user.status] },
    { label: unitsCopy.table.passkey, value: resolvePasskeyLabel(user.passkeyStatus) },
    { label: unitsCopy.table.lastAccess, value: resolveLastAccessLabel(user.lastAccessAt) },
  ]
}
