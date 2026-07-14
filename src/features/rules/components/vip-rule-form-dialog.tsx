import * as React from "react"
import { SearchIcon } from "lucide-react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Button } from "@/components/ui/button"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { listClientsSnapshot } from "@/features/clients"
import { useUnits } from "@/features/units"
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { rulesCopy } from "../rules-copy"
import {
  type CommercialRuleType,
  type RuleUnitScope,
  type SaveVipRuleInput,
  type VipRuleTargetType,
} from "../types/vip-rules-types"

interface VipRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: SaveVipRuleInput) => Promise<void>
}

type RuleFormTimeUnit = "days" | "hours"

type RuleFormErrors = Partial<Record<
  | "benefitHours"
  | "clientId"
  | "clientName"
  | "fuelMinLiters"
  | "reason"
  | "unitIds"
  | "vehicleId"
  | "vehiclePlate"
  | "yardOccupancyThreshold"
  | "yardStaleVehicleHours",
  string
>>

interface ClientOption {
  id: number
  value: string
  label: string
}

interface VehicleOption {
  id: number
  clientId: number
  value: string
  label: string
  plate: string
}

interface UnitOption {
  value: string
  label: string
}

const initialRuleType: CommercialRuleType = "vip"
const initialTargetType: VipRuleTargetType = "client"

function readPositiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."))

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function readPositiveInteger(value: string) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
}

function toHours(value: string, unit: RuleFormTimeUnit) {
  const parsed = readPositiveNumber(value)

  return unit === "days" ? parsed * 24 : parsed
}

