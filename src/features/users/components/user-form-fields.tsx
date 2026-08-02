import { SearchIcon } from "lucide-react"

import { AppPasswordField } from "@/components/shared/app-password-field"
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCpfInput } from "@/features/auth"
import { formatUnitOptionLabel } from "@/features/units"
import { formatPhone, onlyDigits } from "@/lib"

import { usersCopy } from "../constants/users-copy"
import {
  isGlobalRole,
  type UnitCatalogItem,
  type UserRole,
  userRoleLabels,
} from "../model/users-types"
import {
  type UsersFormFieldName,
  type UsersFormValues,
} from "../schemas/users-form-schema"

interface UserFormFieldsProps {
  assignableRoleValues: readonly UserRole[]
  errors: Partial<Record<UsersFormFieldName, string>>
  isSaving: boolean
  onValueChange: <Key extends keyof UsersFormValues>(
    key: Key,
    value: UsersFormValues[Key]
  ) => void
  unitCatalog: readonly UnitCatalogItem[]
  unitCatalogError: boolean
  values: UsersFormValues
}

export const usersFormControlIdByField: Partial<
  Record<UsersFormFieldName, string>
> = {
  cpf: "user-cpf",
  email: "user-email",
  firstAccessPassword: "user-password",
  name: "user-name",
  phone: "user-phone",
  role: "user-role",
  unitId: "user-unit",
}

export const usersFormFieldFocusOrder: readonly UsersFormFieldName[] = [
  "name",
  "cpf",
  "email",
  "phone",
  "role",
  "unitId",
  "firstAccessPassword",
]

function getErrorId(fieldName: UsersFormFieldName, hasError: boolean) {
  const controlId = usersFormControlIdByField[fieldName]

  return hasError && controlId ? `${controlId}-error` : undefined
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {usersCopy.form.requiredMark}
    </span>
  )
}

