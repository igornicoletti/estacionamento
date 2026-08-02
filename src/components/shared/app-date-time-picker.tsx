import { CalendarIcon, Clock3Icon, XIcon } from "lucide-react"
import { ptBR } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})
const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

function pad(value: number) {
  return value.toString().padStart(2, "0")
}

export function parseLocalDateTimeValue(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u
  )

  if (!match) return null

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5])
  )

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatLocalDateTimeValue(date: Date) {
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T")
}

export function AppDateTimePicker({
  allowClear = false,
  "aria-invalid": ariaInvalid,
  disabled = false,
  id,
  onValueChange,
  placeholder = "Selecione data e horário",
  value,
}: {
  allowClear?: boolean
  "aria-invalid"?: boolean
  disabled?: boolean
  id: string
  onValueChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  const selectedDate = parseLocalDateTimeValue(value)
  const timeValue = selectedDate
    ? `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`
    : "00:00"

  function updateDate(date: Date | undefined) {
    if (!date) return

    const nextDate = new Date(date)
    nextDate.setHours(
      selectedDate?.getHours() ?? 0,
      selectedDate?.getMinutes() ?? 0,
      0,
      0
    )
    onValueChange(formatLocalDateTimeValue(nextDate))
  }

  function updateTime(nextTime: string) {
    if (!selectedDate || !/^\d{2}:\d{2}$/u.test(nextTime)) return

    const [hours, minutes] = nextTime.split(":").map(Number)
    const nextDate = new Date(selectedDate)
    nextDate.setHours(hours, minutes, 0, 0)
    onValueChange(formatLocalDateTimeValue(nextDate))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full justify-start font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon data-icon="inline-start" aria-hidden="true" />
          {selectedDate ? dateTimeFormatter.format(selectedDate) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate ?? undefined}
          onSelect={updateDate}
          locale={ptBR}
          timeZone={browserTimeZone}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2040, 11)}
        />
        <Separator />
        <div className="flex items-center gap-2 p-3">
          <InputGroup>
            <InputGroupInput
              type="time"
              aria-label="Horário"
              value={timeValue}
              disabled={!selectedDate || disabled}
              onChange={(event) => updateTime(event.target.value)}
            />
            <InputGroupAddon>
              <Clock3Icon aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
          {allowClear && selectedDate ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Limpar data e horário"
              onClick={() => onValueChange("")}
            >
              <XIcon aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
