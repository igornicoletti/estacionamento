import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { rulesCopy } from "../rules-copy"
import {
  type SaveVipRuleInput,
  type VipRuleTargetType,
} from "../types/vip-rules-types"
import { normalizeUnitIds } from "../utils/vip-rules-models"

interface VipRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: SaveVipRuleInput) => Promise<void>
}

type VipRuleFormErrors = Partial<Record<"clientId" | "clientName" | "vehicleId" | "vehiclePlate" | "reason", string>>

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
  const [unitIds, setUnitIds] = React.useState("")
  const [active, setActive] = React.useState("true")
  const [reason, setReason] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [errors, setErrors] = React.useState<VipRuleFormErrors>({})

  function resetForm() {
    setTargetType(initialTargetType)
    setClientId("")
    setClientName("")
    setVehicleId("")
    setVehiclePlate("")
    setAppliesToAllUnits("true")
    setUnitIds("")
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
      unitIds: appliesToAllUnits === "true" ? [] : normalizeUnitIds(unitIds),
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

        <Field data-invalid={Boolean(errors.clientId)}>
          <FieldLabel htmlFor="vip-rule-client-id">{rulesCopy.form.clientId}</FieldLabel>
          <Input
            id="vip-rule-client-id"
            inputMode="numeric"
            value={clientId}
            onChange={(event) => {
              setClientId(event.target.value)
              setErrors((state) => ({ ...state, clientId: undefined }))
            }}
            disabled={isSaving}
            aria-invalid={Boolean(errors.clientId)}
          />
          {errors.clientId ? <FieldError>{errors.clientId}</FieldError> : null}
        </Field>

        <Field data-invalid={Boolean(errors.clientName)}>
          <FieldLabel htmlFor="vip-rule-client-name">{rulesCopy.form.clientName}</FieldLabel>
          <Input
            id="vip-rule-client-name"
            value={clientName}
            onChange={(event) => {
              setClientName(event.target.value)
              setErrors((state) => ({ ...state, clientName: undefined }))
            }}
            disabled={isSaving}
            aria-invalid={Boolean(errors.clientName)}
          />
          {errors.clientName ? <FieldError>{errors.clientName}</FieldError> : null}
        </Field>

        {targetType === "vehicle" ? (
          <>
            <Field data-invalid={Boolean(errors.vehicleId)}>
              <FieldLabel htmlFor="vip-rule-vehicle-id">{rulesCopy.form.vehicleId}</FieldLabel>
              <Input
                id="vip-rule-vehicle-id"
                inputMode="numeric"
                value={vehicleId}
                onChange={(event) => {
                  setVehicleId(event.target.value)
                  setErrors((state) => ({ ...state, vehicleId: undefined }))
                }}
                disabled={isSaving}
                aria-invalid={Boolean(errors.vehicleId)}
              />
              {errors.vehicleId ? <FieldError>{errors.vehicleId}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(errors.vehiclePlate)}>
              <FieldLabel htmlFor="vip-rule-vehicle-plate">{rulesCopy.form.vehiclePlate}</FieldLabel>
              <Input
                id="vip-rule-vehicle-plate"
                value={vehiclePlate}
                onChange={(event) => {
                  setVehiclePlate(event.target.value.toUpperCase())
                  setErrors((state) => ({ ...state, vehiclePlate: undefined }))
                }}
                disabled={isSaving}
                aria-invalid={Boolean(errors.vehiclePlate)}
              />
              {errors.vehiclePlate ? <FieldError>{errors.vehiclePlate}</FieldError> : null}
            </Field>
          </>
        ) : null}

        <Field>
          <FieldLabel>{rulesCopy.form.appliesToAllUnits}</FieldLabel>
          <Select value={appliesToAllUnits} onValueChange={setAppliesToAllUnits} disabled={isSaving}>
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
          <Field>
            <FieldLabel htmlFor="vip-rule-unit-ids">{rulesCopy.form.unitIds}</FieldLabel>
            <Input
              id="vip-rule-unit-ids"
              value={unitIds}
              onChange={(event) => setUnitIds(event.target.value)}
              disabled={isSaving}
            />
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
