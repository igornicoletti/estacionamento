import { SearchIcon } from "lucide-react"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
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
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listClientsSnapshot } from "@/features/clients"
import {
  buildUnitYardConfigMap,
  resolveUnitYardConfig,
  useUnitYardConfigs,
  useUnits,
} from "@/features/units"
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { rulesCopy } from "../rules-copy"
import {
  type CommercialRuleType,
  type RuleUnitScope,
  type SaveVipRuleInput,
} from "../types/vip-rules-types"

interface VipRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: SaveVipRuleInput) => Promise<void>
}

type RuleFormType = Extract<CommercialRuleType, "vip" | "fuel_benefit" | "yard_cleaning">

type RuleFormErrors = Partial<Record<
  | "benefitHours"
  | "clientId"
  | "clientName"
  | "fuelMinLiters"
  | "unitIds"
  | "vehicleIds"
  | "yardOccupancyThreshold"
  | "yardStaleVehicleHours"
  | "yardUnitId",
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
  parkingSpots: number
}

const initialRuleType: RuleFormType = "vip"

function readPositiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."))

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function readPositiveInteger(value: string) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
}

function getDefaultReason(ruleType: RuleFormType) {
  if (ruleType === "vip") {
    return rulesCopy.auditReasons.create.vip
  }

  if (ruleType === "fuel_benefit") {
    return rulesCopy.auditReasons.create.fuelBenefit
  }

  return rulesCopy.auditReasons.create.yardCleaning
}

