import { DatabaseIcon, HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import { createDataTableFilterOptions, DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppDialog } from "@/components/shared/app-dialog"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { ManualSyncDialog } from "@/components/sync"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AUTH_PERMISSION, AUTH_ROLE_KEY, useAuth } from "@/features/auth"
import { useUsers } from "@/features/users"
import { preventDialogCloseOnFloatingLayerInteraction } from "@/lib/dialog-interactions"
import { withTimeout } from "@/lib/promise"

import { createUnitsColumns } from "../columns/units-columns"
import { UnitsSyncHistoryDialog } from "../components/units-sync-history-dialog"
import { useUnitSyncHistory } from "../hooks/use-unit-sync-history"
import { useUnitYardConfigs } from "../hooks/use-unit-yard-configs"
import { useUnits } from "../hooks/use-units"
import { isUnitSyncInProgressError, triggerUnitsSync } from "../services/unit-sync-service"
import { type Unit } from "../types/units-types"
import { unitsCopy } from "../units-copy"
import {
  buildActiveUnitUserStats,
  buildUnitYardConfigMap,
  parseYardSpotsInput,
  resolveUnitYardConfig,
} from "../utils/units-models"
import { getUnitDetailItems } from "../utils/units-details-model"

const unitsTableColumnVisibilityKey = "rmc.units.table-column-visibility.v3"
const unitsSyncTimeoutMs = 90_000

const defaultUnitsColumnVisibility = {
  des_coordenada_empresa: false,
  ip_rede: false,
  nom_razao_social: false,
  sgl_estado: false,
}

function canManageOperationalData(auth: ReturnType<typeof useAuth>) {
  return (
    auth.access.hasPermission(AUTH_PERMISSION.all) ||
    auth.profile?.role?.key === AUTH_ROLE_KEY.owner ||
    auth.profile?.role?.key === AUTH_ROLE_KEY.admin
  )
}

