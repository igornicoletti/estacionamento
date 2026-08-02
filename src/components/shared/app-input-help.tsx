import { InfoIcon } from "lucide-react"

import { InputGroupButton } from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

export function AppInputHelp({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <InputGroupButton
          variant="ghost"
          size="icon-xs"
          aria-label={`Ajuda: ${title}`}
        >
          <InfoIcon aria-hidden="true" />
        </InputGroupButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverDescription>{description}</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}
