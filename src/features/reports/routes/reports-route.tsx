import { PageHeader, PageSection } from "@/components/page"
import { AppUnitSelector, useSelectedUnit } from "@/components/shared/app-unit-selector"

import { ReportsTabsContent } from "../components"
import { reportsCopy } from "../constants/reports-copy"
import { useReportsSnapshot } from "../hooks/use-reports-snapshot"

export function ReportsRoute() {
  const { selectedUnitName } = useSelectedUnit()
  const { data, error, isLoading, refetch } = useReportsSnapshot()
  const pageTitle = `${reportsCopy.page.title} — ${selectedUnitName}`

  return (
    <PageSection>
      <PageHeader
        title={pageTitle}
        subtitle={reportsCopy.page.subtitle}
        actions={<AppUnitSelector />}
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
