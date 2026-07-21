import { SearchIcon } from "lucide-react"
import * as React from "react"

import { AppDialog } from "@/components/shared/app-dialog"
import { AppPasswordField } from "@/components/shared/app-password-field"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { formatCpfInput } from "@/features/auth/validation"
import { formatPhone, onlyDigits } from "@/lib"
import { preventDialogCloseOnFloatingLayerInteraction } from "@/lib/dialog-interactions"

import { USERS_DIALOG_FORM_ID, usersCopy } from "../constants"
import {
  getUsersFormFieldErrors,
  isGlobalRole,
  type UserRecord,
  type UserRole,
  userRoleLabels,
  type UsersFormFieldName,
  usersFormSchema,
  type UsersFormValues,
} from "../model"

export interface UserFormUnitOption {
  label: string
  value: string
}

interface UserFormDialogProps {
  assignableRoleValues: readonly UserRole[]
  editingUser: UserRecord | null
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UsersFormValues) => Promise<void>
  open: boolean
  unitOptions: readonly UserFormUnitOption[]
}

function RequiredMark() {
  return <span className="text-destructive">{usersCopy.form.requiredMark}</span>
}

function createDefaultFormValues(): UsersFormValues {
  return {
    cpf: "",
    email: "",
    firstAccessPassword: "",
    id: undefined,
    mode: "create",
    name: "",
    phone: "",
    role: "operator",
    unitId: "",
    unitName: "",
  }
}

function mapUserToFormValues(user: UserRecord): UsersFormValues {
  return {
    cpf: user.cpf,
    email: user.email || "",
    firstAccessPassword: "",
    id: user.id,
    mode: "edit",
    name: user.name,
    phone: user.phoneMasked || "",
    role: user.role,
    unitId: user.unitId || "",
    unitName: user.unitName || "",
  }
}

