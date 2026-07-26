import { ParkingCircleIcon } from "lucide-react"

import { AppEmptyState } from "@/components/shared/app-empty-state"
import { AppPage } from "@/components/shared/app-page"
import { AppUnitSelector, useSelectedUnit } from "@/components/shared/app-unit-selector"

import { yardCopy } from "../yard-copy"

export function YardRoute() {
  const { selectedUnitName } = useSelectedUnit()
  const pageTitle = `${yardCopy.page.title} — ${selectedUnitName}`

  return (
    <AppPage
      title={pageTitle}
      subtitle={yardCopy.page.subtitle}
      actions={<AppUnitSelector />}
    >
      <div className="flex flex-1 items-center justify-center">
        <AppEmptyState
          media={<ParkingCircleIcon />}
          title={yardCopy.empty.title}
          description={yardCopy.empty.description}
        />
      </div>
    </AppPage>
  )
}
