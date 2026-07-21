import { Building2Icon } from "lucide-react"
import * as React from "react"

import { AUTH_ROLE_KEY, useAuth } from "@/features/auth"
import { useUnitYardConfigs, useUnits, type Unit } from "@/features/units"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { InputGroupAddon } from "@/components/ui/input-group"
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

const SelectedUnitContext =
  React.createContext<SelectedUnitContextValue | null>(null)

type UnitSelectorOption = {
  label: string
  unit: Unit
  value: string
}

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

  return (
    units.find((unit) => String(unit.cod_empresa) === unitId)?.nom_fantasia ??
    "Unidade indisponível"
  )
}

export function formatUnitSelectorOption(
  unit: Pick<Unit, "cod_empresa" | "nom_fantasia">,
) {
  return `${unit.cod_empresa} — ${unit.nom_fantasia}`
}

function createUnitSelectorOptions(
  units: readonly Unit[],
): UnitSelectorOption[] {
  return units.map((unit) => ({
    label: formatUnitSelectorOption(unit),
    unit,
    value: String(unit.cod_empresa),
  }))
}

function canSelectByRole(roleKey: string | null | undefined) {
  return (
    roleKey === AUTH_ROLE_KEY.owner ||
    roleKey === AUTH_ROLE_KEY.admin ||
    roleKey === AUTH_ROLE_KEY.auditor
  )
}

function filterUnitsWithActiveYard(
  units: readonly Unit[],
  yardConfigs: readonly { patioActive: boolean; unitId: string }[],
) {
  const activeYardUnitIds = new Set(
    yardConfigs
      .filter((config) => config.patioActive)
      .map((config) => config.unitId),
  )

  return units.filter((unit) => activeYardUnitIds.has(String(unit.cod_empresa)))
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

  if (
    storedUnitId &&
    units.some((unit) => String(unit.cod_empresa) === storedUnitId)
  ) {
    return storedUnitId
  }

  return units.length > 0 ? String(units[0].cod_empresa) : null
}

export function SelectedUnitProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useAuth()
  const { data: units, isLoading: isLoadingUnits } = useUnits()
  const { data: yardConfigs, isLoading: isLoadingYardConfigs } =
    useUnitYardConfigs()
  const profileUnitId = auth.profile?.unitId ?? null
  const canSelectUnit = canSelectByRole(auth.profile?.roleKey)
  const isLoading = isLoadingUnits || isLoadingYardConfigs
  const selectableUnits = React.useMemo(
    () => filterUnitsWithActiveYard(units, yardConfigs),
    [units, yardConfigs],
  )
  const [selectedUnitIdState, setSelectedUnitIdState] = React.useState<
    string | null
  >(() =>
    resolveInitialUnitId({
      units: [],
      canSelectUnit,
      profileUnitId,
    }),
  )

  const resolvedSelectedUnitId = React.useMemo(() => {
    if (isLoading) {
      return selectedUnitIdState
    }

    const availableUnitIds = new Set(
      selectableUnits.map((unit) => String(unit.cod_empresa)),
    )

    if (!canSelectUnit) {
      return profileUnitId
    }

    if (selectedUnitIdState && availableUnitIds.has(selectedUnitIdState)) {
      return selectedUnitIdState
    }

    return resolveInitialUnitId({
      units: selectableUnits,
      canSelectUnit,
      profileUnitId,
    })
  }, [
    canSelectUnit,
    isLoading,
    profileUnitId,
    selectableUnits,
    selectedUnitIdState,
  ])

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

    if (!isLoading && selectableUnits.length === 0) {
      return "Nenhuma unidade com pátio ativo"
    }

    return resolveUnitNameById(selectableUnits, resolvedSelectedUnitId)
  }, [
    canSelectUnit,
    isLoading,
    profileUnitId,
    resolvedSelectedUnitId,
    selectableUnits,
    units,
  ])

  const value = React.useMemo<SelectedUnitContextValue>(
    () => ({
      isLoading,
      selectedUnitId: canSelectUnit ? resolvedSelectedUnitId : profileUnitId,
      selectedUnitName,
      visibleUnits: canSelectUnit ? selectableUnits : units,
      canSelectUnit,
      setSelectedUnitId,
    }),
    [
      canSelectUnit,
      isLoading,
      profileUnitId,
      resolvedSelectedUnitId,
      selectableUnits,
      selectedUnitName,
      setSelectedUnitId,
      units,
    ],
  )

  return (
    <SelectedUnitContext.Provider value={value}>
      {children}
    </SelectedUnitContext.Provider>
  )
}

export function useSelectedUnit() {
  const context = React.useContext(SelectedUnitContext)

  if (!context) {
    throw new Error(
      "useSelectedUnit deve ser utilizado dentro de SelectedUnitProvider.",
    )
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
  const options = React.useMemo(
    () => createUnitSelectorOptions(visibleUnits),
    [visibleUnits],
  )
  const selectedUnit = React.useMemo(
    () => options.find((unit) => unit.value === selectedUnitId) ?? null,
    [options, selectedUnitId],
  )

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
    <div className="w-full min-w-0 lg:w-[320px]">
      <Combobox<UnitSelectorOption>
        items={options}
        value={selectedUnit}
        onValueChange={(value: UnitSelectorOption | null) => {
          if (value) {
            setSelectedUnitId(value.value)
          }
        }}
        isItemEqualToValue={(a, b) => a.value === b.value}
        itemToStringLabel={(unit: UnitSelectorOption) => unit.label}
        itemToStringValue={(unit: UnitSelectorOption) => unit.label}
      >
        <ComboboxInput
          aria-label="Selecionar unidade"
          className="h-9 w-full"
          placeholder="Selecione uma unidade"
        >
          <InputGroupAddon>
            <Building2Icon aria-hidden="true" />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent
          align="end"
          className="w-(--anchor-width) min-w-(--anchor-width)"
        >
          <ComboboxEmpty>Nenhum pátio ativo encontrado.</ComboboxEmpty>
          <ComboboxList>
            {(unit: UnitSelectorOption) => (
              <ComboboxItem key={unit.value} value={unit} className="min-w-0">
                <span className="min-w-0 truncate whitespace-nowrap">
                  <span>{unit.unit.cod_empresa}</span>
                  <span className="font-medium">
                    {" — "}
                    {unit.unit.nom_fantasia}
                  </span>
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}