export function UserFormDialog({
  assignableRoleValues,
  editingUser,
  isSaving,
  onOpenChange,
  onSubmit,
  open,
  unitOptions,
}: UserFormDialogProps) {
  const [values, setValues] = React.useState<UsersFormValues>(() =>
    editingUser ? mapUserToFormValues(editingUser) : createDefaultFormValues()
  )
  const [errors, setErrors] = React.useState<Partial<Record<UsersFormFieldName, string>>>({})
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const isSubmittingRef = React.useRef(false)
  const isEditMode = editingUser !== null
  const isGlobalScopeRole = isGlobalRole(values.role)
  const selectedUnit = isGlobalScopeRole
    ? null
    : unitOptions.find((unit) => unit.value === values.unitId) ?? null

  function setValue<Key extends keyof UsersFormValues>(key: Key, value: UsersFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSaving || isSubmittingRef.current) {
      return
    }

    onOpenChange(nextOpen)

    if (!nextOpen) {
      setValues(createDefaultFormValues())
      setErrors({})
      setSubmitError(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving || isSubmittingRef.current) {
      return
    }

    setSubmitError(null)

    const result = usersFormSchema.safeParse(values)

    if (!result.success) {
      setErrors(getUsersFormFieldErrors(result.error))
      return
    }

    isSubmittingRef.current = true

    try {
      await onSubmit(result.data)
      onOpenChange(false)
      setValues(createDefaultFormValues())
      setErrors({})
    } catch {
      setSubmitError(
        isEditMode ? usersCopy.feedback.update.error : usersCopy.feedback.create.error
      )
    } finally {
      isSubmittingRef.current = false
    }
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isEditMode ? usersCopy.dialogs.editTitle : usersCopy.dialogs.createTitle}
      description={isEditMode ? usersCopy.dialogs.editDescription : usersCopy.dialogs.createDescription}
      contentProps={{ onInteractOutside: preventDialogCloseOnFloatingLayerInteraction }}
      footer={(
        <div className="grid w-full grid-cols-2 gap-2">
          <Button type="button" variant="outline" size="lg" disabled={isSaving} onClick={() => handleOpenChange(false)}>
            {usersCopy.dialogs.cancel}
          </Button>
          <Button type="submit" form={USERS_DIALOG_FORM_ID} size="lg" disabled={isSaving} aria-busy={isSaving}>
            {isSaving ? <Spinner data-icon="inline-start" /> : null}
            {isSaving
              ? isEditMode
                ? usersCopy.feedback.update.loading
                : usersCopy.feedback.create.loading
              : isEditMode
                ? usersCopy.actions.save
                : usersCopy.actions.create}
          </Button>
        </div>
      )}
    >
      <form id={USERS_DIALOG_FORM_ID} onSubmit={(event: React.FormEvent<HTMLFormElement>) => { void handleSubmit(event) }} noValidate>
        <FieldGroup>
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="user-name">
              {usersCopy.form.fields.name}
              <RequiredMark />
            </FieldLabel>
            <Input
              id="user-name"
              className="h-9 w-full"
              placeholder={usersCopy.form.placeholders.name}
              value={values.name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue("name", event.target.value)}
              disabled={isSaving}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <FieldError>{errors.name}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.cpf)}>
            <FieldLabel htmlFor="user-cpf">
              {usersCopy.form.fields.cpf}
              <RequiredMark />
            </FieldLabel>
            <Input
              id="user-cpf"
              className="h-9 w-full"
              value={values.cpf}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue("cpf", formatCpfInput(event.target.value))}
              disabled={isSaving}
              inputMode="numeric"
              autoComplete="username"
              aria-invalid={Boolean(errors.cpf)}
            />
            {errors.cpf ? <FieldError>{errors.cpf}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="user-email">{usersCopy.form.fields.email}</FieldLabel>
            <Input
              id="user-email"
              type="email"
              className="h-9 w-full"
              placeholder={usersCopy.form.placeholders.email}
              value={values.email}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue("email", event.target.value)}
              disabled={isSaving}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? <FieldError>{errors.email}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.phone)}>
            <FieldLabel htmlFor="user-phone">
              {usersCopy.form.fields.phone}
              <RequiredMark />
            </FieldLabel>
            <Input
              id="user-phone"
              className="h-9 w-full"
              placeholder={usersCopy.form.placeholders.phone}
              value={values.phone}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setValue("phone", formatPhone(onlyDigits(event.target.value)))}
              disabled={isSaving}
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.role)}>
            <FieldLabel>
              {usersCopy.form.roleLabel}
              <RequiredMark />
            </FieldLabel>
            <Select
              value={values.role}
              onValueChange={(value: UserRole) => {
                setValue("role", value)

                if (isGlobalRole(value)) {
                  setValues((current) => ({ ...current, unitId: "", unitName: "" }))
                }
              }}
              disabled={isSaving}
            >
              <SelectTrigger
                className="w-full data-[size=default]:h-9"
                aria-invalid={Boolean(errors.role)}
                aria-label={usersCopy.form.roleLabel}
              >
                <SelectValue placeholder={usersCopy.form.placeholders.role} />
              </SelectTrigger>
              <SelectContent position="popper">
                {assignableRoleValues.map((role) => (
                  <SelectItem key={role} value={role}>
                    {userRoleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role ? <FieldError>{errors.role}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.unitId)}>
            <FieldLabel htmlFor="user-unit">
              {usersCopy.form.unitLabel}
              {!isGlobalScopeRole ? <RequiredMark /> : null}
            </FieldLabel>
            <Combobox<UserFormUnitOption>
              items={unitOptions}
              value={selectedUnit}
              onValueChange={(value: UserFormUnitOption | null) => {
                setValues((current) => ({
                  ...current,
                  unitId: value?.value ?? "",
                  unitName: value?.label ?? "",
                }))
                setErrors((current) => ({ ...current, unitId: undefined, unitName: undefined }))
              }}
              isItemEqualToValue={(a, b) => a.value === b.value}
              itemToStringLabel={(unit: UserFormUnitOption) => unit.label}
              itemToStringValue={(unit: UserFormUnitOption) => `${unit.value} ${unit.label}`}
              disabled={isSaving || isGlobalScopeRole}
            >
              <ComboboxInput
                id="user-unit"
                className="h-9 w-full"
                placeholder={isGlobalScopeRole ? usersCopy.form.globalUnitPlaceholder : usersCopy.form.unitPlaceholder}
                disabled={isSaving || isGlobalScopeRole}
                aria-invalid={Boolean(errors.unitId)}
              >
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
              </ComboboxInput>
              <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                <ComboboxEmpty>{usersCopy.form.unitEmpty}</ComboboxEmpty>
                <ComboboxList>
                  <ComboboxCollection>
                    {(unit: UserFormUnitOption) => (
                      <ComboboxItem key={unit.value} value={unit}>
                        {unit.label}
                      </ComboboxItem>
                    )}
                  </ComboboxCollection>
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {isGlobalScopeRole ? (
              <p className="text-xs text-muted-foreground">{usersCopy.form.globalScopeHint}</p>
            ) : null}
            {errors.unitId ? <FieldError>{errors.unitId}</FieldError> : null}
          </Field>

          <AppPasswordField
            id="user-password"
            label={usersCopy.form.passwordLabel}
            value={values.firstAccessPassword}
            onChange={(event) => setValue("firstAccessPassword", event.target.value)}
            error={errors.firstAccessPassword}
            disabled={isSaving}
            autoComplete="new-password"
            description={usersCopy.form.passwordDescription}
            required={!isEditMode}
          />

          {submitError ? (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          ) : null}
        </FieldGroup>
      </form>
    </AppDialog>
  )
}