export function VipRuleFormDialog({
  open,
  onOpenChange,
  isSaving,
  onSubmit,
}: VipRuleFormDialogProps) {
  const [ruleType, setRuleType] = React.useState<CommercialRuleType>(initialRuleType)
  const [targetType, setTargetType] = React.useState<VipRuleTargetType>(initialTargetType)
  const [clientId, setClientId] = React.useState("")
  const [clientName, setClientName] = React.useState("")
  const [vehicleId, setVehicleId] = React.useState("")
  const [vehiclePlate, setVehiclePlate] = React.useState("")
  const [scope, setScope] = React.useState<RuleUnitScope>("network")
  const [unitIds, setUnitIds] = React.useState<string[]>([])
  const [active, setActive] = React.useState("true")
  const [fuelMinLiters, setFuelMinLiters] = React.useState("")
  const [benefitHours, setBenefitHours] = React.useState("")
  const [yardOccupancyThreshold, setYardOccupancyThreshold] = React.useState("")
  const [yardStaleVehicleAmount, setYardStaleVehicleAmount] = React.useState("")
  const [yardStaleVehicleUnit, setYardStaleVehicleUnit] =
    React.useState<RuleFormTimeUnit>("hours")
  const [reason, setReason] = React.useState("")
  const [errors, setErrors] = React.useState<RuleFormErrors>({})
  const clientsSnapshot = useAsyncSnapshot({
    cacheKey: "rules:vip-form-clients:v2",
    errorMessage: rulesCopy.feedback.loadError,
    initialData: { clients: [], vehicles: [] },
    loadData: listClientsSnapshot,
  })
  const unitsSnapshot = useUnits()
  const clientOptions = React.useMemo<ClientOption[]>(
    () =>
      clientsSnapshot.data.clients.map((client) => ({
        id: client.cod_pessoa,
        label: client.nom_fantasia || client.nom_pessoa || String(client.cod_pessoa),
        value: String(client.cod_pessoa),
      })),
    [clientsSnapshot.data.clients]
  )
  const selectedClient = React.useMemo(
    () => clientOptions.find((client) => client.value === clientId) ?? null,
    [clientId, clientOptions]
  )
  const vehicleOptions = React.useMemo<VehicleOption[]>(
    () =>
      clientsSnapshot.data.vehicles
        .filter((vehicle) => !clientId || String(vehicle.cod_pessoa) === clientId)
        .map((vehicle) => ({
          clientId: vehicle.cod_pessoa,
          id: vehicle.cod_veiculo,
          label: `${vehicle.num_placa} - ${vehicle.des_veiculo || vehicle.nom_motorista || vehicle.nom_pessoa}`,
          plate: vehicle.num_placa,
          value: String(vehicle.cod_veiculo),
        })),
    [clientId, clientsSnapshot.data.vehicles]
  )
  const selectedVehicle = React.useMemo(
    () => vehicleOptions.find((vehicle) => vehicle.value === vehicleId) ?? null,
    [vehicleId, vehicleOptions]
  )
  const unitOptions = React.useMemo<UnitOption[]>(
    () =>
      unitsSnapshot.data.map((unit) => ({
        label: unit.nom_fantasia || unit.nom_razao_social || String(unit.cod_empresa),
        value: String(unit.cod_empresa),
      })),
    [unitsSnapshot.data]
  )
  const selectedUnits = React.useMemo(
    () => unitOptions.filter((unit) => unitIds.includes(unit.value)),
    [unitIds, unitOptions]
  )
  const requiresUnits =
    ruleType === "yard_cleaning_occupancy" || scope === "unit"

  function resetForm() {
    setRuleType(initialRuleType)
    setTargetType(initialTargetType)
    setClientId("")
    setClientName("")
    setVehicleId("")
    setVehiclePlate("")
    setScope("network")
    setUnitIds([])
    setActive("true")
    setFuelMinLiters("")
    setBenefitHours("")
    setYardOccupancyThreshold("")
    setYardStaleVehicleAmount("")
    setYardStaleVehicleUnit("hours")
    setReason("")
    setErrors({})
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      resetForm()
    }
  }

  function validate() {
    const nextErrors: RuleFormErrors = {}

    if (ruleType === "vip") {
      if (readPositiveInteger(clientId) <= 0) {
        nextErrors.clientId = rulesCopy.form.validation.clientId
      }

      if (clientName.trim().length === 0) {
        nextErrors.clientName = rulesCopy.form.validation.clientName
      }

      if (targetType === "vehicle") {
        if (readPositiveInteger(vehicleId) <= 0) {
          nextErrors.vehicleId = rulesCopy.form.validation.vehicleId
        }

        if (vehiclePlate.trim().length === 0) {
          nextErrors.vehiclePlate = rulesCopy.form.validation.vehiclePlate
        }
      }
    }

    if (requiresUnits && unitIds.length === 0) {
      nextErrors.unitIds = rulesCopy.form.validation.unitIds
    }

    if (ruleType === "fuel_benefit") {
      if (readPositiveNumber(fuelMinLiters) <= 0) {
        nextErrors.fuelMinLiters = rulesCopy.form.validation.fuelMinLiters
      }

      if (readPositiveNumber(benefitHours) <= 0) {
        nextErrors.benefitHours = rulesCopy.form.validation.benefitHours
      }
    }

    if (
      ruleType === "yard_cleaning_occupancy" &&
      readPositiveInteger(yardOccupancyThreshold) <= 0
    ) {
      nextErrors.yardOccupancyThreshold =
        rulesCopy.form.validation.yardOccupancyThreshold
    }

    if (
      ruleType === "yard_cleaning_stale_vehicle" &&
      toHours(yardStaleVehicleAmount, yardStaleVehicleUnit) <= 0
    ) {
      nextErrors.yardStaleVehicleHours =
        rulesCopy.form.validation.yardStaleVehicleHours
    }

    if (reason.trim().length < 10) {
      nextErrors.reason = rulesCopy.form.validation.reason
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

    const common = {
      active: active === "true",
      notes: null,
      reason,
    }

    if (ruleType === "vip") {
      await onSubmit({
        ...common,
        ruleType,
        targetType,
        clientId: readPositiveInteger(clientId),
        clientName,
        vehicleId: targetType === "vehicle" ? readPositiveInteger(vehicleId) : null,
        vehiclePlate: targetType === "vehicle" ? vehiclePlate : null,
        appliesToAllUnits: scope === "network",
        unitIds: scope === "network" ? [] : unitIds,
      })
    }

    if (ruleType === "fuel_benefit") {
      await onSubmit({
        ...common,
        ruleType,
        scope,
        unitIds: scope === "network" ? [] : unitIds,
        fuelMinLiters: readPositiveNumber(fuelMinLiters),
        benefitHours: readPositiveNumber(benefitHours),
      })
    }

    if (ruleType === "yard_cleaning_occupancy") {
      await onSubmit({
        ...common,
        ruleType,
        unitIds,
        yardOccupancyThreshold: readPositiveInteger(yardOccupancyThreshold),
      })
    }

    if (ruleType === "yard_cleaning_stale_vehicle") {
      await onSubmit({
        ...common,
        ruleType,
        scope,
        unitIds: scope === "network" ? [] : unitIds,
        yardStaleVehicleHours: toHours(yardStaleVehicleAmount, yardStaleVehicleUnit),
      })
    }

    handleOpenChange(false)
  }

  function renderUnitsField() {
    if (!requiresUnits) {
      return null
    }

    return (
      <Field data-invalid={Boolean(errors.unitIds)}>
        <FieldLabel htmlFor="rule-unit-ids">{rulesCopy.form.unitIds}</FieldLabel>
        <Combobox<UnitOption, true>
          items={unitOptions}
          multiple
          value={selectedUnits}
          onValueChange={(value) => {
            const selectedOptions = Array.isArray(value) ? value : value ? [value] : []

            setUnitIds(selectedOptions.map((unit) => unit.value))
            setErrors((state) => ({ ...state, unitIds: undefined }))
          }}
          itemToStringLabel={(unit) => unit.label}
          itemToStringValue={(unit) => `${unit.value} ${unit.label}`}
          disabled={isSaving || unitsSnapshot.isLoading}
        >
          <ComboboxChips
            data-no-drag-scroll="true"
            className="min-h-9 w-full"
            aria-invalid={Boolean(errors.unitIds)}
          >
            <ComboboxValue>
              {selectedUnits.map((unit) => (
                <ComboboxChip key={unit.value}>{unit.label}</ComboboxChip>
              ))}
            </ComboboxValue>
            <ComboboxChipsInput
              id="rule-unit-ids"
              placeholder={rulesCopy.form.unitPlaceholder}
              disabled={isSaving || unitsSnapshot.isLoading}
            />
          </ComboboxChips>
          <ComboboxContent data-no-drag-scroll="true" className="w-(--anchor-width) min-w-(--anchor-width)">
            <ComboboxEmpty>{rulesCopy.form.unitEmpty}</ComboboxEmpty>
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
        <p className="text-xs text-muted-foreground">{rulesCopy.form.unitIdsHint}</p>
      </Field>
    )
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={rulesCopy.form.title}
      description={rulesCopy.form.description}
      footerClassName="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:justify-stretch"
      footer={(
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isSaving}
            onClick={() => handleOpenChange(false)}
          >
            {rulesCopy.actions.cancel}
          </Button>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSaving}
            form="commercial-rule-form"
          >
            {rulesCopy.actions.save}
          </Button>
        </>
      )}
    >
      <form id="commercial-rule-form" className="grid gap-4" onSubmit={(event) => { void handleSubmit(event) }}>
        <Field>
          <FieldLabel>{rulesCopy.form.ruleType}</FieldLabel>
          <Select
            value={ruleType}
            onValueChange={(value: CommercialRuleType) => {
              setRuleType(value)
              setScope(value === "yard_cleaning_occupancy" ? "unit" : "network")
              setUnitIds([])
              setErrors({})
            }}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={rulesCopy.form.ruleTypePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vip">{rulesCopy.labels.vip}</SelectItem>
              <SelectItem value="fuel_benefit">{rulesCopy.labels.fuelBenefit}</SelectItem>
              <SelectItem value="yard_cleaning_occupancy">{rulesCopy.labels.yardCleaningOccupancy}</SelectItem>
              <SelectItem value="yard_cleaning_stale_vehicle">{rulesCopy.labels.yardCleaningStaleVehicle}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {ruleType === "vip" ? (
          <>
            <Field>
              <FieldLabel>{rulesCopy.form.targetType}</FieldLabel>
              <Select
                value={targetType}
                onValueChange={(value: VipRuleTargetType) => {
                  setTargetType(value)
                  if (value === "client") {
                    setVehicleId("")
                    setVehiclePlate("")
                  }
                  setErrors({})
                }}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={rulesCopy.form.targetPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">{rulesCopy.labels.client}</SelectItem>
                  <SelectItem value="vehicle">{rulesCopy.labels.vehicle}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={Boolean(errors.clientId || errors.clientName)}>
              <FieldLabel htmlFor="rule-client">{rulesCopy.form.clientName}</FieldLabel>
              <Combobox<ClientOption>
                items={clientOptions}
                value={selectedClient}
                onValueChange={(value: ClientOption | ClientOption[] | null) => {
                  const selectedOption = Array.isArray(value) ? value[0] ?? null : value

                  setClientId(selectedOption?.value ?? "")
                  setClientName(selectedOption?.label ?? "")
                  setVehicleId("")
                  setVehiclePlate("")
                  setErrors((state) => ({
                    ...state,
                    clientId: undefined,
                    clientName: undefined,
                    vehicleId: undefined,
                    vehiclePlate: undefined,
                  }))
                }}
                itemToStringLabel={(client) => client.label}
                itemToStringValue={(client) => `${client.value} ${client.label}`}
                disabled={isSaving || clientsSnapshot.isLoading}
              >
                <ComboboxInput
                  id="rule-client"
                  className="h-9 w-full"
                  placeholder={rulesCopy.form.clientPlaceholder}
                  disabled={isSaving || clientsSnapshot.isLoading}
                  aria-invalid={Boolean(errors.clientId || errors.clientName)}
                >
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                </ComboboxInput>
                <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                  <ComboboxEmpty>{rulesCopy.form.clientEmpty}</ComboboxEmpty>
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
              {errors.clientName && !errors.clientId ? (
                <FieldError>{errors.clientName}</FieldError>
              ) : null}
            </Field>

            {targetType === "vehicle" ? (
              <Field data-invalid={Boolean(errors.vehicleId || errors.vehiclePlate)}>
                <FieldLabel htmlFor="rule-vehicle">{rulesCopy.form.vehiclePlate}</FieldLabel>
                <Combobox<VehicleOption>
                  items={vehicleOptions}
                  value={selectedVehicle}
                  onValueChange={(value: VehicleOption | VehicleOption[] | null) => {
                    const selectedOption = Array.isArray(value) ? value[0] ?? null : value

                    setVehicleId(selectedOption?.value ?? "")
                    setVehiclePlate(selectedOption?.plate ?? "")
                    setErrors((state) => ({
                      ...state,
                      vehicleId: undefined,
                      vehiclePlate: undefined,
                    }))
                  }}
                  itemToStringLabel={(vehicle) => vehicle.label}
                  itemToStringValue={(vehicle) => `${vehicle.value} ${vehicle.label}`}
                  disabled={isSaving || clientsSnapshot.isLoading || !clientId}
                >
                  <ComboboxInput
                    id="rule-vehicle"
                    className="h-9 w-full"
                    placeholder={rulesCopy.form.vehiclePlaceholder}
                    disabled={isSaving || clientsSnapshot.isLoading || !clientId}
                    aria-invalid={Boolean(errors.vehicleId || errors.vehiclePlate)}
                  >
                    <InputGroupAddon>
                      <SearchIcon />
                    </InputGroupAddon>
                  </ComboboxInput>
                  <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                    <ComboboxEmpty>{rulesCopy.form.vehicleEmpty}</ComboboxEmpty>
                    <ComboboxList>
                      <ComboboxCollection>
                        {(vehicle: VehicleOption) => (
                          <ComboboxItem key={vehicle.value} value={vehicle}>
                            {vehicle.label}
                          </ComboboxItem>
                        )}
                      </ComboboxCollection>
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {errors.vehicleId ? <FieldError>{errors.vehicleId}</FieldError> : null}
                {errors.vehiclePlate && !errors.vehicleId ? (
                  <FieldError>{errors.vehiclePlate}</FieldError>
                ) : null}
              </Field>
            ) : null}
          </>
        ) : null}

        {ruleType !== "yard_cleaning_occupancy" ? (
          <Field>
            <FieldLabel>{rulesCopy.form.scope}</FieldLabel>
            <Select
              value={scope}
              onValueChange={(value: RuleUnitScope) => {
                setScope(value)
                if (value === "network") {
                  setUnitIds([])
                }
                setErrors((state) => ({ ...state, unitIds: undefined }))
              }}
              disabled={isSaving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={rulesCopy.form.scopePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="network">{rulesCopy.labels.network}</SelectItem>
                <SelectItem value="unit">{rulesCopy.labels.unit}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        ) : null}

        {renderUnitsField()}

        {ruleType === "fuel_benefit" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.fuelMinLiters)}>
              <FieldLabel htmlFor="rule-fuel-liters">{rulesCopy.form.fuelMinLiters}</FieldLabel>
              <Input
                id="rule-fuel-liters"
                className="h-9"
                inputMode="decimal"
                value={fuelMinLiters}
                onChange={(event) => {
                  setFuelMinLiters(event.target.value)
                  setErrors((state) => ({ ...state, fuelMinLiters: undefined }))
                }}
                disabled={isSaving}
                aria-invalid={Boolean(errors.fuelMinLiters)}
              />
              {errors.fuelMinLiters ? <FieldError>{errors.fuelMinLiters}</FieldError> : null}
            </Field>
            <Field data-invalid={Boolean(errors.benefitHours)}>
              <FieldLabel htmlFor="rule-benefit-hours">{rulesCopy.form.benefitHours}</FieldLabel>
              <Input
                id="rule-benefit-hours"
                className="h-9"
                inputMode="decimal"
                value={benefitHours}
                onChange={(event) => {
                  setBenefitHours(event.target.value)
                  setErrors((state) => ({ ...state, benefitHours: undefined }))
                }}
                disabled={isSaving}
                aria-invalid={Boolean(errors.benefitHours)}
              />
              {errors.benefitHours ? <FieldError>{errors.benefitHours}</FieldError> : null}
            </Field>
          </div>
        ) : null}

        {ruleType === "yard_cleaning_occupancy" ? (
          <Field data-invalid={Boolean(errors.yardOccupancyThreshold)}>
            <FieldLabel htmlFor="rule-yard-threshold">{rulesCopy.form.yardOccupancyThreshold}</FieldLabel>
            <Input
              id="rule-yard-threshold"
              className="h-9"
              inputMode="numeric"
              value={yardOccupancyThreshold}
              onChange={(event) => {
                setYardOccupancyThreshold(event.target.value)
                setErrors((state) => ({ ...state, yardOccupancyThreshold: undefined }))
              }}
              disabled={isSaving}
              aria-invalid={Boolean(errors.yardOccupancyThreshold)}
            />
            {errors.yardOccupancyThreshold ? (
              <FieldError>{errors.yardOccupancyThreshold}</FieldError>
            ) : null}
          </Field>
        ) : null}

        {ruleType === "yard_cleaning_stale_vehicle" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.yardStaleVehicleHours)}>
              <FieldLabel htmlFor="rule-yard-stale">{rulesCopy.form.yardStaleVehicleAmount}</FieldLabel>
              <Input
                id="rule-yard-stale"
                className="h-9"
                inputMode="decimal"
                value={yardStaleVehicleAmount}
                onChange={(event) => {
                  setYardStaleVehicleAmount(event.target.value)
                  setErrors((state) => ({ ...state, yardStaleVehicleHours: undefined }))
                }}
                disabled={isSaving}
                aria-invalid={Boolean(errors.yardStaleVehicleHours)}
              />
              {errors.yardStaleVehicleHours ? (
                <FieldError>{errors.yardStaleVehicleHours}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel>{rulesCopy.form.yardStaleVehicleUnit}</FieldLabel>
              <Select
                value={yardStaleVehicleUnit}
                onValueChange={(value: RuleFormTimeUnit) => setYardStaleVehicleUnit(value)}
                disabled={isSaving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">{rulesCopy.form.timeHours}</SelectItem>
                  <SelectItem value="days">{rulesCopy.form.timeDays}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : null}

        <Field>
          <FieldLabel>{rulesCopy.form.status}</FieldLabel>
          <Select value={active} onValueChange={setActive} disabled={isSaving}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={rulesCopy.form.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">{rulesCopy.labels.active}</SelectItem>
              <SelectItem value="false">{rulesCopy.labels.inactive}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid={Boolean(errors.reason)}>
          <FieldLabel htmlFor="rule-reason">{rulesCopy.form.reason}</FieldLabel>
          <Textarea
            id="rule-reason"
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
      </form>
    </AppDialog>
  )
}