export function UserFormFields({
  assignableRoleValues,
  errors,
  isSaving,
  onValueChange,
  unitCatalog,
  unitCatalogError,
  values,
}: UserFormFieldsProps) {
  const isEditMode = values.mode === "edit"
  const isGlobalScopeRole = isGlobalRole(values.role)
  const selectedUnit = isGlobalScopeRole
    ? null
    : unitCatalog.find((unit) => unit.id === values.unitId) ?? null
  const nameErrorId = getErrorId("name", Boolean(errors.name))
  const cpfErrorId = getErrorId("cpf", Boolean(errors.cpf))
  const emailErrorId = getErrorId("email", Boolean(errors.email))
  const phoneErrorId = getErrorId("phone", Boolean(errors.phone))
  const roleErrorId = getErrorId("role", Boolean(errors.role))
  const unitErrorId = getErrorId("unitId", Boolean(errors.unitId))
  const unitDescriptionId = isGlobalScopeRole
    ? "user-unit-description"
    : undefined
  const unitDescribedBy = [unitDescriptionId, unitErrorId]
    .filter(Boolean)
    .join(" ") || undefined

  return (
    <FieldGroup>
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="user-name">
          {usersCopy.form.fields.name}
          <RequiredMark />
        </FieldLabel>
        <Input
          id="user-name"
          autoComplete="name"
          maxLength={120}
          placeholder={usersCopy.form.placeholders.name}
          value={values.name}
          onChange={(event) => onValueChange("name", event.target.value)}
          disabled={isSaving}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={nameErrorId}
        />
        {errors.name ? (
          <FieldError id={nameErrorId}>{errors.name}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={Boolean(errors.cpf)}>
        <FieldLabel htmlFor="user-cpf">
          {usersCopy.form.fields.cpf}
          <RequiredMark />
        </FieldLabel>
        <Input
          id="user-cpf"
          value={values.cpf}
          onChange={(event) =>
            onValueChange("cpf", formatCpfInput(event.target.value))
          }
          disabled={isSaving}
          inputMode="numeric"
          autoComplete="username"
          required
          aria-invalid={Boolean(errors.cpf)}
          aria-describedby={cpfErrorId}
        />
        {errors.cpf ? (
          <FieldError id={cpfErrorId}>{errors.cpf}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel htmlFor="user-email">
          {usersCopy.form.fields.email}
        </FieldLabel>
        <Input
          id="user-email"
          type="email"
          autoComplete="email"
          maxLength={254}
          placeholder={usersCopy.form.placeholders.email}
          value={values.email}
          onChange={(event) => onValueChange("email", event.target.value)}
          disabled={isSaving}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={emailErrorId}
        />
        {errors.email ? (
          <FieldError id={emailErrorId}>{errors.email}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={Boolean(errors.phone)}>
        <FieldLabel htmlFor="user-phone">
          {usersCopy.form.fields.phone}
          <RequiredMark />
        </FieldLabel>
        <Input
          id="user-phone"
          placeholder={usersCopy.form.placeholders.phone}
          value={values.phone}
          onChange={(event) =>
            onValueChange(
              "phone",
              formatPhone(onlyDigits(event.target.value))
            )
          }
          disabled={isSaving}
          inputMode="tel"
          autoComplete="tel"
          required
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={phoneErrorId}
        />
        {errors.phone ? (
          <FieldError id={phoneErrorId}>{errors.phone}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={Boolean(errors.role)}>
        <FieldLabel htmlFor="user-role">
          {usersCopy.form.roleLabel}
          <RequiredMark />
        </FieldLabel>
        <Select
          value={values.role}
          onValueChange={(value: UserRole) => {
            onValueChange("role", value)

            if (isGlobalRole(value)) {
              onValueChange("unitId", "")
            }
          }}
          disabled={isSaving}
        >
          <SelectTrigger
            id="user-role"
            className="w-full"
            aria-invalid={Boolean(errors.role)}
            aria-describedby={roleErrorId}
            aria-required="true"
          >
            <SelectValue placeholder={usersCopy.form.placeholders.role} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              {assignableRoleValues.map((role) => (
                <SelectItem key={role} value={role}>
                  {userRoleLabels[role]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.role ? (
          <FieldError id={roleErrorId}>{errors.role}</FieldError>
        ) : null}
      </Field>

      <Field data-invalid={Boolean(errors.unitId)}>
        <FieldLabel htmlFor="user-unit">
          {usersCopy.form.unitLabel}
          {!isGlobalScopeRole ? <RequiredMark /> : null}
        </FieldLabel>
        <Combobox<UnitCatalogItem>
          items={unitCatalog}
          value={selectedUnit}
          onValueChange={(value) => {
            onValueChange("unitId", value?.id ?? "")
          }}
          isItemEqualToValue={(left, right) => left.id === right.id}
          itemToStringLabel={(unit) =>
            formatUnitOptionLabel(unit.id, unit.name)
          }
          itemToStringValue={(unit) =>
            `${unit.id} ${formatUnitOptionLabel(unit.id, unit.name)}`
          }
          disabled={isSaving || isGlobalScopeRole}
        >
          <ComboboxInput
            id="user-unit"
            className="w-full"
            placeholder={
              isGlobalScopeRole
                ? usersCopy.form.globalUnitPlaceholder
                : usersCopy.form.unitPlaceholder
            }
            disabled={isSaving || isGlobalScopeRole}
            showClear={!isGlobalScopeRole && Boolean(selectedUnit)}
            aria-invalid={Boolean(errors.unitId)}
            aria-describedby={unitDescribedBy}
            aria-required={!isGlobalScopeRole}
          >
            <InputGroupAddon>
              <SearchIcon data-icon="inline-start" aria-hidden="true" />
            </InputGroupAddon>
          </ComboboxInput>
          <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
            <ComboboxEmpty>
              {unitCatalogError
                ? usersCopy.form.unitUnavailable
                : usersCopy.form.unitEmpty}
            </ComboboxEmpty>
            <ComboboxList>
              <ComboboxCollection>
                {(unit: UnitCatalogItem) => (
                  <ComboboxItem key={unit.id} value={unit}>
                    {formatUnitOptionLabel(unit.id, unit.name)}
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        {isGlobalScopeRole ? (
          <FieldDescription id={unitDescriptionId}>
            {usersCopy.form.globalScopeHint}
          </FieldDescription>
        ) : null}
        {errors.unitId ? (
          <FieldError id={unitErrorId}>{errors.unitId}</FieldError>
        ) : null}
      </Field>

      {!isEditMode ? (
        <AppPasswordField
          id="user-password"
          label={usersCopy.form.passwordLabel}
          value={values.firstAccessPassword}
          onChange={(event) =>
            onValueChange("firstAccessPassword", event.target.value)
          }
          error={errors.firstAccessPassword}
          disabled={isSaving}
          autoComplete="new-password"
          description={usersCopy.form.passwordDescription}
          required
        />
      ) : null}
    </FieldGroup>
  )
}
