import { SearchIcon } from "lucide-react"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { AppInputHelp } from "@/components/shared/app-input-help"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { preventDialogCloseOnFloatingLayerInteraction } from "@/lib/dialog-interactions"

import { saveVipRule } from "@/features/rules/services/vip-rules-service"
import { rulesCopy } from "../constants"
import {
  useVipRuleCatalogs,
  type ClientOption,
  type UnitOption,
  type VehicleOption,
} from "../hooks/use-vip-rule-catalogs"
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

const RULES_FORM_ID = "rules-form"

interface VipRuleFormDialogProps {
  open: boolean
  record?: VipRuleRecord | null
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

function RequiredMark() {
  return <span aria-hidden="true" className="text-destructive">*</span>
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
  const [values, setValues] = React.useState(() => toFormValues(record))
  const [errors, setErrors] = React.useState<VipRuleFormErrors>({})
  const [isSaving, setIsSaving] = React.useState(false)
  const isSavingRef = React.useRef(false)
  const [clientQuery, setClientQuery] = React.useState("")
  const [isClientCatalogOpen, setIsClientCatalogOpen] = React.useState(false)
  const [vehicleQuery, setVehicleQuery] = React.useState("")
  const [isVehicleCatalogOpen, setIsVehicleCatalogOpen] = React.useState(false)
  const catalogs = useVipRuleCatalogs({
    clientQuery,
    open,
    targetType: values.targetType,
    vehicleQuery,
  })
  const clientOptions = catalogs.clients.options
  const vehicleOptions = catalogs.vehicles.options
  const unitOptions = catalogs.units.options

  const selectedClientOption =
    clientOptions.find((option) => option.value === values.clientId) ??
    (values.clientId
      ? {
          clientId: Number(values.clientId),
          document: null,
          label: `${values.clientId} — ${values.clientName || "Cliente selecionado"}`,
          name: values.clientName || "Cliente selecionado",
          value: values.clientId,
        }
      : null)
  const selectedVehicleOption =
    vehicleOptions.find((option) => option.value === values.vehicleId) ??
    (values.vehicleId
      ? {
          clientId: Number(values.clientId),
          clientName: values.clientName || "Cliente não informado",
          label: values.vehiclePlate
            ? `${values.vehiclePlate} — Veículo selecionado`
            : `Veículo ${values.vehicleId}`,
          plate: values.vehiclePlate,
          value: values.vehicleId,
        }
      : null)

  const selectedUnitOptions = unitOptions.filter((unit) =>
    values.unitIds
      .split(",")
      .map((unitId) => unitId.trim())
      .includes(unit.value),
  )

  function updateTextValue(key: keyof VipRuleFormValues) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [key]: event.target.value }))
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSavingRef.current) {
      return
    }

    onOpenChange(nextOpen)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSavingRef.current) {
      return
    }

    const parsed = validateVipRuleForm(values)

    if (!parsed.success) {
      setErrors(parsed.errors)
      return
    }

    setErrors({})
    isSavingRef.current = true
    setIsSaving(true)

    try {
      await saveVipRule(parsed.data)
      notify.success(rulesCopy.feedback.saveSuccess)
      onSaved()
      onOpenChange(false)
    } catch {
      notify.error(rulesCopy.feedback.saveError)
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={record ? rulesCopy.form.editTitle : rulesCopy.form.createTitle}
      description={rulesCopy.form.description}
      contentProps={{ onInteractOutside: preventDialogCloseOnFloatingLayerInteraction }}
      footer={(
        <div className="grid w-full grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="lg" disabled={isSaving} onClick={() => handleOpenChange(false)}>
            {rulesCopy.actions.cancel}
          </Button>
          <Button type="submit" form={RULES_FORM_ID} size="lg" disabled={isSaving} aria-busy={isSaving}>
            {isSaving ? <Spinner data-icon="inline-start" /> : null}
            {isSaving ? rulesCopy.actions.saving : rulesCopy.actions.save}
          </Button>
        </div>
      )}
    >
      <form id={RULES_FORM_ID} onSubmit={(event: React.FormEvent<HTMLFormElement>) => { void handleSubmit(event) }} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.type)}>
            <FieldLabel htmlFor="rule-type">
              {rulesCopy.form.type}
              <RequiredMark />
            </FieldLabel>
            <Select
              value={values.type}
              onValueChange={(value: string) => setValues((current) => ({ ...current, type: value as VipRuleFormValues["type"] }))}
              disabled={isSaving}
            >
              <SelectTrigger id="rule-type" aria-invalid={Boolean(errors.type)}>
                <SelectValue placeholder={rulesCopy.form.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {ruleTypeValues.map((type) => (
                    <SelectItem key={type} value={type}>{ruleTypeLabels[type]}</SelectItem>
                  ))}
                </SelectGroup>
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
              value={values.targetType}
              onValueChange={(value: string) => setValues((current) => ({ ...current, targetType: value as VipRuleFormValues["targetType"] }))}
              disabled={isSaving}
            >
              <SelectTrigger id="rule-target-type" aria-invalid={Boolean(errors.targetType)}>
                <SelectValue placeholder={rulesCopy.form.selectPlaceholder} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {ruleTargetTypeValues.map((targetType) => (
                    <SelectItem key={targetType} value={targetType}>{ruleTargetTypeLabels[targetType]}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.targetType ? <FieldError>{errors.targetType}</FieldError> : null}
          </Field>

          {values.targetType === "client" ? (
            <Field data-invalid={Boolean(errors.clientId)}>
              <FieldLabel htmlFor="rule-client">
                {rulesCopy.form.clientName}
                <RequiredMark />
              </FieldLabel>
              <Combobox<ClientOption>
                items={clientOptions}
                value={selectedClientOption}
                open={isClientCatalogOpen}
                onOpenChange={setIsClientCatalogOpen}
                onInputValueChange={(query, eventDetails) => {
                  if (
                    eventDetails.reason === "input-change" ||
                    eventDetails.reason === "input-clear" ||
                    eventDetails.reason === "clear-press"
                  ) {
                    setClientQuery(query)
                    setIsClientCatalogOpen(true)
                  }
                }}
                onValueChange={(client) => {
                  setValues((current) => ({
                    ...current,
                    clientId: client ? String(client.clientId) : "",
                    clientName: client?.name ?? "",
                  }))
                  setErrors((current) => ({ ...current, clientId: undefined }))
                  setIsClientCatalogOpen(false)
                }}
                isItemEqualToValue={(left, right) => left.value === right.value}
                itemToStringLabel={(client) => client.label}
                itemToStringValue={(client) =>
                  `${client.value} ${client.label} ${client.document ?? ""}`
                }
                disabled={isSaving}
              >
                <ComboboxInput
                  id="rule-client"
                  className="w-full"
                  placeholder={
                    catalogs.clients.isLoading
                      ? rulesCopy.form.catalog.searchingClients
                      : rulesCopy.form.catalog.searchClients
                  }
                  showClear={Boolean(values.clientId)}
                  aria-label={rulesCopy.form.clientName}
                  aria-invalid={Boolean(errors.clientId)}
                >
                  <InputGroupAddon>
                    {catalogs.clients.isLoading ? (
                      <Spinner aria-hidden="true" />
                    ) : (
                      <SearchIcon data-icon="inline-start" aria-hidden="true" />
                    )}
                  </InputGroupAddon>
                </ComboboxInput>
                <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                  <ComboboxEmpty>
                    {clientQuery.trim().length < 2
                      ? rulesCopy.form.catalog.minQuery
                      : catalogs.clients.isLoading
                        ? rulesCopy.form.catalog.searchingClients
                        : catalogs.clients.isUnavailable
                          ? rulesCopy.form.catalog.clientsUnavailable
                          : rulesCopy.form.catalog.clientsEmpty}
                  </ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(client: ClientOption) => (
                        <ComboboxItem key={client.value} value={client}>
                          <span className="min-w-0 flex-1 truncate">{client.label}</span>
                          {client.document ? (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {client.document}
                            </span>
                          ) : null}
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {errors.clientId ? <FieldError>{errors.clientId}</FieldError> : null}
            </Field>
          ) : null}

          {values.targetType === "vehicle" ? (
            <Field data-invalid={Boolean(errors.vehicleId)}>
              <FieldLabel htmlFor="rule-vehicle">
                {rulesCopy.form.vehicle}
                <RequiredMark />
              </FieldLabel>
              <Combobox<VehicleOption>
                items={vehicleOptions}
                value={selectedVehicleOption}
                open={isVehicleCatalogOpen}
                onOpenChange={setIsVehicleCatalogOpen}
                onInputValueChange={(query, eventDetails) => {
                  if (
                    eventDetails.reason === "input-change" ||
                    eventDetails.reason === "input-clear" ||
                    eventDetails.reason === "clear-press"
                  ) {
                    setVehicleQuery(query)
                    setIsVehicleCatalogOpen(true)
                  }
                }}
                onValueChange={(vehicle) => {
                  setValues((current) => ({
                    ...current,
                    clientId: vehicle ? String(vehicle.clientId) : "",
                    clientName: vehicle?.clientName ?? "",
                    vehicleId: vehicle?.value ?? "",
                    vehiclePlate: vehicle?.plate ?? "",
                  }))
                  setErrors((current) => ({ ...current, vehicleId: undefined }))
                  setIsVehicleCatalogOpen(false)
                }}
                isItemEqualToValue={(left, right) => left.value === right.value}
                itemToStringLabel={(vehicle) => vehicle.label}
                itemToStringValue={(vehicle) =>
                  `${vehicle.value} ${vehicle.label} ${vehicle.clientName}`
                }
                disabled={isSaving}
              >
                <ComboboxInput
                  id="rule-vehicle"
                  className="w-full"
                  placeholder={
                    catalogs.vehicles.isLoading
                      ? rulesCopy.form.catalog.searchingVehicles
                      : rulesCopy.form.catalog.searchVehicles
                  }
                  showClear={Boolean(values.vehicleId)}
                  aria-label={rulesCopy.form.vehicle}
                  aria-invalid={Boolean(errors.vehicleId)}
                >
                  <InputGroupAddon>
                    {catalogs.vehicles.isLoading ? (
                      <Spinner aria-hidden="true" />
                    ) : (
                      <SearchIcon data-icon="inline-start" aria-hidden="true" />
                    )}
                  </InputGroupAddon>
                </ComboboxInput>
                <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                  <ComboboxEmpty>
                    {vehicleQuery.trim().length < 2
                      ? rulesCopy.form.catalog.minQuery
                      : catalogs.vehicles.isLoading
                        ? rulesCopy.form.catalog.searchingVehicles
                        : catalogs.vehicles.isUnavailable
                          ? rulesCopy.form.catalog.vehiclesUnavailable
                          : rulesCopy.form.catalog.vehiclesEmpty}
                  </ComboboxEmpty>
                  <ComboboxList>
                    <ComboboxCollection>
                      {(vehicle: VehicleOption) => (
                        <ComboboxItem key={vehicle.value} value={vehicle}>
                          <span className="min-w-0 flex-1 truncate">{vehicle.label}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {vehicle.clientName}
                          </span>
                        </ComboboxItem>
                      )}
                    </ComboboxCollection>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {errors.vehicleId ? <FieldError>{errors.vehicleId}</FieldError> : null}
            </Field>
          ) : null}

          <Field>
            <FieldLabel htmlFor="rule-all-units">{rulesCopy.form.appliesToAllUnits}</FieldLabel>
            <Checkbox
              id="rule-all-units"
              checked={values.appliesToAllUnits}
              onCheckedChange={(checked: boolean | "indeterminate") => setValues((current) => ({ ...current, appliesToAllUnits: checked === true }))}
              disabled={isSaving}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="rule-active">{rulesCopy.form.active}</FieldLabel>
            <Checkbox
              id="rule-active"
              checked={values.active}
              onCheckedChange={(checked: boolean | "indeterminate") => setValues((current) => ({ ...current, active: checked === true }))}
              disabled={isSaving}
            />
          </Field>

          {!values.appliesToAllUnits ? (
            <Field data-invalid={Boolean(errors.unitIds)}>
              <FieldLabel htmlFor="rule-units">
                {rulesCopy.form.unitIds}
                <RequiredMark />
              </FieldLabel>
              <Combobox
                items={unitOptions}
                multiple
                modal={false}
                value={selectedUnitOptions}
                onValueChange={(units: UnitOption[]) => {
                  setValues((current) => ({
                    ...current,
                    unitIds: units.map((unit) => unit.value).join(", "),
                  }))
                  setErrors((current) => ({ ...current, unitIds: undefined }))
                }}
                isItemEqualToValue={(left: UnitOption, right: UnitOption) =>
                  left.value === right.value
                }
                itemToStringLabel={(unit: UnitOption) => unit.label}
                itemToStringValue={(unit: UnitOption) =>
                  `${unit.value} ${unit.label}`
                }
                disabled={isSaving || catalogs.units.isLoading}
              >
                <ComboboxChips
                  showClear={selectedUnitOptions.length > 0}
                  disabled={isSaving || catalogs.units.isLoading}
                >
                  <ComboboxValue>
                    {selectedUnitOptions.map((unit) => (
                      <ComboboxChip key={unit.value}>{unit.label}</ComboboxChip>
                    ))}
                  </ComboboxValue>
                  <ComboboxChipsInput
                    id="rule-units"
                    placeholder={
                      catalogs.units.isLoading
                        ? rulesCopy.form.catalog.loading
                        : rulesCopy.form.selectPlaceholder
                    }
                    aria-label={rulesCopy.form.unitIds}
                    aria-invalid={Boolean(errors.unitIds)}
                    disabled={isSaving || catalogs.units.isLoading}
                  />
                </ComboboxChips>
                <ComboboxContent>
                  <ComboboxEmpty>
                    {catalogs.units.isUnavailable
                      ? rulesCopy.form.catalog.unitsUnavailable
                      : rulesCopy.form.catalog.unitsEmpty}
                  </ComboboxEmpty>
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
              {errors.unitIds ? <FieldError>{errors.unitIds}</FieldError> : null}
            </Field>
          ) : null}

          {values.type === "fuel" ? (
            <Field data-invalid={Boolean(errors.fuelMinLiters)}>
              <FieldLabel htmlFor="rule-fuel-min-liters">
                {rulesCopy.form.fuelMinLiters}
                <RequiredMark />
              </FieldLabel>
              <InputGroup>
                <InputGroupInput id="rule-fuel-min-liters" value={values.fuelMinLiters} onChange={updateTextValue("fuelMinLiters")} inputMode="decimal" aria-invalid={Boolean(errors.fuelMinLiters)} disabled={isSaving} />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>L</InputGroupText>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <AppInputHelp title={rulesCopy.form.fuelMinLiters} description={rulesCopy.form.help.fuelMinLiters} />
                </InputGroupAddon>
              </InputGroup>
              {errors.fuelMinLiters ? <FieldError>{errors.fuelMinLiters}</FieldError> : null}
            </Field>
          ) : null}

          {values.type === "vip" ? (
            <Field data-invalid={Boolean(errors.benefitHours)}>
              <FieldLabel htmlFor="rule-benefit-hours">
                {rulesCopy.form.benefitHours}
                <RequiredMark />
              </FieldLabel>
              <InputGroup>
                <InputGroupInput id="rule-benefit-hours" value={values.benefitHours} onChange={updateTextValue("benefitHours")} inputMode="decimal" aria-invalid={Boolean(errors.benefitHours)} disabled={isSaving} />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>h</InputGroupText>
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                  <AppInputHelp title={rulesCopy.form.benefitHours} description={rulesCopy.form.help.benefitHours} />
                </InputGroupAddon>
              </InputGroup>
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
                <InputGroup>
                  <InputGroupInput id="rule-yard-occupancy" value={values.yardOccupancyThreshold} onChange={updateTextValue("yardOccupancyThreshold")} inputMode="numeric" aria-invalid={Boolean(errors.yardOccupancyThreshold)} disabled={isSaving} />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>%</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <AppInputHelp title={rulesCopy.form.yardOccupancyThreshold} description={rulesCopy.form.help.yardOccupancyThreshold} />
                  </InputGroupAddon>
                </InputGroup>
                {errors.yardOccupancyThreshold ? <FieldError>{errors.yardOccupancyThreshold}</FieldError> : null}
              </Field>
              <Field data-invalid={Boolean(errors.yardStaleVehicleHours)}>
                <FieldLabel htmlFor="rule-yard-stale">
                  {rulesCopy.form.yardStaleVehicleHours}
                  <RequiredMark />
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput id="rule-yard-stale" value={values.yardStaleVehicleHours} onChange={updateTextValue("yardStaleVehicleHours")} inputMode="decimal" aria-invalid={Boolean(errors.yardStaleVehicleHours)} disabled={isSaving} />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>h</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    <AppInputHelp title={rulesCopy.form.yardStaleVehicleHours} description={rulesCopy.form.help.yardStaleVehicleHours} />
                  </InputGroupAddon>
                </InputGroup>
                {errors.yardStaleVehicleHours ? <FieldError>{errors.yardStaleVehicleHours}</FieldError> : null}
              </Field>
            </>
          ) : null}

          <Field>
            <FieldLabel htmlFor="rule-notes">{rulesCopy.form.notes}</FieldLabel>
            <Textarea id="rule-notes" value={values.notes} onChange={updateTextValue("notes")} disabled={isSaving} />
          </Field>
        </FieldGroup>
      </form>
    </AppDialog>
  )
}
