import { PageSection } from "@/components/page"
import { WorkspacePageHeader } from "@/features/workspace"

import { ReportsTabsContent } from "../components"
import { reportsCopy } from "../constants/reports-copy"
import { useReportsSnapshot } from "../hooks/use-reports-snapshot"

export function ReportsRoute() {
  const { data, error, isLoading, refetch } = useReportsSnapshot()

  return (
    <PageSection>
      <WorkspacePageHeader
        pageName={reportsCopy.page.title}
        subtitle={reportsCopy.page.subtitle}
      />
      <ReportsTabsContent
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
      />
    </PageSection>
  )
}
