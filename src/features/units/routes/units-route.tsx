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
  unitsRoutePaths,
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
  type UnitUserStats,
  type YardStatusFormValue,
} from "../model"
import { isUnitSyncInProgressError, triggerUnitsSync } from "../services"
import { createUnitsColumns, type UnitTableRow } from "../table"

const EMPTY_UNIT_USER_STATS = {
  managers: 0,
  operators: 0,
} satisfies UnitUserStats

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
  const [selectedUnitId, setSelectedUnitId] = React.useState<string | null>(null)
  const [configuringUnitId, setConfiguringUnitId] = React.useState<string | null>(null)
  const [yardStatus, setYardStatus] = React.useState<YardStatusFormValue>("inactive")
  const [yardSpots, setYardSpots] = React.useState("0")
  const [yardError, setYardError] = React.useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const canSyncUnits = canManageOperationalData(auth)
  const yardConfigByUnitId = React.useMemo(() => buildUnitYardConfigMap(unitYardConfigs), [unitYardConfigs])
  const userStatsByUnitId = React.useMemo(() => buildUnitUserStats(users), [users])
  const unitsTableData = React.useMemo<UnitTableRow[]>(
    () =>
      units.map((unit) => {
        const unitId = String(unit.cod_empresa)

        return {
          ...unit,
          userStats: userStatsByUnitId.get(unitId) ?? EMPTY_UNIT_USER_STATS,
          yardConfig: resolveUnitYardConfig(unitId, yardConfigByUnitId),
        }
      }),
    [units, userStatsByUnitId, yardConfigByUnitId]
  )
  const filterFields = useUnitsTableFilters(unitsTableData)
  const selectedUnit = React.useMemo(
    () => unitsTableData.find((unit) => String(unit.cod_empresa) === selectedUnitId) ?? null,
    [selectedUnitId, unitsTableData]
  )
  const configuringUnit = React.useMemo(
    () => unitsTableData.find((unit) => String(unit.cod_empresa) === configuringUnitId) ?? null,
    [configuringUnitId, unitsTableData]
  )

  const handleOpenDetails = React.useCallback((unit: UnitTableRow) => {
    setSelectedUnitId(String(unit.cod_empresa))
  }, [])

  const handleSelectUsers = React.useCallback(
    (unit: UnitTableRow) => {
      void navigate(unitsRoutePaths.users(unit.cod_empresa))
    },
    [navigate]
  )

  const handleConfigureYard = React.useCallback((unit: UnitTableRow) => {
    setConfiguringUnitId(String(unit.cod_empresa))
    setYardStatus(unit.yardConfig.patioActive ? "active" : "inactive")
    setYardSpots(String(unit.yardConfig.parkingSpots))
    setYardError(null)
  }, [])

  const columns = React.useMemo(
    () =>
      createUnitsColumns({
        onOpenDetails: handleOpenDetails,
        onSelectUsers: handleSelectUsers,
        onConfigureYard: canSyncUnits ? handleConfigureYard : undefined,
      }),
    [canSyncUnits, handleConfigureYard, handleOpenDetails, handleSelectUsers]
  )

  const refreshOperationalSnapshots = React.useCallback(async () => {
    await Promise.allSettled([refetch(), refetchSyncHistory()])
  }, [refetch, refetchSyncHistory])

  const handleSaveYardSettings = React.useCallback(async () => {
    if (!configuringUnit || isSavingYard) {
      return
    }

    const parsedSpots = parseYardSpotsInput(yardSpots)

    if (!parsedSpots.isValid) {
      setYardError(parsedSpots.error)
      return
    }

    try {
      await saveConfig({
        unitId: String(configuringUnit.cod_empresa),
        patioActive: yardStatus === "active",
        parkingSpots: parsedSpots.value,
      })
      await refreshOperationalSnapshots()
      setConfiguringUnitId(null)
      setYardError(null)
      notify.success(unitsCopy.yard.feedback.success)
    } catch {
      setYardError(unitsCopy.yard.feedback.error)
      notify.error(unitsCopy.yard.feedback.error)
    }
  }, [
    configuringUnit,
    isSavingYard,
    refreshOperationalSnapshots,
    saveConfig,
    yardSpots,
    yardStatus,
  ])

  const handleStartSync = React.useCallback(async () => {
    if (isSyncing) {
      return
    }

    setIsSyncing(true)

    try {
      await executeSyncWithRefresh({
        triggerSync: triggerUnitsSync,
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
  }, [isSyncing, refreshOperationalSnapshots])

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
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={isLoading || isSyncing}
                onClick={() => {
                  void handleStartSync()
                }}
              >
                <RefreshCcwIcon aria-hidden="true" />
                {unitsCopy.actions.sync}
              </Button>
            ) : null}
          </PageHeaderActions>
        )}
      />

      <DataTable
        columns={columns}
        data={unitsTableData}
        defaultColumnVisibility={DEFAULT_UNITS_COLUMN_VISIBILITY}
        columnVisibilityStorageKey={UNITS_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(unit: UnitTableRow) => String(unit.cod_empresa)}
        globalSearch={{
          columnIds: [
            "cod_empresa",
            "nom_razao_social",
            "nom_fantasia",
            "num_cnpj",
            "des_bandeira",
            "nom_cidade",
            "sgl_estado",
            "ip_rede",
          ],
          placeholder: unitsCopy.pages.units.searchPlaceholder,
        }}
        filterFields={filterFields}
        emptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={unitsCopy.empty.unitsTitle}
            description={unitsCopy.empty.unitsDescription}
          />
        )}
        filteredEmptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={unitsCopy.filteredEmpty.unitsTitle}
            description={unitsCopy.filteredEmpty.unitsDescription}
          />
        )}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />

      <AppDetailsSheet
        open={Boolean(selectedUnit)}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedUnitId(null)
          }
        }}
        title={selectedUnit?.nom_fantasia}
        description={selectedUnit?.nom_razao_social}
        items={
          selectedUnit
            ? getUnitDetailItems(selectedUnit, selectedUnit.yardConfig, selectedUnit.userStats)
            : []
        }
      />

      <UnitYardConfigDialog
        open={Boolean(configuringUnit)}
        onOpenChange={(open) => {
          if (!open) {
            setConfiguringUnitId(null)
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
        onSave={() => {
          void handleSaveYardSettings()
        }}
      />

      <UnitsSyncHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        entries={syncHistory}
        isLoading={isLoadingSyncHistory}
        error={syncHistoryError}
        onRetry={() => {
          void refetchSyncHistory()
        }}
      />

      <SyncBlockingDialog
        open={isSyncing}
        title={unitsCopy.sync.runningTitle}
        description={unitsCopy.sync.runningDescription}
      />
    </PageSection>
  )
}
