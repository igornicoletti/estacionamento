import { ScrollTextIcon } from "lucide-react"

import { PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { WorkspacePageHeader } from "@/features/workspace"

import { ReportsTabsContent } from "../components"
import { reportsCopy } from "../constants/reports-copy"
import { useReportsSnapshot } from "../hooks/use-reports-snapshot"

export function ReportsRoute() {
  const { data, error, isLoading, refetch } = useReportsSnapshot()

  if (isLoading) {
    return (
      <PageSection>
        <WorkspacePageHeader
          pageName={reportsCopy.page.title}
          subtitle={reportsCopy.page.subtitle}
        />

        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-6 text-primary" aria-label={reportsCopy.page.title} />
        </div>
      </PageSection>
    )
  }

  if (error || !data) {
    return (
      <PageSection>
        <WorkspacePageHeader
          pageName={reportsCopy.page.title}
          subtitle={reportsCopy.page.subtitle}
        />

        <AppEmptyState
          className="mx-auto my-6 max-w-lg"
          media={<ScrollTextIcon />}
          title="Não foi possível carregar os relatórios"
          description="Tente novamente para recarregar os dados da unidade selecionada."
          actions={(
            <Button type="button" variant="secondary" size="lg" onClick={() => { void refetch() }}>
              Recarregar
            </Button>
          )}
        />
      </PageSection>
    )
  }

  return (
    <PageSection>
      <WorkspacePageHeader
        pageName={reportsCopy.page.title}
        subtitle={reportsCopy.page.subtitle}
      />
      <ReportsTabsContent data={data} />
    </PageSection>
  )
}
