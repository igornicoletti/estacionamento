import { LayoutDashboardIcon } from "lucide-react"

import { PageSection } from "@/components/page"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { WorkspacePageHeader } from "@/features/workspace"

import { dashboardCopy } from "../dashboard-copy"

export function DashboardRoute() {
  return (
    <PageSection>
      <WorkspacePageHeader
        pageName={dashboardCopy.page.title}
        subtitle={dashboardCopy.page.subtitle}
      />

      <div className="flex flex-1 items-center justify-center">
        <AppEmptyState
          className="mx-auto max-w-md"
          media={<LayoutDashboardIcon />}
          title={dashboardCopy.empty.title}
          description={dashboardCopy.empty.description}
        />
      </div>
    </PageSection>
  )
}
