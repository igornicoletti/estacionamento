import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { listClients } from "@/features/clients"

import {
  saveVipRule,
} from "@/features/rules/services/vip-rules-service"
import { rulesCopy } from "../constants"
import {
  createEmptyVipRuleFormValues,
  createVipRuleFormValues,
  ruleTargetTypeLabels,
  ruleTargetTypeValues,
  ruleTypeLabels,
  ruleTypeValues,
  validateVipRuleForm,
  type VipRuleFormErrors,
  type VipRuleFormValues,
  type VipRuleRecord,
} from "../model"

interface VipRuleFormDialogProps {
  open: boolean
  record?: VipRuleRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

interface ClientOption {
  value: string
  label: string
  clientId: number
}

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

function toFormValues(record: VipRuleRecord | null | undefined): VipRuleFormValues {
  if (!record) {
    return createEmptyVipRuleFormValues()
  }

  return createVipRuleFormValues({
    id: record.id,
    type: record.type,
    targetType: record.targetType,
    clientId: record.clientId ? String(record.clientId) : "",
    clientName: record.clientName ?? "",
    vehicleId: record.vehicleId ? String(record.vehicleId) : "",
    vehiclePlate: record.vehiclePlate ?? "",
    unitIds: record.unitIds.join(", "),
    appliesToAllUnits: record.appliesToAllUnits,
    active: record.active,
    fuelMinLiters: record.fuelMinLiters === null ? "" : String(record.fuelMinLiters),
    benefitHours: record.benefitHours === null ? "" : String(record.benefitHours),
    yardOccupancyThreshold: record.yardOccupancyThreshold === null ? "" : String(record.yardOccupancyThreshold),
    yardStaleVehicleHours: record.yardStaleVehicleHours === null ? "" : String(record.yardStaleVehicleHours),
    notes: record.notes ?? "",
  })
}

export function VipRuleFormDialog({
  open,
  record,
  onOpenChange,
  onSaved,
}: VipRuleFormDialogProps) {
  const dialogStateKey = record?.id ?? (open ? "create" : "closed")
  const [values, setValues] = React.useState(() => toFormValues(record))
  const [errors, setErrors] = React.useState<VipRuleFormErrors>({})
  const [isSaving, setIsSaving] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [clientOptions, setClientOptions] = React.useState<readonly ClientOption[]>([])

  React.useEffect(() => {
    let isMounted = true

    async function loadClientOptions() {
      try {
        const clients = await listClients()

        if (!isMounted) {
          return
        }

        setClientOptions(
          clients.map((client) => ({
            value: String(client.cod_pessoa),
            label: client.nom_fantasia,
            clientId: client.cod_pessoa,
          }))
        )
      } catch {
        if (isMounted) {
          setClientOptions([])
        }
      }
    }

    if (open) {
      void loadClientOptions()
    }

    return () => {
      isMounted = false
    }
  }, [open])
  function updateTextValue(key: keyof VipRuleFormValues) {
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

    const parsed = validateVipRuleForm(values)

    if (!parsed.success) {
      setErrors(parsed.errors)
      return
    }

    setErrors({})
    setSubmitError(null)
    setIsSaving(true)

    try {
      await saveVipRule(parsed.data)
      notify.success(rulesCopy.feedback.saveSuccess)
      onSaved()
      onOpenChange(false)
    } catch {
      setSubmitError(rulesCopy.feedback.saveError)
      notify.error(rulesCopy.feedback.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppDialog
      key={dialogStateKey}
      open={open}
      onOpenChange={onOpenChange}
      title={record ? rulesCopy.form.editTitle : rulesCopy.form.createTitle}
      description={rulesCopy.form.description}
    >
      <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => void handleSubmit(event)} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.type)}>
            <FieldLabel htmlFor="rule-type">
              {rulesCopy.form.type}
              <RequiredMark />
            </FieldLabel>
            <Select
              value={values.type || undefined}
              onValueChange={(value: string) => setValues((current) => ({ ...current, type: value as VipRuleFormValues["type"] }))}
            >
              <SelectTrigger id="rule-type" aria-invalid={Boolean(errors.type)}>
                <SelectValue placeholder={rulesCopy.form.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {ruleTypeValues.map((type) => (
                  <SelectItem key={type} value={type}>{ruleTypeLabels[type]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type ? <FieldError>{errors.type}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.targetType)}>
            <FieldLabel htmlFor="rule-target-type">
              {rulesCopy.form.targetType}
              <RequiredMark />
            </FieldLabel>
            <Select
              value={values.targetType || undefined}
              onValueChange={(value: string) => setValues((current) => ({ ...current, targetType: value as VipRuleFormValues["targetType"] }))}
            >
              <SelectTrigger id="rule-target-type" aria-invalid={Boolean(errors.targetType)}>
                <SelectValue placeholder={rulesCopy.form.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {ruleTargetTypeValues.map((targetType) => (
                  <SelectItem key={targetType} value={targetType}>{ruleTargetTypeLabels[targetType]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.targetType ? <FieldError>{errors.targetType}</FieldError> : null}
          </Field>

          {values.targetType === "client" ? (
            <>
              <Field data-invalid={Boolean(errors.clientId)}>
                <FieldLabel htmlFor="rule-client-name">
                  {rulesCopy.form.clientName}
                  <RequiredMark />
                </FieldLabel>
                <Combobox<ClientOption>
                  items={clientOptions}
                  value={clientOptions.find((option) => option.value === values.clientId) ?? null}
                  onValueChange={(value: ClientOption | ClientOption[] | null) => {
                    const selectedOption = Array.isArray(value) ? value[0] ?? null : value

                    setValues((current) => ({
                      ...current,
                      clientId: selectedOption ? String(selectedOption.clientId) : "",
                      clientName: selectedOption?.label ?? "",
                    }))
                    setErrors((current) => ({ ...current, clientId: undefined }))
                    setSubmitError(null)
                  }}
                  itemToStringLabel={(client: ClientOption) => client.label}
                  itemToStringValue={(client: ClientOption) => `${client.value} ${client.label}`}
                  disabled={isSaving}
                >
                  <ComboboxInput
                    id="rule-client-name"
                    className="h-9 w-full"
                    placeholder={rulesCopy.form.selectPlaceholder}
                    aria-label={rulesCopy.form.clientName}
                    aria-invalid={Boolean(errors.clientId)}
                  >
                    <InputGroupAddon>
                      <span className="text-xs text-muted-foreground">ID</span>
                    </InputGroupAddon>
                  </ComboboxInput>
                  <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                    <ComboboxEmpty>Nenhum cliente encontrado.</ComboboxEmpty>
                    <ComboboxList>
                      <ComboboxCollection>
                        {(client: ClientOption) => (
                          <ComboboxItem key={client.value} value={client}>
                            {client.label}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {errors.clientId ? <FieldError>{errors.clientId}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="rule-client-id">{rulesCopy.form.clientId}</FieldLabel>
                <Input id="rule-client-id" value={values.clientId} onChange={updateTextValue("clientId")} inputMode="numeric" />
              </Field>
            </>
          ) : null}

          {values.targetType === "vehicle" ? (
            <>
              <Field data-invalid={Boolean(errors.vehicleId)}>
                <FieldLabel htmlFor="rule-vehicle-id">
                  {rulesCopy.form.vehicleId}
                  <RequiredMark />
                </FieldLabel>
                <Input id="rule-vehicle-id" value={values.vehicleId} onChange={updateTextValue("vehicleId")} inputMode="numeric" aria-invalid={Boolean(errors.vehicleId)} />
                {errors.vehicleId ? <FieldError>{errors.vehicleId}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="rule-vehicle-plate">{rulesCopy.form.vehiclePlate}</FieldLabel>
                <Input id="rule-vehicle-plate" value={values.vehiclePlate} onChange={updateTextValue("vehiclePlate")} />
              </Field>
            </>
          ) : null}

          <Field>
            <FieldLabel htmlFor="rule-all-units">{rulesCopy.form.appliesToAllUnits}</FieldLabel>
            <Checkbox
              id="rule-all-units"
              checked={values.appliesToAllUnits}
              onCheckedChange={(checked: boolean | "indeterminate") => setValues((current) => ({ ...current, appliesToAllUnits: checked === true }))}
            />
          </Field>

          {!values.appliesToAllUnits ? (
            <Field data-invalid={Boolean(errors.unitIds)}>
              <FieldLabel htmlFor="rule-unit-ids">
                {rulesCopy.form.unitIds}
                <RequiredMark />
              </FieldLabel>
              <Input id="rule-unit-ids" value={values.unitIds} onChange={updateTextValue("unitIds")} aria-invalid={Boolean(errors.unitIds)} />
              {errors.unitIds ? <FieldError>{errors.unitIds}</FieldError> : null}
            </Field>
          ) : null}

          {values.type === "fuel" ? (
            <Field data-invalid={Boolean(errors.fuelMinLiters)}>
              <FieldLabel htmlFor="rule-fuel-min-liters">
                {rulesCopy.form.fuelMinLiters}
                <RequiredMark />
              </FieldLabel>
              <Input id="rule-fuel-min-liters" value={values.fuelMinLiters} onChange={updateTextValue("fuelMinLiters")} inputMode="decimal" aria-invalid={Boolean(errors.fuelMinLiters)} />
              {errors.fuelMinLiters ? <FieldError>{errors.fuelMinLiters}</FieldError> : null}
            </Field>
          ) : null}

          {values.type === "vip" ? (
            <Field data-invalid={Boolean(errors.benefitHours)}>
              <FieldLabel htmlFor="rule-benefit-hours">
                {rulesCopy.form.benefitHours}
                <RequiredMark />
              </FieldLabel>
              <Input id="rule-benefit-hours" value={values.benefitHours} onChange={updateTextValue("benefitHours")} inputMode="decimal" aria-invalid={Boolean(errors.benefitHours)} />
              {errors.benefitHours ? <FieldError>{errors.benefitHours}</FieldError> : null}
            </Field>
          ) : null}

          {values.type === "yard_cleaning" ? (
            <>
              <Field data-invalid={Boolean(errors.yardOccupancyThreshold)}>
                <FieldLabel htmlFor="rule-yard-occupancy">
                  {rulesCopy.form.yardOccupancyThreshold}
                  <RequiredMark />
                </FieldLabel>
                <Input id="rule-yard-occupancy" value={values.yardOccupancyThreshold} onChange={updateTextValue("yardOccupancyThreshold")} inputMode="numeric" aria-invalid={Boolean(errors.yardOccupancyThreshold)} />
                {errors.yardOccupancyThreshold ? <FieldError>{errors.yardOccupancyThreshold}</FieldError> : null}
              </Field>
              <Field data-invalid={Boolean(errors.yardStaleVehicleHours)}>
                <FieldLabel htmlFor="rule-yard-stale">
                  {rulesCopy.form.yardStaleVehicleHours}
                  <RequiredMark />
                </FieldLabel>
                <Input id="rule-yard-stale" value={values.yardStaleVehicleHours} onChange={updateTextValue("yardStaleVehicleHours")} inputMode="decimal" aria-invalid={Boolean(errors.yardStaleVehicleHours)} />
                {errors.yardStaleVehicleHours ? <FieldError>{errors.yardStaleVehicleHours}</FieldError> : null}
              </Field>
            </>
          ) : null}

          <Field>
            <FieldLabel htmlFor="rule-notes">{rulesCopy.form.notes}</FieldLabel>
            <Textarea id="rule-notes" value={values.notes} onChange={updateTextValue("notes")} />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {submitError ? <FieldError>{submitError}</FieldError> : null}
            <Button type="button" variant="outline" size="lg" onClick={() => onOpenChange(false)} disabled={isSaving}>
              {rulesCopy.actions.cancel}
            </Button>
            <Button type="submit" size="lg" disabled={isSaving}>
              {isSaving ? <Spinner data-icon="inline-start" /> : null}
              {isSaving ? rulesCopy.actions.saving : rulesCopy.actions.save}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </AppDialog>
  )
}