export function UnitsRoute() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { data: units, error, isLoading, refetch } = useUnits()
  const { data: users } = useUsers()
  const {
    data: syncHistory,
    error: syncHistoryError,
    isLoading: isLoadingSyncHistory,
    refetch: refetchSyncHistory,
  } = useUnitSyncHistory()
  const { data: unitYardConfigs, isSaving: isSavingYard, saveConfig } = useUnitYardConfigs()
  const [selectedUnit, setSelectedUnit] = React.useState<Unit | null>(null)
  const [configuringUnit, setConfiguringUnit] = React.useState<Unit | null>(null)
  const [yardStatus, setYardStatus] = React.useState<"active" | "inactive">("inactive")
  const [yardSpots, setYardSpots] = React.useState("0")
  const [yardError, setYardError] = React.useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [syncDialogPhase, setSyncDialogPhase] = React.useState<"confirm" | "running" | null>(null)

  const canSyncUnits = canManageOperationalData(auth)
  const isSyncing = syncDialogPhase === "running"
  const yardConfigByUnitId = React.useMemo(() => buildUnitYardConfigMap(unitYardConfigs), [unitYardConfigs])
  const userStatsByUnitId = React.useMemo(() => buildActiveUnitUserStats(users), [users])

  const selectedUnitYardConfig = selectedUnit
    ? resolveUnitYardConfig(String(selectedUnit.cod_empresa), yardConfigByUnitId)
    : null
  const selectedUnitUserStats = selectedUnit
    ? userStatsByUnitId.get(String(selectedUnit.cod_empresa)) ?? { managers: 0, operators: 0 }
    : { managers: 0, operators: 0 }

  const columns = React.useMemo(
    () => createUnitsColumns({
      onOpenDetails: setSelectedUnit,
      getUserStats: (unit) => userStatsByUnitId.get(String(unit.cod_empresa)) ?? { managers: 0, operators: 0 },
      onSelectUsers: (unit) => {
        void navigate(`/unidades/${unit.cod_empresa}/usuarios`)
      },
      getYardConfig: (unit) => resolveUnitYardConfig(String(unit.cod_empresa), yardConfigByUnitId),
      onConfigureYard: canSyncUnits
        ? (unit) => {
            const currentConfig = resolveUnitYardConfig(String(unit.cod_empresa), yardConfigByUnitId)
            setConfiguringUnit(unit)
            setYardStatus(currentConfig.patioActive ? "active" : "inactive")
            setYardSpots(String(currentConfig.parkingSpots))
            setYardError(null)
          }
        : undefined,
    }),
    [canSyncUnits, navigate, userStatsByUnitId, yardConfigByUnitId]
  )

  const brandOptions = React.useMemo(
    () => createDataTableFilterOptions(units, (unit) => unit.des_bandeira, (unit) => unit.des_bandeira),
    [units]
  )
  const stateOptions = React.useMemo(
    () => createDataTableFilterOptions(units, (unit) => unit.sgl_estado, (unit) => unit.sgl_estado),
    [units]
  )

  async function handleSaveYardSettings() {
    if (!configuringUnit) {
      return
    }

    const parsedSpots = parseYardSpotsInput(yardSpots)

    if (!parsedSpots.isValid) {
      setYardError(parsedSpots.error)
      return
    }

    try {
      await notify.track(
        saveConfig({
          unitId: String(configuringUnit.cod_empresa),
          unitName: configuringUnit.nom_fantasia,
          patioActive: yardStatus === "active",
          parkingSpots: parsedSpots.value,
        }),
        {
          loading: unitsCopy.yard.feedback.loading,
          success: unitsCopy.yard.feedback.success,
          error: unitsCopy.yard.feedback.error,
        }
      )
      setConfiguringUnit(null)
      setYardError(null)
    } catch (caughtError) {
      setYardError(caughtError instanceof Error ? caughtError.message : unitsCopy.yard.feedback.error)
    }
  }

  async function handleConfirmSync() {
    if (isSyncing) {
      return
    }

    setSyncDialogPhase("running")

    try {
      const result = await withTimeout(
        triggerUnitsSync("incremental").then(async (syncResult) => {
          await Promise.all([refetch(), refetchSyncHistory()])
          return syncResult
        }),
        unitsSyncTimeoutMs,
        new Error(unitsCopy.sync.timeoutError)
      )

      if (result.status === "failed") {
        notify.error(unitsCopy.sync.feedback.error)
        return
      }

      if (result.status === "warning") {
        notify.warning(unitsCopy.sync.feedback.inProgress)
        return
      }

      notify.success(unitsCopy.sync.feedback.success)
    } catch (caughtError) {
      if (isUnitSyncInProgressError(caughtError)) {
        notify.warning(unitsCopy.sync.feedback.inProgress)
      } else {
        notify.error(unitsCopy.sync.feedback.error)
      }
    } finally {
      setSyncDialogPhase(null)
    }
  }

  return (
    <PageSection>
      <PageHeader
        title={unitsCopy.pages.units.title}
        subtitle={unitsCopy.pages.units.subtitle}
        actions={(
          <PageHeaderActions>
            <Button type="button" variant="secondary" size="lg" onClick={() => setIsHistoryOpen(true)}>
              <HistoryIcon aria-hidden="true" />
              {unitsCopy.actions.history}
            </Button>
            {canSyncUnits ? (
              <Button type="button" variant="secondary" size="lg" disabled={isLoading || isSyncing} onClick={() => setSyncDialogPhase("confirm")}>
                <RefreshCcwIcon aria-hidden="true" />
                {unitsCopy.actions.sync}
              </Button>
            ) : null}
          </PageHeaderActions>
        )}
      />

      <DataTable
        columns={columns}
        data={units}
        defaultColumnVisibility={defaultUnitsColumnVisibility}
        columnVisibilityStorageKey={unitsTableColumnVisibilityKey}
        getRowId={(unit) => String(unit.cod_empresa)}
        globalSearch={{
          columnIds: ["cod_empresa", "nom_razao_social", "nom_fantasia", "num_cnpj", "des_bandeira", "nom_cidade", "sgl_estado", "ip_rede"],
          placeholder: unitsCopy.pages.units.searchPlaceholder,
        }}
        filterFields={[
          { id: "des_bandeira", title: unitsCopy.filters.brands, options: brandOptions },
          { id: "sgl_estado", title: unitsCopy.filters.states, options: stateOptions },
        ]}
        emptyState={<AppEmptyState media={<DatabaseIcon />} title={unitsCopy.empty.unitsTitle} description={unitsCopy.empty.unitsDescription} />}
        filteredEmptyState={<AppEmptyState media={<DatabaseIcon />} title={unitsCopy.filteredEmpty.unitsTitle} description={unitsCopy.filteredEmpty.unitsDescription} />}
        isLoading={isLoading}
        error={error}
        onRetry={() => { void refetch() }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedUnit)}
        onOpenChange={(open) => { if (!open) setSelectedUnit(null) }}
        title={selectedUnit?.nom_fantasia}
        description={selectedUnit?.nom_razao_social}
        items={selectedUnit && selectedUnitYardConfig ? getUnitDetailItems(selectedUnit, selectedUnitYardConfig, selectedUnitUserStats) : []}
      />

      <AppDialog
        open={Boolean(configuringUnit)}
        onOpenChange={(open) => {
          if (!open) {
            setConfiguringUnit(null)
            setYardError(null)
          }
        }}
        title={unitsCopy.yard.dialogTitle}
        description={configuringUnit?.nom_fantasia || ""}
        contentProps={{ onInteractOutside: preventDialogCloseOnFloatingLayerInteraction }}
        footer={(
          <div className="grid w-full grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="lg" onClick={() => setConfiguringUnit(null)}>
              {unitsCopy.yard.cancelButton}
            </Button>
            <Button type="button" size="lg" disabled={isSavingYard} onClick={() => { void handleSaveYardSettings() }}>
              {unitsCopy.yard.saveButton}
            </Button>
          </div>
        )}
      >
        <FieldGroup>
          <Field>
            <FieldLabel>{unitsCopy.yard.statusLabel}</FieldLabel>
            <Select value={yardStatus} onValueChange={(value) => setYardStatus(value === "active" ? "active" : "inactive")} disabled={isSavingYard}>
              <SelectTrigger className="w-full data-[size=default]:h-9">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="active">{unitsCopy.yard.statusActive}</SelectItem>
                <SelectItem value="inactive">{unitsCopy.yard.statusInactive}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field data-invalid={Boolean(yardError)}>
            <FieldLabel htmlFor="unit-yard-spots">{unitsCopy.yard.spotsLabel}</FieldLabel>
            <Input
              id="unit-yard-spots"
              className="h-9"
              type="number"
              min={0}
              step={1}
              value={yardSpots}
              onChange={(event) => {
                setYardSpots(event.target.value)
                setYardError(null)
              }}
              disabled={isSavingYard}
              aria-invalid={Boolean(yardError)}
            />
            {yardError ? <FieldError>{yardError}</FieldError> : null}
          </Field>
        </FieldGroup>
      </AppDialog>

      <UnitsSyncHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        entries={syncHistory}
        isLoading={isLoadingSyncHistory}
        error={syncHistoryError}
        onRetry={() => { void refetchSyncHistory() }}
      />

      <ManualSyncDialog
        open={syncDialogPhase !== null}
        phase={syncDialogPhase === "running" ? "running" : "confirm"}
        confirmTitle={unitsCopy.sync.confirmTitle}
        confirmDescription={unitsCopy.sync.confirmDescription}
        runningTitle={unitsCopy.sync.runningTitle}
        runningDescription={unitsCopy.sync.runningDescription}
        confirmLabel={unitsCopy.sync.confirmButton}
        cancelLabel={unitsCopy.sync.cancelButton}
        onConfirm={() => { void handleConfirmSync() }}
        onOpenChange={(open) => { if (!open && !isSyncing) setSyncDialogPhase(null) }}
      />
    </PageSection>
  )
}
