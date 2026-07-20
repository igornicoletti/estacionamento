import { DatabaseIcon, HistoryIcon, RefreshCcwIcon } from "lucide-react"
import * as React from "react"
import { useNavigate } from "react-router"

import { DataTable } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppDetailsSheet } from "@/components/shared/app-details-sheet"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AUTH_PERMISSION, useAuth } from "@/features/auth"
import { SyncBlockingDialog, executeSyncWithRefresh } from "@/features/sync"
import { useUsers } from "@/features/users"

import {
  UnitYardConfigDialog,
  UnitsSyncHistoryDialog,
} from "../components"
import {
  DEFAULT_UNITS_COLUMN_VISIBILITY,
  UNITS_TABLE_COLUMN_VISIBILITY_KEY,
  unitsCopy,
} from "../constants"
import {
  useUnitSyncHistory,
  useUnitYardConfigs,
  useUnits,
  useUnitsTableFilters,
} from "../hooks"
import {
  buildUnitUserStats,
  buildUnitYardConfigMap,
  getUnitDetailItems,
  parseYardSpotsInput,
  resolveUnitYardConfig,
  type Unit,
  type YardStatusFormValue,
} from "../model"
import { isUnitSyncInProgressError, triggerUnitsSync } from "../services"
import { createUnitsColumns } from "../table"

function canManageOperationalData(auth: ReturnType<typeof useAuth>) {
  return auth.access.hasPermission(AUTH_PERMISSION.syncExecute)
}

export function UnitsRoute() {
  const navigate = useNavigate()
  const auth = useAuth()
  const { data: units, error, isLoading, refetch } = useUnits()
  const { data: users } = useUsers({
    enabled: auth.access.hasPermission(AUTH_PERMISSION.usersRead),
  })
  const {
    data: syncHistory,
    error: syncHistoryError,
    isLoading: isLoadingSyncHistory,
    refetch: refetchSyncHistory,
  } = useUnitSyncHistory()
  const { data: unitYardConfigs, isSaving: isSavingYard, saveConfig } = useUnitYardConfigs()
  const [selectedUnit, setSelectedUnit] = React.useState<Unit | null>(null)
  const [configuringUnit, setConfiguringUnit] = React.useState<Unit | null>(null)
  const [yardStatus, setYardStatus] = React.useState<YardStatusFormValue>("inactive")
  const [yardSpots, setYardSpots] = React.useState("0")
  const [yardError, setYardError] = React.useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const filterFields = useUnitsTableFilters(units)
  const canSyncUnits = canManageOperationalData(auth)
  const yardConfigByUnitId = React.useMemo(() => buildUnitYardConfigMap(unitYardConfigs), [unitYardConfigs])
  const userStatsByUnitId = React.useMemo(() => buildUnitUserStats(users), [users])
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

  async function handleSaveYardSettings() {
    if (!configuringUnit || isSavingYard) {
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
        unitsCopy.yard.feedback
      )
      await Promise.allSettled([refetch(), refetchSyncHistory()])
      setConfiguringUnit(null)
      setYardError(null)
    } catch {
      setYardError(unitsCopy.yard.feedback.error)
    }
  }

  async function refreshOperationalSnapshots() {
    await Promise.allSettled([refetch(), refetchSyncHistory()])
  }

  async function handleStartSync() {
    if (isSyncing) {
      return
    }

    setIsSyncing(true)

    try {
      await executeSyncWithRefresh({
        triggerSync: () => triggerUnitsSync("incremental"),
        refreshSnapshots: refreshOperationalSnapshots,
        isInProgressError: isUnitSyncInProgressError,
        onSuccess: () => {
          notify.success(unitsCopy.sync.feedback.success)
        },
        onWarning: () => {
          notify.warning(unitsCopy.sync.feedback.inProgress)
        },
        onError: () => {
          notify.error(unitsCopy.sync.feedback.error)
        },
      })
    } finally {
      setIsSyncing(false)
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
              <Button type="button" variant="secondary" size="lg" disabled={isLoading || isSyncing} onClick={() => { void handleStartSync() }}>
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
        defaultColumnVisibility={DEFAULT_UNITS_COLUMN_VISIBILITY}
        columnVisibilityStorageKey={UNITS_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(unit: Unit) => String(unit.cod_empresa)}
        globalSearch={{
          columnIds: ["cod_empresa", "nom_razao_social", "nom_fantasia", "num_cnpj", "des_bandeira", "nom_cidade", "sgl_estado", "ip_rede"],
          placeholder: unitsCopy.pages.units.searchPlaceholder,
        }}
        filterFields={filterFields}
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
        onOpenChange={(open: boolean) => { if (!open) setSelectedUnit(null) }}
        title={selectedUnit?.nom_fantasia}
        description={selectedUnit?.nom_razao_social}
        items={selectedUnit && selectedUnitYardConfig ? getUnitDetailItems(selectedUnit, selectedUnitYardConfig, selectedUnitUserStats) : []}
      />

      <UnitYardConfigDialog
        open={Boolean(configuringUnit)}
        onOpenChange={(open) => {
          if (!open) {
            setConfiguringUnit(null)
            setYardError(null)
          }
        }}
        unitName={configuringUnit?.nom_fantasia}
        status={yardStatus}
        spots={yardSpots}
        error={yardError}
        isSaving={isSavingYard}
        onStatusChange={setYardStatus}
        onSpotsChange={(value) => {
          setYardSpots(value)
          setYardError(null)
        }}
        onSave={() => { void handleSaveYardSettings() }}
      />

      <UnitsSyncHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        entries={syncHistory}
        isLoading={isLoadingSyncHistory}
        error={syncHistoryError}
        onRetry={() => { void refetchSyncHistory() }}
      />

      <SyncBlockingDialog
        open={isSyncing}
        title={unitsCopy.sync.runningTitle}
        description={unitsCopy.sync.runningDescription}
      />
    </PageSection>
  )
}
