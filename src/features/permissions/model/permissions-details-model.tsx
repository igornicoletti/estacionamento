import { type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"

import {
  permissionsCopy,
  permissionActionLabels,
  permissionObjectLabels,
  permissionGroupLabels as permissionScopeLabels,
  permissionSourceLabels,
} from "../constants"
import { formatPermissionRolesWithoutAccess } from "./permissions-rules"
import { type PermissionMatrixRow } from "./permissions-types"

function toSentenceCase(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    return permissionsCopy.labels.emptyValue
  }

  return `${normalized.charAt(0).toLocaleUpperCase("pt-BR")}${normalized.slice(1)}`
}

export function formatTechnicalPermissionKey(value: string) {
  const [scopeToken, ...actionTokens] = value
    .split(".")
    .flatMap((part) => part.split("_"))
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

  const scope = scopeToken ? permissionScopeLabels[scopeToken] : null
  const action = actionTokens[0] ? permissionActionLabels[actionTokens[0]] : null
  const object = actionTokens
    .slice(1)
    .map((token) => permissionObjectLabels[token] ?? token)
    .join(" ")

  if (scope && action) {
    return object ? `${scope} - ${action} ${object}` : `${scope} - ${action}`
  }

  if (scope) {
    return scope
  }

  return toSentenceCase(value.replace(/[._-]+/g, " "))
}

function PermissionKeyValue({ value }: { value: string }) {
  return <span className="break-words text-sm">{formatTechnicalPermissionKey(value)}</span>
}

export function getPermissionDetailItems(
  permission: PermissionMatrixRow
): readonly AppDetailsSheetItem[] {
  return [
    { label: permissionsCopy.labels.permission, value: permission.label },
    {
      label: permissionsCopy.labels.description,
      value: permission.description || permissionsCopy.labels.emptyValue,
    },
    {
      label: permissionsCopy.labels.key,
      value: <PermissionKeyValue value={permission.key} />,
    },
    { label: permissionsCopy.labels.group, value: permission.groupLabel },
    {
      label: permissionsCopy.labels.source,
      value: permissionSourceLabels[permission.source],
    },
    {
      label: permissionsCopy.labels.critical,
      value: permission.isCritical ? permissionsCopy.labels.yes : permissionsCopy.labels.no,
    },
    { label: permissionsCopy.labels.rolesWithAccess, value: permission.roleLabels },
    {
      label: permissionsCopy.labels.rolesWithoutAccess,
      value: formatPermissionRolesWithoutAccess(permission.roles),
    },
  ]
}
