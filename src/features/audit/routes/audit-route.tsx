import { DownloadIcon } from "lucide-react"
import * as React from "react"

import { formatDateTime } from "@/lib"
import { exportRowsToXlsx, type XlsxColumn } from "@/lib/export"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"

import {
  createAuditColumns,
  getAuditActorRoleLabel,
} from "../columns/audit-columns"
import { useAudit } from "../hooks/use-audit"
import {
  auditActionLabels,
  auditOutcomeLabels,
  type AuditEvent,
} from "../types/audit-types"

const auditExportColumns: readonly XlsxColumn<AuditEvent>[] = [
  { header: "Data/hora", accessor: (event) => formatDateTime(event.occurredAt) },
  { header: "Responsável", accessor: (event) => event.actorName },
  { header: "Perfil", accessor: (event) => getAuditActorRoleLabel(event) },
  { header: "Ação", accessor: (event) => auditActionLabels[event.action] },
  { header: "Resultado", accessor: (event) => auditOutcomeLabels[event.outcome] },
  { header: "Entidade", accessor: (event) => event.entity },
  { header: "Identificador", accessor: (event) => event.entityId },
  { header: "Unidade", accessor: (event) => event.unitName ?? "—" },
  { header: "Endereço IP", accessor: (event) => event.ipAddress },
  { header: "Dispositivo", accessor: (event) => event.userAgent },
  { header: "Descrição", accessor: (event) => event.description },
]

export function AuditRoute() {
  const { data: events, error, isLoading, refetch } = useAudit()
  const columns = React.useMemo(() => createAuditColumns(), [])

  const actionOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.action,
        (event) => auditActionLabels[event.action]
      ),
    [events]
  )

  const outcomeOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.outcome,
        (event) => auditOutcomeLabels[event.outcome]
      ),
    [events]
  )

  const roleOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        events,
        (event) => event.actorRole ?? "",
        (event) => getAuditActorRoleLabel(event)
      ),
    [events]
  )

  const handleExport = React.useCallback(() => {
    if (events.length === 0) {
      notify.error("Não há eventos de auditoria para exportar.")
      return
    }

    try {
      exportRowsToXlsx({
        filename: "auditoria",
        sheetName: "Auditoria",
        columns: auditExportColumns,
        rows: events,
      })

      notify.success("Exportação de auditoria gerada.")
    } catch {
      notify.error("Não foi possível exportar a auditoria.")
    }
  }, [events])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Auditoria</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe os eventos de segurança e as ações realizadas no sistema.
          </p>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading || events.length === 0}
            onClick={handleExport}
          >
            <DownloadIcon aria-hidden="true" />
            Exportar
          </Button>
        </div>
      </header>

      <DataTable
        columns={columns}
        data={events}
        getRowId={(event) => event.id}
        globalSearch={{
          columnIds: [
            "actorName",
            "entity",
            "entityId",
            "unitName",
            "ipAddress",
            "userAgent",
            "description",
          ],
          placeholder: "Buscar na auditoria...",
        }}
        filterFields={[
          {
            id: "action",
            title: "Ações",
            options: actionOptions,
          },
          {
            id: "outcome",
            title: "Resultados",
            options: outcomeOptions,
          },
          {
            id: "actorRole",
            title: "Perfis",
            options: roleOptions,
          },
        ]}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />
    </div>
  )
}
