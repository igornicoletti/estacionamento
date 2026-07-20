import { PageHeader } from "@/components/page"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceUnit } from "./workspace-unit-context"

type WorkspacePageHeaderProps = {
  pageName: string
  subtitle: string
}

export function WorkspacePageHeader({ pageName, subtitle }: WorkspacePageHeaderProps) {
  const {
    canSelectUnit,
    isLoading,
    selectedUnitId,
    selectedUnitName,
    setSelectedUnitId,
    visibleUnits,
  } = useWorkspaceUnit()

  const title = `${pageName} - ${selectedUnitName}`

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={canSelectUnit ? (
        <div className="w-full lg:w-[320px]">
          {isLoading ? (
            <div className="flex h-9 items-center justify-start text-muted-foreground">
              <Spinner className="size-4" />
            </div>
          ) : (
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
          )}
        </div>
      ) : null}
    />
  )
}
