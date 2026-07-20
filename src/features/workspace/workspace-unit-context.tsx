import * as React from "react"

import { AUTH_ROLE_KEY, useAuth } from "@/features/auth"
import { useUnits, type Unit } from "@/features/units"

type WorkspaceUnitContextValue = {
  isLoading: boolean
  selectedUnitId: string | null
  selectedUnitName: string
  visibleUnits: readonly Unit[]
  canSelectUnit: boolean
  setSelectedUnitId: (unitId: string) => void
}

const WORKSPACE_UNIT_STORAGE_KEY = "rmc.workspace.selected-unit-id"

const WorkspaceUnitContext = React.createContext<WorkspaceUnitContextValue | null>(null)

function getStoredUnitId() {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(WORKSPACE_UNIT_STORAGE_KEY)
  return value && value.trim() ? value : null
}

function setStoredUnitId(unitId: string | null) {
  if (typeof window === "undefined") {
    return
  }

  if (!unitId) {
    window.localStorage.removeItem(WORKSPACE_UNIT_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(WORKSPACE_UNIT_STORAGE_KEY, unitId)
}

function resolveUnitNameById(units: readonly Unit[], unitId: string | null) {
  if (!unitId) {
    return "Todas as unidades"
  }

  return units.find((unit) => String(unit.cod_empresa) === unitId)?.nom_fantasia ?? "Unidade indisponível"
}

function canSelectByRole(roleKey: string | null | undefined) {
  return roleKey === AUTH_ROLE_KEY.owner || roleKey === AUTH_ROLE_KEY.admin || roleKey === AUTH_ROLE_KEY.auditor
}

function resolveInitialUnitId(input: {
  units: readonly Unit[]
  canSelectUnit: boolean
  profileUnitId: string | null
}) {
  const { canSelectUnit, profileUnitId, units } = input

  if (!canSelectUnit) {
    return profileUnitId
  }

  const storedUnitId = getStoredUnitId()

  if (storedUnitId && units.some((unit) => String(unit.cod_empresa) === storedUnitId)) {
    return storedUnitId
  }

  return units.length > 0 ? String(units[0].cod_empresa) : null
}

export function WorkspaceUnitProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const { data: units, isLoading } = useUnits()
  const profileUnitId = auth.profile?.unitId ?? null
  const canSelectUnit = canSelectByRole(auth.profile?.roleKey)
  const [selectedUnitIdState, setSelectedUnitIdState] = React.useState<string | null>(() =>
    resolveInitialUnitId({
      units: [],
      canSelectUnit,
      profileUnitId,
    })
  )

  const resolvedSelectedUnitId = React.useMemo(() => {
    if (isLoading) {
      return selectedUnitIdState
    }

    const availableUnitIds = new Set(units.map((unit) => String(unit.cod_empresa)))

    if (!canSelectUnit) {
      return profileUnitId
    }

    if (selectedUnitIdState && availableUnitIds.has(selectedUnitIdState)) {
      return selectedUnitIdState
    }

    return resolveInitialUnitId({
      units,
      canSelectUnit,
      profileUnitId,
    })
  }, [canSelectUnit, isLoading, profileUnitId, selectedUnitIdState, units])

  React.useEffect(() => {
    if (!canSelectUnit) {
      return
    }

    setStoredUnitId(resolvedSelectedUnitId)
  }, [canSelectUnit, resolvedSelectedUnitId])

  const setSelectedUnitId = React.useCallback((unitId: string) => {
    setSelectedUnitIdState(unitId)
    setStoredUnitId(unitId)
  }, [])

  const selectedUnitName = React.useMemo(() => {
    if (!canSelectUnit && profileUnitId) {
      return resolveUnitNameById(units, profileUnitId)
    }

    return resolveUnitNameById(units, resolvedSelectedUnitId)
  }, [canSelectUnit, profileUnitId, resolvedSelectedUnitId, units])

  const value = React.useMemo<WorkspaceUnitContextValue>(() => ({
    isLoading,
    selectedUnitId: canSelectUnit ? resolvedSelectedUnitId : profileUnitId,
    selectedUnitName,
    visibleUnits: units,
    canSelectUnit,
    setSelectedUnitId,
  }), [canSelectUnit, isLoading, profileUnitId, resolvedSelectedUnitId, selectedUnitName, setSelectedUnitId, units])

  return <WorkspaceUnitContext.Provider value={value}>{children}</WorkspaceUnitContext.Provider>
}

export function useWorkspaceUnit() {
  const context = React.useContext(WorkspaceUnitContext)

  if (!context) {
    throw new Error("useWorkspaceUnit deve ser utilizado dentro de WorkspaceUnitProvider.")
  }

  return context
}
