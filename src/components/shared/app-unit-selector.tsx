import * as React from "react"

import { AUTH_ROLE_KEY, useAuth } from "@/features/auth"
import { useUnits, type Unit } from "@/features/units"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

type SelectedUnitContextValue = {
  isLoading: boolean
  selectedUnitId: string | null
  selectedUnitName: string
  visibleUnits: readonly Unit[]
  canSelectUnit: boolean
  setSelectedUnitId: (unitId: string) => void
}

const SELECTED_UNIT_STORAGE_KEY = "rmc.selected-unit-id"

const SelectedUnitContext = React.createContext<SelectedUnitContextValue | null>(null)

function getStoredUnitId() {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(SELECTED_UNIT_STORAGE_KEY)
  return value && value.trim() ? value : null
}

function setStoredUnitId(unitId: string | null) {
  if (typeof window === "undefined") {
    return
  }

  if (!unitId) {
    window.localStorage.removeItem(SELECTED_UNIT_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(SELECTED_UNIT_STORAGE_KEY, unitId)
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

export function SelectedUnitProvider({ children }: { children: React.ReactNode }) {
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

  const value = React.useMemo<SelectedUnitContextValue>(() => ({
    isLoading,
    selectedUnitId: canSelectUnit ? resolvedSelectedUnitId : profileUnitId,
    selectedUnitName,
    visibleUnits: units,
    canSelectUnit,
    setSelectedUnitId,
  }), [canSelectUnit, isLoading, profileUnitId, resolvedSelectedUnitId, selectedUnitName, setSelectedUnitId, units])

  return <SelectedUnitContext.Provider value={value}>{children}</SelectedUnitContext.Provider>
}

export function useSelectedUnit() {
  const context = React.useContext(SelectedUnitContext)

  if (!context) {
    throw new Error("useSelectedUnit deve ser utilizado dentro de SelectedUnitProvider.")
  }

  return context
}

export function AppUnitSelector() {
  const {
    canSelectUnit,
    isLoading,
    selectedUnitId,
    setSelectedUnitId,
    visibleUnits,
  } = useSelectedUnit()

  if (!canSelectUnit) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-9 items-center justify-start text-muted-foreground">
        <Spinner className="size-4" />
      </div>
    )
  }

  return (
    <div className="w-full lg:w-[320px]">
      <Select
        value={selectedUnitId ?? undefined}
        onValueChange={setSelectedUnitId}
      >
        <SelectTrigger className="w-full" aria-label="Selecionar unidade">
          <SelectValue placeholder="Selecione uma unidade" />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {visibleUnits.map((unit) => (
            <SelectItem key={unit.cod_empresa} value={String(unit.cod_empresa)}>
              {unit.nom_fantasia}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
