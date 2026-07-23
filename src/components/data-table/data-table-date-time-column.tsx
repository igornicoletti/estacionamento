import { type ColumnDef, type Row } from "@tanstack/react-table"
import * as React from "react"

import { createDataTableColumnHeader } from "./data-table-column-header"
import { type DataTableColumnId } from "./data-table-types"

const ISO_DATE_TIME_WITH_OFFSET_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/

const DEFAULT_DATE_TIME_FORMAT_OPTIONS = {
  dateStyle: "short",
  timeStyle: "short",
} as const satisfies Intl.DateTimeFormatOptions

type DataTableDateTimeFallback<TData> =
  | React.ReactNode
  | ((row: Row<TData>) => React.ReactNode)

type DataTableDateTimeParser<TData> = (
  value: unknown,
  originalRow: TData,
  rowIndex: number
) => Date | null | undefined

interface DataTableDateTimeColumnConfig<TData extends object> {
  accessorKey: DataTableColumnId<TData>
  title: string
  getValue?: (originalRow: TData, rowIndex: number) => unknown
  fallback?: DataTableDateTimeFallback<TData>
  parseValue?: DataTableDateTimeParser<TData>
  formatValue?: (value: Date, row: Row<TData>) => React.ReactNode
  locale?: string | string[]
  dateTimeFormatOptions?: Intl.DateTimeFormatOptions
  enableHiding?: boolean
  enableSorting?: boolean
  sortDescFirst?: boolean
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime())
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function hasValidCalendarDate(
  year: number,
  month: number,
  day: number
): boolean {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return false
  }

  const daysPerMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

  return day <= daysPerMonth[month - 1]
}

function hasValidTimezoneOffset(timezoneOffset: string): boolean {
  if (timezoneOffset === "Z") {
    return true
  }

  const offsetHours = Number(timezoneOffset.slice(1, 3))
  const offsetMinutes = Number(timezoneOffset.slice(4, 6))

  if (
    !Number.isInteger(offsetHours) ||
    !Number.isInteger(offsetMinutes) ||
    offsetHours < 0 ||
    offsetHours > 14 ||
    offsetMinutes < 0 ||
    offsetMinutes > 59
  ) {
    return false
  }

  return offsetHours !== 14 || offsetMinutes === 0
}

function normalizeFractionalSeconds(value: string): string {
  return value.replace(
    /\.(\d+)(?=Z|[+-]\d{2}:\d{2}$)/,
    (_, fractionalSeconds: string) => {
      const milliseconds = fractionalSeconds.padEnd(3, "0").slice(0, 3)

      return `.${milliseconds}`
    }
  )
}

function isValidIsoDateTimeWithOffset(value: string): boolean {
  const match = ISO_DATE_TIME_WITH_OFFSET_PATTERN.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hours = Number(match[4])
  const minutes = Number(match[5])
  const seconds = Number(match[6])
  const timezoneOffset = match[8]

  return (
    hasValidCalendarDate(year, month, day) &&
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    Number.isInteger(seconds) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59 &&
    seconds >= 0 &&
    seconds <= 59 &&
    Boolean(timezoneOffset) &&
    hasValidTimezoneOffset(timezoneOffset)
  )
}

export function parseDataTableDateTime(value: unknown): Date | null {
  if (isValidDate(value)) {
    return new Date(value.getTime())
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null
    }

    const date = new Date(value)

    return isValidDate(date) ? date : null
  }

  if (typeof value !== "string") {
    return null
  }

  const normalizedValue = value.trim()

  if (
    normalizedValue.length === 0 ||
    !isValidIsoDateTimeWithOffset(normalizedValue)
  ) {
    return null
  }

  const timestamp = Date.parse(normalizeFractionalSeconds(normalizedValue))

  if (!Number.isFinite(timestamp)) {
    return null
  }

  const date = new Date(timestamp)

  return isValidDate(date) ? date : null
}

function resolveFallback<TData>(
  fallback: DataTableDateTimeFallback<TData>,
  row: Row<TData>
): React.ReactNode {
  return typeof fallback === "function" ? fallback(row) : fallback
}

export function createDateTimeColumn<TData extends object>({
  accessorKey,
  title,
  getValue,
  fallback = "—",
  parseValue = parseDataTableDateTime,
  formatValue,
  locale = "pt-BR",
  dateTimeFormatOptions = DEFAULT_DATE_TIME_FORMAT_OPTIONS,
  enableHiding = true,
  enableSorting = true,
  sortDescFirst,
}: DataTableDateTimeColumnConfig<TData>): ColumnDef<TData> {
  const dateTimeFormatter = new Intl.DateTimeFormat(
    locale,
    dateTimeFormatOptions
  )

  return {
    id: accessorKey,
    accessorFn: (originalRow, rowIndex) => {
      const rawValue = getValue
        ? getValue(originalRow, rowIndex)
        : Reflect.get(originalRow, accessorKey)
      const parsedValue = parseValue(rawValue, originalRow, rowIndex)

      return isValidDate(parsedValue) ? parsedValue : undefined
    },
    meta: {
      label: title,
    },
    header: createDataTableColumnHeader<TData, unknown>(title),
    cell: ({ getValue: getCellValue, row }) => {
      const value = getCellValue<Date | undefined>()

      if (!value) {
        return resolveFallback(fallback, row)
      }

      if (formatValue) {
        return formatValue(value, row)
      }

      return (
        <time dateTime={value.toISOString()}>
          {dateTimeFormatter.format(value)}
        </time>
      )
    },
    enableHiding,
    enableSorting,
    sortingFn: "datetime",
    sortDescFirst,
    sortUndefined: "last",
  }
}
