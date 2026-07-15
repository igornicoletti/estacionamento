import { PageHeader } from "@/components/page/page-header"
import { PageSection } from "@/components/page/page-section"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { ParkingCircleIcon } from "lucide-react"

import { yardCopy } from "../yard-copy"

export function YardRoute() {
  return (
    <PageSection>
      <PageHeader
        title={yardCopy.page.title}
        subtitle={yardCopy.page.subtitle}
      />
      <div className="flex flex-1 items-center justify-center">
        <AppEmptyState
          className="mx-auto max-w-md"
          media={<ParkingCircleIcon />}
          title={yardCopy.empty.title}
          description={yardCopy.empty.description}
        />
      </div>
    </PageSection>
  )
}
