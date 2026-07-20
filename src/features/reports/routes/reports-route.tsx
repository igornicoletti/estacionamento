import { ScrollTextIcon } from "lucide-react"

import { PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { WorkspacePageHeader } from "@/features/workspace"

import { reportsCopy } from "../reports-copy"

export function ReportsRoute() {
  return (
    <PageSection>
      <WorkspacePageHeader
        pageName={reportsCopy.page.title}
        subtitle={reportsCopy.page.subtitle}
      />

      <AppEmptyState
        className="mx-auto my-6 max-w-lg"
        media={<ScrollTextIcon />}
        title={reportsCopy.empty.title}
        description={reportsCopy.empty.description}
      />
    </PageSection>
  )
}
