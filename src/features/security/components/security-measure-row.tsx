import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  type LucideIcon,
} from "lucide-react"
import { type ReactNode } from "react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"

import { type SecurityMeasureStatus } from "../types/security-types"

interface SecurityMeasureRowProps {
  action?: ReactNode
  description: string
  guidance?: {
    description: string
    title: string
  }
  icon: LucideIcon
  status: SecurityMeasureStatus
  title: string
}

export function SecurityMeasureRow({
  action,
  description,
  guidance,
  icon: Icon,
  status,
  title,
}: SecurityMeasureRowProps) {
  const isCompleted = status === "completed"
  const StatusIcon = isCompleted ? CheckCircle2Icon : AlertTriangleIcon

  return (
    <Item
      variant="default"
      className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-start gap-3 px-0 py-0 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
    >
      <ItemMedia
        variant="icon"
        className={cn("mt-0.5", isCompleted ? "text-success" : "text-warning")}
      >
        <StatusIcon aria-hidden="true" />
      </ItemMedia>
      <ItemMedia variant="icon" className="mt-0.5 text-muted-foreground">
        <Icon aria-hidden="true" />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="line-clamp-none">{title}</ItemTitle>
        <ItemDescription className="line-clamp-none">
          {description}
        </ItemDescription>
      </ItemContent>
      {action ? (
        <ItemActions className="col-start-3 row-start-2 justify-start sm:col-start-4 sm:row-start-1 sm:justify-end sm:self-center">
          {action}
        </ItemActions>
      ) : null}
      {!isCompleted && guidance ? (
        <Alert className="col-span-3 col-start-1 row-start-3 border-none bg-info-subtle text-info sm:col-span-2 sm:col-start-3 sm:row-start-2">
          <InfoIcon aria-hidden="true" />
          <AlertTitle>{guidance.title}</AlertTitle>
          <AlertDescription className="text-info">
            {guidance.description}
          </AlertDescription>
        </Alert>
      ) : null}
    </Item>
  )
}
