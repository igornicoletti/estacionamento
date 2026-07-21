import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { preventDialogCloseOnFloatingLayerInteraction } from "@/lib/dialog-interactions"

import { unitsCopy } from "../constants/units-copy"
import { type YardStatusFormValue } from "../model"

interface UnitYardConfigDialogProps {
  open: boolean
  unitName?: string
  status: YardStatusFormValue
  spots: string
  error: string | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (status: YardStatusFormValue) => void
  onSpotsChange: (spots: string) => void
  onSave: () => void
}

export function UnitYardConfigDialog({
  open,
  unitName,
  status,
  spots,
  error,
  isSaving,
  onOpenChange,
  onStatusChange,
  onSpotsChange,
  onSave,
}: UnitYardConfigDialogProps) {
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (isSaving) {
        return
      }

      onOpenChange(nextOpen)
    },
    [isSaving, onOpenChange]
  )

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={unitsCopy.yard.dialogTitle}
      description={unitName ?? ""}
      contentProps={{ onInteractOutside: preventDialogCloseOnFloatingLayerInteraction }}
      footer={(
        <div className="grid w-full grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isSaving}
            onClick={() => handleOpenChange(false)}
          >
            {unitsCopy.actions.cancel}
          </Button>
          <Button type="button" size="lg" disabled={isSaving} aria-busy={isSaving} onClick={onSave}>
            {isSaving ? <Spinner data-icon="inline-start" /> : null}
            {isSaving ? unitsCopy.actions.saving : unitsCopy.actions.save}
          </Button>
        </div>
      )}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>{unitsCopy.yard.statusLabel}</FieldLabel>
          <Select
            value={status}
            onValueChange={(value: string) => onStatusChange(value === "active" ? "active" : "inactive")}
            disabled={isSaving}
          >
            <SelectTrigger className="w-full data-[size=default]:h-9">
              <SelectValue placeholder={unitsCopy.yard.statusPlaceholder} />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="active">{unitsCopy.yard.statusActive}</SelectItem>
              <SelectItem value="inactive">{unitsCopy.yard.statusInactive}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="unit-yard-spots">{unitsCopy.yard.spotsLabel}</FieldLabel>
          <Input
            id="unit-yard-spots"
            className="h-9"
            type="number"
            min={0}
            step={1}
            value={spots}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onSpotsChange(event.target.value)}
            disabled={isSaving}
            aria-invalid={Boolean(error)}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FieldGroup>
    </AppDialog>
  )
}
