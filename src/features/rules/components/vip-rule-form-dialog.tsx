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
import { InputGroupAddon } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { listClientsSnapshot } from "@/features/clients"
import { useUnits } from "@/features/units"
import { useAsyncSnapshot } from "@/hooks/use-async-snapshot"

import { rulesCopy } from "../rules-copy"
import {
  type SaveVipRuleInput,
  type VipRuleTargetType,
} from "../types/vip-rules-types"

interface VipRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: SaveVipRuleInput) => Promise<void>
}

type VipRuleFormErrors = Partial<Record<"clientId" | "clientName" | "vehicleId" | "vehiclePlate" | "unitIds" | "reason", string>>

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

const initialTargetType: VipRuleTargetType = "client"

function readPositiveInteger(value: string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0
}

export function VipRuleFormDialog({
  open,
  onOpenChange,
  isSaving,
  onSubmit,
}: VipRuleFormDialogProps) {
  const [targetType, setTargetType] = React.useState<VipRuleTargetType>(initialTargetType)
  const [clientId, setClientId] = React.useState("")
  const [clientName, setClientName] = React.useState("")
  const [vehicleId, setVehicleId] = React.useState("")
  const [vehiclePlate, setVehiclePlate] = React.useState("")
  const [appliesToAllUnits, setAppliesToAllUnits] = React.useState("true")
  const [unitIds, setUnitIds] = React.useState<string[]>([])
  const [active, setActive] = React.useState("true")
  const [reason, setReason] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<VipRuleFormErrors>({})
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

  function resetForm() {
    setTargetType(initialTargetType)
    setClientId("")
    setClientName("")
    setVehicleId("")
    setVehiclePlate("")
    setAppliesToAllUnits("true")
    setUnitIds([])
    setActive("true")
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
    const nextErrors: VipRuleFormErrors = {}

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

    if (appliesToAllUnits === "false" && unitIds.length === 0) {
      nextErrors.unitIds = rulesCopy.form.validation.unitIds
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

    await onSubmit({
      targetType,
      clientId: readPositiveInteger(clientId),
      clientName,
      vehicleId: targetType === "vehicle" ? readPositiveInteger(vehicleId) : null,
      vehiclePlate: targetType === "vehicle" ? vehiclePlate : null,
      appliesToAllUnits: appliesToAllUnits === "true",
      unitIds: appliesToAllUnits === "true" ? [] : unitIds,
      active: active === "true",
      reason,
      notes: notes.trim() ? notes : null,
    })

    handleOpenChange(false)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={rulesCopy.form.title}
      description={rulesCopy.form.description}
      footer={(
        <>
          <Button type="button" variant="outline" size="lg" disabled={isSaving} onClick={() => handleOpenChange(false)}>
            {rulesCopy.actions.cancel}
          </Button>
          <Button type="submit" size="lg" disabled={isSaving} form="vip-rule-form">
            {rulesCopy.actions.save}
          </Button>
        </>
      )}
    >
      <form id="vip-rule-form" className="grid gap-4" onSubmit={(event) => { void handleSubmit(event) }}>
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
          <FieldLabel htmlFor="vip-rule-client">{rulesCopy.form.clientName}</FieldLabel>
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
              id="vip-rule-client"
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
            <FieldLabel htmlFor="vip-rule-vehicle">{rulesCopy.form.vehiclePlate}</FieldLabel>
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
                id="vip-rule-vehicle"
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

        <Field>
          <FieldLabel>{rulesCopy.form.appliesToAllUnits}</FieldLabel>
          <Select
            value={appliesToAllUnits}
            onValueChange={(value) => {
              setAppliesToAllUnits(value)
              if (value === "true") {
                setUnitIds([])
              }
              setErrors((state) => ({ ...state, unitIds: undefined }))
            }}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Sim</SelectItem>
              <SelectItem value="false">Não</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        {appliesToAllUnits === "false" ? (
          <Field data-invalid={Boolean(errors.unitIds)}>
            <FieldLabel htmlFor="vip-rule-unit-ids">{rulesCopy.form.unitIds}</FieldLabel>
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
                  id="vip-rule-unit-ids"
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
          <FieldLabel htmlFor="vip-rule-reason">{rulesCopy.form.reason}</FieldLabel>
          <Textarea
            id="vip-rule-reason"
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
          <FieldLabel htmlFor="vip-rule-notes">{rulesCopy.form.notes}</FieldLabel>
          <Textarea
            id="vip-rule-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSaving}
          />
        </Field>
      </form>
    </AppDialog>
  )
}
