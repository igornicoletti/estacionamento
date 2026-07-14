import * as React from "react"
import { SearchIcon } from "lucide-react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useUnits } from "@/features/units"

import { pricesCopy } from "../prices-copy"
import {
  type PriceRecordStatus,
  type PriceTableScope,
  type SavePriceTableInput,
} from "../types/prices-types"
import { toDateTimeLocalValue } from "../utils/prices-models"

interface PriceTableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: SavePriceTableInput) => Promise<void>
}

type PriceTableFormErrors = Partial<Record<
  "unitId" | "unitName" | "amount" | "cycleHours" | "graceMinutes" | "toleranceMinutes" | "startsAt" | "endsAt" | "reason",
  string
>>

interface UnitOption {
  value: string
  label: string
}

const defaultStartsAt = () => toDateTimeLocalValue(new Date())

function readNumber(value: string) {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function readInteger(value: string) {
  const parsed = readNumber(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : Number.NaN
}

function readDateTime(value: string) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoOrNull(value: string) {
  return readDateTime(value)?.toISOString() ?? null
}

export function PriceTableFormDialog({
  open,
  onOpenChange,
  isSaving,
  onSubmit,
}: PriceTableFormDialogProps) {
  const [scope, setScope] = React.useState<PriceTableScope>("network")
  const [unitId, setUnitId] = React.useState("")
  const [unitName, setUnitName] = React.useState("")
  const [amount, setAmount] = React.useState("")
  const [cycleHours, setCycleHours] = React.useState("1")
  const [graceMinutes, setGraceMinutes] = React.useState("0")
  const [toleranceMinutes, setToleranceMinutes] = React.useState("0")
  const [startsAt, setStartsAt] = React.useState(defaultStartsAt)
  const [endsAt, setEndsAt] = React.useState("")
  const [status, setStatus] = React.useState<PriceRecordStatus>("active")
  const [reason, setReason] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<PriceTableFormErrors>({})
  const unitsSnapshot = useUnits()
  const unitOptions = React.useMemo<UnitOption[]>(
    () =>
      unitsSnapshot.data.map((unit) => ({
        label: unit.nom_fantasia || unit.nom_razao_social || String(unit.cod_empresa),
        value: String(unit.cod_empresa),
      })),
    [unitsSnapshot.data]
  )
  const selectedUnit = React.useMemo(
    () => unitOptions.find((unit) => unit.value === unitId) ?? null,
    [unitId, unitOptions]
  )

  function resetForm() {
    setScope("network")
    setUnitId("")
    setUnitName("")
    setAmount("")
    setCycleHours("1")
    setGraceMinutes("0")
    setToleranceMinutes("0")
    setStartsAt(defaultStartsAt())
    setEndsAt("")
    setStatus("active")
    setReason("")
    setNotes("")
    setErrors({})
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetForm()
    }
  }

  function validate() {
    const nextErrors: PriceTableFormErrors = {}
    const parsedAmount = readNumber(amount)
    const parsedCycleHours = readInteger(cycleHours)
    const parsedGraceMinutes = readInteger(graceMinutes)
    const parsedToleranceMinutes = readInteger(toleranceMinutes)
    const startsAtDate = readDateTime(startsAt)
    const endsAtDate = readDateTime(endsAt)

    if (scope === "unit") {
      if (!unitId.trim()) {
        nextErrors.unitId = pricesCopy.form.validation.unitId
      }

      if (!unitName.trim()) {
        nextErrors.unitName = pricesCopy.form.validation.unitName
      }
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      nextErrors.amount = pricesCopy.form.validation.amount
    }

    if (!Number.isInteger(parsedCycleHours) || parsedCycleHours < 1 || parsedCycleHours > 720) {
      nextErrors.cycleHours = pricesCopy.form.validation.cycleHours
    }

    if (!Number.isInteger(parsedGraceMinutes) || parsedGraceMinutes < 0 || parsedGraceMinutes > 1440) {
      nextErrors.graceMinutes = pricesCopy.form.validation.graceMinutes
    }

    if (!Number.isInteger(parsedToleranceMinutes) || parsedToleranceMinutes < 0 || parsedToleranceMinutes > 240) {
      nextErrors.toleranceMinutes = pricesCopy.form.validation.toleranceMinutes
    }

    if (!startsAtDate) {
      nextErrors.startsAt = pricesCopy.form.validation.startsAt
    }

    if (endsAt && (!endsAtDate || (startsAtDate && endsAtDate <= startsAtDate))) {
      nextErrors.endsAt = pricesCopy.form.validation.endsAt
    }

    if (reason.trim().length < 10) {
      nextErrors.reason = pricesCopy.form.validation.reason
    }

    return nextErrors
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const nextErrors = validate()

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const startsAtIso = toIsoOrNull(startsAt)

    if (!startsAtIso) {
      setErrors({ startsAt: pricesCopy.form.validation.startsAt })
      return
    }

    await onSubmit({
      scope,
      unitId: scope === "unit" ? unitId : null,
      unitName: scope === "unit" ? unitName : null,
      amount: readNumber(amount),
      cycleHours: readInteger(cycleHours),
      graceMinutes: readInteger(graceMinutes),
      toleranceMinutes: readInteger(toleranceMinutes),
      startsAt: startsAtIso,
      endsAt: toIsoOrNull(endsAt),
      status,
      reason,
      notes: notes.trim() ? notes : null,
    })

    handleOpenChange(false)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={pricesCopy.form.title}
      description={pricesCopy.form.description}
      footer={(
        <>
          <Button type="button" variant="outline" size="lg" disabled={isSaving} onClick={() => handleOpenChange(false)}>
            {pricesCopy.actions.cancel}
          </Button>
          <Button type="submit" size="lg" disabled={isSaving} form="price-table-form">
            {pricesCopy.actions.save}
          </Button>
        </>
      )}
    >
      <form id="price-table-form" className="grid gap-4" onSubmit={(event) => { void handleSubmit(event) }}>
        <Field>
          <FieldLabel>{pricesCopy.form.scope}</FieldLabel>
          <Select
            value={scope}
            onValueChange={(value: PriceTableScope) => {
              setScope(value)
              if (value === "network") {
                setUnitId("")
                setUnitName("")
              }
              setErrors({})
            }}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={pricesCopy.form.scopePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="network">{pricesCopy.labels.network}</SelectItem>
              <SelectItem value="unit">{pricesCopy.labels.unit}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {scope === "unit" ? (
          <Field data-invalid={Boolean(errors.unitId || errors.unitName)}>
            <FieldLabel htmlFor="price-unit">{pricesCopy.form.unitName}</FieldLabel>
            <Combobox<UnitOption>
              items={unitOptions}
              value={selectedUnit}
              onValueChange={(value: UnitOption | UnitOption[] | null) => {
                const selectedOption = Array.isArray(value) ? value[0] ?? null : value

                setUnitId(selectedOption?.value ?? "")
                setUnitName(selectedOption?.label ?? "")
                setErrors((state) => ({
                  ...state,
                  unitId: undefined,
                  unitName: undefined,
                }))
              }}
              itemToStringLabel={(unit) => unit.label}
              itemToStringValue={(unit) => `${unit.value} ${unit.label}`}
              disabled={isSaving || unitsSnapshot.isLoading}
            >
              <ComboboxInput
                id="price-unit"
                className="h-9 w-full"
                placeholder={pricesCopy.form.unitPlaceholder}
                disabled={isSaving || unitsSnapshot.isLoading}
                aria-invalid={Boolean(errors.unitId || errors.unitName)}
              >
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
              </ComboboxInput>
              <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                <ComboboxEmpty>{pricesCopy.form.unitEmpty}</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxCollection>
                    {(unit: UnitOption) => (
                      <ComboboxItem key={unit.value} value={unit}>
                        {unit.label}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {errors.unitId ? <FieldError>{errors.unitId}</FieldError> : null}
            {errors.unitName && !errors.unitId ? <FieldError>{errors.unitName}</FieldError> : null}
          </Field>
        ) : null}

        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.amount)}>
            <FieldLabel htmlFor="price-amount">{pricesCopy.form.amount}</FieldLabel>
            <Input
              id="price-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                setErrors((state) => ({ ...state, amount: undefined }))
              }}
              disabled={isSaving}
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.cycleHours)}>
            <FieldLabel htmlFor="price-cycle-hours">{pricesCopy.form.cycleHours}</FieldLabel>
            <Input
              id="price-cycle-hours"
              inputMode="numeric"
              value={cycleHours}
              onChange={(event) => {
                setCycleHours(event.target.value)
                setErrors((state) => ({ ...state, cycleHours: undefined }))
              }}
              disabled={isSaving}
              aria-invalid={Boolean(errors.cycleHours)}
            />
            {errors.cycleHours ? <FieldError>{errors.cycleHours}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.graceMinutes)}>
            <FieldLabel htmlFor="price-grace-minutes">{pricesCopy.form.graceMinutes}</FieldLabel>
            <Input
              id="price-grace-minutes"
              inputMode="numeric"
              value={graceMinutes}
              onChange={(event) => {
                setGraceMinutes(event.target.value)
                setErrors((state) => ({ ...state, graceMinutes: undefined }))
              }}
              disabled={isSaving}
              aria-invalid={Boolean(errors.graceMinutes)}
            />
            {errors.graceMinutes ? <FieldError>{errors.graceMinutes}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.toleranceMinutes)}>
            <FieldLabel htmlFor="price-tolerance-minutes">{pricesCopy.form.toleranceMinutes}</FieldLabel>
            <Input
              id="price-tolerance-minutes"
              inputMode="numeric"
              value={toleranceMinutes}
              onChange={(event) => {
                setToleranceMinutes(event.target.value)
                setErrors((state) => ({ ...state, toleranceMinutes: undefined }))
              }}
              disabled={isSaving}
              aria-invalid={Boolean(errors.toleranceMinutes)}
            />
            {errors.toleranceMinutes ? <FieldError>{errors.toleranceMinutes}</FieldError> : null}
          </Field>
        </FieldGroup>

        <Field data-invalid={Boolean(errors.startsAt)}>
          <FieldLabel htmlFor="price-starts-at">{pricesCopy.form.startsAt}</FieldLabel>
          <Input
            id="price-starts-at"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => {
              setStartsAt(event.target.value)
              setErrors((state) => ({ ...state, startsAt: undefined }))
            }}
            disabled={isSaving}
            aria-invalid={Boolean(errors.startsAt)}
          />
          {errors.startsAt ? <FieldError>{errors.startsAt}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(errors.endsAt)}>
          <FieldLabel htmlFor="price-ends-at">{pricesCopy.form.endsAt}</FieldLabel>
          <Input
            id="price-ends-at"
            type="datetime-local"
            value={endsAt}
            onChange={(event) => {
              setEndsAt(event.target.value)
              setErrors((state) => ({ ...state, endsAt: undefined }))
            }}
            disabled={isSaving}
            aria-invalid={Boolean(errors.endsAt)}
          />
          {errors.endsAt ? <FieldError>{errors.endsAt}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel>{pricesCopy.form.status}</FieldLabel>
          <Select value={status} onValueChange={(value: PriceRecordStatus) => setStatus(value)} disabled={isSaving}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={pricesCopy.form.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{pricesCopy.labels.active}</SelectItem>
              <SelectItem value="inactive">{pricesCopy.labels.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(errors.reason)}>
          <FieldLabel htmlFor="price-reason">{pricesCopy.form.reason}</FieldLabel>
          <Textarea
            id="price-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setErrors((state) => ({ ...state, reason: undefined }))
            }}
            disabled={isSaving}
            aria-invalid={Boolean(errors.reason)}
          />
          {errors.reason ? <FieldError>{errors.reason}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="price-notes">{pricesCopy.form.notes}</FieldLabel>
          <Textarea
            id="price-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSaving}
          />
        </Field>
      </form>
    </AppDialog>
  )
}
