import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

import { savePriceTable } from "@/features/prices/services/prices-service"
import { pricesCopy } from "../constants"
import {
  createEmptyPriceTableFormValues,
  createPriceTableFormValues,
  priceScopeLabels,
  priceScopeValues,
  priceStatusLabels,
  priceStatusValues,
  validatePriceTableForm,
  type PriceTableFormErrors,
  type PriceTableFormValues,
  type PriceTableRecord,
} from "../model"

interface PriceTableFormDialogProps {
  open: boolean
  record?: PriceTableRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

function toInputDateTime(value: string | null) {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toISOString().slice(0, 16)
}

function toFormValues(record: PriceTableRecord | null | undefined): PriceTableFormValues {
  if (!record) {
    return createEmptyPriceTableFormValues()
  }

  return createPriceTableFormValues({
    id: record.id,
    name: record.name,
    scope: record.scope,
    unitId: record.unitId ?? "",
    unitName: record.unitName ?? "",
    graceMinutes: String(record.graceMinutes),
    toleranceMinutes: String(record.toleranceMinutes),
    cycleHours: String(record.cycleHours),
    amount: String(record.amount),
    startsAt: toInputDateTime(record.startsAt),
    endsAt: toInputDateTime(record.endsAt),
    status: record.status,
    notes: record.notes ?? "",
  })
}

export function PriceTableFormDialog({
  open,
  record,
  onOpenChange,
  onSaved,
}: PriceTableFormDialogProps) {
  const dialogStateKey = record?.id ?? (open ? "create" : "closed")
  const [values, setValues] = React.useState(() => toFormValues(record))
  const [errors, setErrors] = React.useState<PriceTableFormErrors>({})
  const [isSaving, setIsSaving] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  function updateValue(key: keyof PriceTableFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }))
      setSubmitError(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const parsed = validatePriceTableForm(values)

    if (!parsed.success) {
      setErrors(parsed.errors)
      return
    }

    setErrors({})
    setSubmitError(null)
    setIsSaving(true)

    try {
      await savePriceTable(parsed.data)
      notify.success(pricesCopy.feedback.saveSuccess)
      onSaved()
      onOpenChange(false)
    } catch {
      setSubmitError(pricesCopy.feedback.saveError)
      notify.error(pricesCopy.feedback.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppDialog
      key={dialogStateKey}
      open={open}
      onOpenChange={onOpenChange}
      title={record ? pricesCopy.form.editTitle : pricesCopy.form.createTitle}
      description={pricesCopy.form.description}
    >
      <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => void handleSubmit(event)} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="price-name">
              {pricesCopy.form.name}
              <RequiredMark />
            </FieldLabel>
            <Input id="price-name" value={values.name} onChange={updateValue("name")} aria-invalid={Boolean(errors.name)} />
            {errors.name ? <FieldError>{errors.name}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.scope)}>
            <FieldLabel htmlFor="price-scope">
              {pricesCopy.form.scope}
              <RequiredMark />
            </FieldLabel>
            <Select
              value={values.scope || undefined}
              onValueChange={(value: string) => setValues((current) => ({ ...current, scope: value as PriceTableFormValues["scope"] }))}
            >
              <SelectTrigger id="price-scope" aria-invalid={Boolean(errors.scope)}>
                <SelectValue placeholder={pricesCopy.form.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {priceScopeValues.map((scope) => (
                  <SelectItem key={scope} value={scope}>{priceScopeLabels[scope]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.scope ? <FieldError>{errors.scope}</FieldError> : null}
          </Field>

          {values.scope === "unit" ? (
            <>
              <Field data-invalid={Boolean(errors.unitId)}>
                <FieldLabel htmlFor="price-unit-id">
                  {pricesCopy.form.unitId}
                  <RequiredMark />
                </FieldLabel>
                <Input id="price-unit-id" value={values.unitId} onChange={updateValue("unitId")} aria-invalid={Boolean(errors.unitId)} />
                {errors.unitId ? <FieldError>{errors.unitId}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="price-unit-name">{pricesCopy.form.unitName}</FieldLabel>
                <Input id="price-unit-name" value={values.unitName} onChange={updateValue("unitName")} />
              </Field>
            </>
          ) : null}

          <Field data-invalid={Boolean(errors.amount)}>
            <FieldLabel htmlFor="price-amount">
              {pricesCopy.form.amount}
              <RequiredMark />
            </FieldLabel>
            <Input id="price-amount" aria-label={pricesCopy.form.amount} value={values.amount} onChange={updateValue("amount")} inputMode="decimal" aria-invalid={Boolean(errors.amount)} />

            {errors.amount ? <FieldError>{errors.amount}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.cycleHours)}>
            <FieldLabel htmlFor="price-cycle-hours">
              {pricesCopy.form.cycleHours}
              <RequiredMark />
            </FieldLabel>
            <Input id="price-cycle-hours" type="number" min="1" step="1" value={values.cycleHours} onChange={updateValue("cycleHours")} aria-invalid={Boolean(errors.cycleHours)} />
            {errors.cycleHours ? <FieldError>{errors.cycleHours}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.startsAt)}>
            <FieldLabel htmlFor="price-starts-at">
              {pricesCopy.form.startsAt}
              <RequiredMark />
            </FieldLabel>
            <Input id="price-starts-at" type="datetime-local" value={values.startsAt} onChange={updateValue("startsAt")} aria-invalid={Boolean(errors.startsAt)} />
            {errors.startsAt ? <FieldError>{errors.startsAt}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.endsAt)}>
            <FieldLabel htmlFor="price-ends-at">{pricesCopy.form.endsAt}</FieldLabel>
            <Input id="price-ends-at" type="datetime-local" value={values.endsAt} onChange={updateValue("endsAt")} aria-invalid={Boolean(errors.endsAt)} />
            {errors.endsAt ? <FieldError>{errors.endsAt}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.status)}>
            <FieldLabel htmlFor="price-status">
              {pricesCopy.form.status}
              <RequiredMark />
            </FieldLabel>
            <Select
              value={values.status || undefined}
              onValueChange={(value: string) => setValues((current) => ({ ...current, status: value as PriceTableFormValues["status"] }))}
            >
              <SelectTrigger id="price-status" aria-invalid={Boolean(errors.status)}>
                <SelectValue placeholder={pricesCopy.form.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {priceStatusValues.map((status) => (
                  <SelectItem key={status} value={status}>{priceStatusLabels[status]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status ? <FieldError>{errors.status}</FieldError> : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="price-notes">{pricesCopy.form.notes}</FieldLabel>
            <Textarea id="price-notes" value={values.notes} onChange={updateValue("notes")} />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {submitError ? <FieldError>{submitError}</FieldError> : null}
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)} disabled={isSaving}>
              {pricesCopy.actions.cancel}
            </Button>
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? <Spinner data-icon="inline-start" /> : null}
              {isSaving ? pricesCopy.actions.saving : pricesCopy.actions.save}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </AppDialog>
  )
}