export function VipRuleFormDialog({
  open,
  onOpenChange,
  isSaving,
  onSubmit,
}: VipRuleFormDialogProps) {
  const [ruleType, setRuleType] = React.useState<RuleFormType>(initialRuleType)
  const [clientId, setClientId] = React.useState("")
  const [clientName, setClientName] = React.useState("")
  const [appliesToAllVehicles, setAppliesToAllVehicles] = React.useState(true)
  const [vehicleIds, setVehicleIds] = React.useState<string[]>([])
  const [scope, setScope] = React.useState<RuleUnitScope>("network")
  const [unitIds, setUnitIds] = React.useState<string[]>([])
  const [yardUnitId, setYardUnitId] = React.useState("")
  const [fuelMinLiters, setFuelMinLiters] = React.useState("")
  const [benefitHours, setBenefitHours] = React.useState("")
  const [yardOccupancyThreshold, setYardOccupancyThreshold] = React.useState("")
  const [yardStaleVehicleHours, setYardStaleVehicleHours] = React.useState("")
  const [errors, setErrors] = React.useState<RuleFormErrors>({})
  const vehicleAnchorRef = useComboboxAnchor()
  const unitAnchorRef = useComboboxAnchor()
  const clientsSnapshot = useAsyncSnapshot({
    cacheKey: "rules:vip-form-clients:v2",
    errorMessage: rulesCopy.feedback.loadError,
    initialData: { clients: [], vehicles: [] },
    loadData: listClientsSnapshot,
  })
  const unitsSnapshot = useUnits()
  const yardConfigsSnapshot = useUnitYardConfigs()
  const yardConfigByUnitId = React.useMemo(
    () => buildUnitYardConfigMap(yardConfigsSnapshot.data),
    [yardConfigsSnapshot.data]
  )
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
        .filter((vehicle) => String(vehicle.cod_pessoa) === clientId)
        .map((vehicle) => ({
          clientId: vehicle.cod_pessoa,
          id: vehicle.cod_veiculo,
          label: `${vehicle.num_placa} - ${vehicle.des_veiculo || vehicle.nom_motorista || vehicle.nom_pessoa}`,
          plate: vehicle.num_placa,
          value: String(vehicle.cod_veiculo),
        })),
    [clientId, clientsSnapshot.data.vehicles]
  )
  const selectedVehicles = React.useMemo(
    () => vehicleOptions.filter((vehicle) => vehicleIds.includes(vehicle.value)),
    [vehicleIds, vehicleOptions]
  )
  const unitOptions = React.useMemo<UnitOption[]>(
    () =>
      unitsSnapshot.data.map((unit) => {
        const unitId = String(unit.cod_empresa)
        const yardConfig = resolveUnitYardConfig(unitId, yardConfigByUnitId)

        return {
          label: unit.nom_fantasia || unit.nom_razao_social || unitId,
          parkingSpots: yardConfig.parkingSpots,
          value: unitId,
        }
      }),
    [unitsSnapshot.data, yardConfigByUnitId]
  )
  const selectedUnits = React.useMemo(
    () => unitOptions.filter((unit) => unitIds.includes(unit.value)),
    [unitIds, unitOptions]
  )
  const selectedYardUnit = React.useMemo(
    () => unitOptions.find((unit) => unit.value === yardUnitId) ?? null,
    [unitOptions, yardUnitId]
  )
  const isLoadingCatalogs =
    clientsSnapshot.isLoading || unitsSnapshot.isLoading || yardConfigsSnapshot.isLoading
  const requiresUnitScope = ruleType !== "yard_cleaning" && scope === "unit"

  function resetForm() {
    setRuleType(initialRuleType)
    setClientId("")
    setClientName("")
    setAppliesToAllVehicles(true)
    setVehicleIds([])
    setScope("network")
    setUnitIds([])
    setYardUnitId("")
    setFuelMinLiters("")
    setBenefitHours("")
    setYardOccupancyThreshold("")
    setYardStaleVehicleHours("")
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

      if (!appliesToAllVehicles && vehicleIds.length === 0) {
        nextErrors.vehicleIds = rulesCopy.form.validation.vehicleIds
      }
    }

    if (requiresUnitScope && unitIds.length === 0) {
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

    if (ruleType === "yard_cleaning") {
      if (!yardUnitId) {
        nextErrors.yardUnitId = rulesCopy.form.validation.unitIds
      }

      if (readPositiveInteger(yardOccupancyThreshold) <= 0) {
        nextErrors.yardOccupancyThreshold =
          rulesCopy.form.validation.yardOccupancyThreshold
      }

      if (readPositiveNumber(yardStaleVehicleHours) <= 0) {
        nextErrors.yardStaleVehicleHours =
          rulesCopy.form.validation.yardStaleVehicleHours
      }
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
      active: true,
      notes: null,
      reason: getDefaultReason(ruleType),
    }

    if (ruleType === "vip") {
      await onSubmit({
        ...common,
        ruleType,
        targetType: "client",
        clientId: readPositiveInteger(clientId),
        clientName,
        vehicleId: null,
        vehiclePlate: null,
        appliesToAllVehicles,
        vehicleIds: appliesToAllVehicles
          ? []
          : vehicleIds.map(readPositiveInteger).filter((vehicleId) => vehicleId > 0),
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

    if (ruleType === "yard_cleaning") {
      await onSubmit({
        ...common,
        ruleType,
        unitIds: [yardUnitId],
        yardOccupancyThreshold: readPositiveInteger(yardOccupancyThreshold),
        yardStaleVehicleHours: readPositiveNumber(yardStaleVehicleHours),
      })
    }

    handleOpenChange(false)
  }

  function renderScopeField() {
    if (ruleType === "yard_cleaning") {
      return null
    }

    return (
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
          <SelectContent position="popper">
            <SelectItem value="network">{rulesCopy.labels.network}</SelectItem>
            <SelectItem value="unit">{rulesCopy.labels.specificUnits}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    )
  }

  function renderUnitsField() {
    if (!requiresUnitScope) {
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
            ref={unitAnchorRef}
            data-no-drag-scroll="true"
            className="min-h-9 w-full"
            aria-invalid={Boolean(errors.unitIds)}
          >
            {selectedUnits.length > 0 ? (
              <ComboboxValue>
                {selectedUnits.map((unit) => (
                  <ComboboxChip key={unit.value}>{unit.label}</ComboboxChip>
                ))}
              </ComboboxValue>
            ) : null}
            <ComboboxChipsInput
              id="rule-unit-ids"
              placeholder={rulesCopy.form.unitPlaceholder}
              disabled={isSaving || unitsSnapshot.isLoading}
            />
          </ComboboxChips>
          <ComboboxContent
            anchor={unitAnchorRef}
            data-no-drag-scroll="true"
            className="w-(--anchor-width) min-w-(--anchor-width)"
          >
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
            onValueChange={(value: RuleFormType) => {
              setRuleType(value)
              setScope("network")
              setUnitIds([])
              setYardUnitId("")
              setVehicleIds([])
              setAppliesToAllVehicles(true)
              setErrors({})
            }}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={rulesCopy.form.ruleTypePlaceholder} />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="vip">{rulesCopy.labels.vip}</SelectItem>
              <SelectItem value="fuel_benefit">{rulesCopy.labels.fuelBenefit}</SelectItem>
              <SelectItem value="yard_cleaning">{rulesCopy.labels.yardCleaning}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {ruleType === "vip" ? (
          <>
            <Field data-invalid={Boolean(errors.clientId || errors.clientName)}>
              <FieldLabel htmlFor="rule-client">{rulesCopy.form.clientName}</FieldLabel>
              <Combobox<ClientOption>
                items={clientOptions}
                value={selectedClient}
                onValueChange={(value: ClientOption | ClientOption[] | null) => {
                  const selectedOption = Array.isArray(value) ? value[0] ?? null : value

                  setClientId(selectedOption?.value ?? "")
                  setClientName(selectedOption?.label ?? "")
                  setVehicleIds([])
                  setAppliesToAllVehicles(true)
                  setErrors((state) => ({
                    ...state,
                    clientId: undefined,
                    clientName: undefined,
                    vehicleIds: undefined,
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

            <Field>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={appliesToAllVehicles}
                  disabled={isSaving || !clientId}
                  onCheckedChange={(checked) => {
                    const nextValue = checked === true
                    setAppliesToAllVehicles(nextValue)
                    if (nextValue) {
                      setVehicleIds([])
                    }
                    setErrors((state) => ({ ...state, vehicleIds: undefined }))
                  }}
                />
                {rulesCopy.form.applyAllVehicles}
              </label>
            </Field>

            {!appliesToAllVehicles ? (
              <Field data-invalid={Boolean(errors.vehicleIds)}>
                <FieldLabel htmlFor="rule-vehicle">{rulesCopy.form.vehiclePlate}</FieldLabel>
                <Combobox<VehicleOption, true>
                  items={vehicleOptions}
                  multiple
                  value={selectedVehicles}
                  onValueChange={(value) => {
                    const selectedOptions = Array.isArray(value) ? value : value ? [value] : []

                    setVehicleIds(selectedOptions.map((vehicle) => vehicle.value))
                    setErrors((state) => ({ ...state, vehicleIds: undefined }))
                  }}
                  itemToStringLabel={(vehicle) => vehicle.label}
                  itemToStringValue={(vehicle) => `${vehicle.value} ${vehicle.label}`}
                  disabled={isSaving || clientsSnapshot.isLoading || !clientId}
                >
                  <ComboboxChips
                    ref={vehicleAnchorRef}
                    data-no-drag-scroll="true"
                    className="min-h-9 w-full"
                    aria-invalid={Boolean(errors.vehicleIds)}
                  >
                    {selectedVehicles.length > 0 ? (
                      <ComboboxValue>
                        {selectedVehicles.map((vehicle) => (
                          <ComboboxChip key={vehicle.value}>{vehicle.plate}</ComboboxChip>
                        ))}
                      </ComboboxValue>
                    ) : null}
                    <ComboboxChipsInput
                      id="rule-vehicle"
                      placeholder={rulesCopy.form.vehiclePlaceholder}
                      disabled={isSaving || clientsSnapshot.isLoading || !clientId}
                    />
                  </ComboboxChips>
                  <ComboboxContent
                    anchor={vehicleAnchorRef}
                    className="w-(--anchor-width) min-w-(--anchor-width)"
                  >
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
                {errors.vehicleIds ? <FieldError>{errors.vehicleIds}</FieldError> : null}
              </Field>
            ) : null}
          </>
        ) : null}

        {renderScopeField()}
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

        {ruleType === "yard_cleaning" ? (
          <>
            <Field data-invalid={Boolean(errors.yardUnitId)}>
              <FieldLabel htmlFor="rule-yard-unit">{rulesCopy.form.yardUnit}</FieldLabel>
              <Combobox<UnitOption>
                items={unitOptions}
                value={selectedYardUnit}
                onValueChange={(value: UnitOption | UnitOption[] | null) => {
                  const selectedOption = Array.isArray(value) ? value[0] ?? null : value

                  setYardUnitId(selectedOption?.value ?? "")
                  setErrors((state) => ({ ...state, yardUnitId: undefined }))
                }}
                itemToStringLabel={(unit) => unit.label}
                itemToStringValue={(unit) => `${unit.value} ${unit.label}`}
                disabled={isSaving || isLoadingCatalogs}
              >
                <ComboboxInput
                  id="rule-yard-unit"
                  className="h-9 w-full"
                  placeholder={rulesCopy.form.yardUnitPlaceholder}
                  disabled={isSaving || isLoadingCatalogs}
                  aria-invalid={Boolean(errors.yardUnitId)}
                >
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                </ComboboxInput>
                <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                  <ComboboxEmpty>{rulesCopy.form.yardUnitEmpty}</ComboboxEmpty>
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
              {errors.yardUnitId ? <FieldError>{errors.yardUnitId}</FieldError> : null}
            </Field>

            <div className="rounded-md bg-secondary px-3 py-2 text-sm">
              <span className="text-muted-foreground">{rulesCopy.form.yardParkingSpots}: </span>
              <span className="font-medium">
                {selectedYardUnit
                  ? selectedYardUnit.parkingSpots || rulesCopy.form.yardParkingSpotsEmpty
                  : rulesCopy.labels.emptyValue}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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

              <Field data-invalid={Boolean(errors.yardStaleVehicleHours)}>
                <FieldLabel htmlFor="rule-yard-stale">{rulesCopy.form.yardStaleVehicleAmount}</FieldLabel>
                <Input
                  id="rule-yard-stale"
                  className="h-9"
                  inputMode="decimal"
                  value={yardStaleVehicleHours}
                  onChange={(event) => {
                    setYardStaleVehicleHours(event.target.value)
                    setErrors((state) => ({ ...state, yardStaleVehicleHours: undefined }))
                  }}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.yardStaleVehicleHours)}
                />
                {errors.yardStaleVehicleHours ? (
                  <FieldError>{errors.yardStaleVehicleHours}</FieldError>
                ) : null}
              </Field>
            </div>
          </>
        ) : null}
      </form>
    </AppDialog>
  )
}
