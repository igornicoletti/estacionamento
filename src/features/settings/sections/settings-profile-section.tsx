import {
  CameraIcon,
  IdCardIcon,
  LockKeyholeIcon,
  SaveIcon,
  UserIcon,
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { formatPhone, isValidPhone, onlyDigits } from "@/lib"

import { getProfileInitials } from "../components/profile-photo-dialog"
import { settingsCopy } from "../settings-copy"
import type {
  SettingsProfileSummary,
  SettingsProfileUpdateInput,
} from "../types/settings-types"
import {
  resolveDisplayValue,
  resolveProfileCpf,
  resolveProfileRole,
} from "../utils/settings-models"

interface SettingsProfileSectionProps {
  isSaving?: boolean
  onOpenPhotoDialog: () => void
  onSave: (input: SettingsProfileUpdateInput) => Promise<void>
  profile: SettingsProfileSummary
}

function normalizeEmail(value: string) {
  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

function normalizePhone(value: string) {
  const digits = onlyDigits(value)

  return digits ? formatPhone(digits) : null
}

function hasMaskedPhoneValue(value: string) {
  return value.includes("*")
}

type SettingsProfileFieldErrors = Partial<
  Record<"email" | "name" | "phone", string>
>

function validateProfileForm({
  email,
  name,
  phone,
  phoneChanged,
}: {
  email: string
  name: string
  phone: string
  phoneChanged: boolean
}) {
  const errors: SettingsProfileFieldErrors = {}

  if (name.trim().length < 3) {
    errors.name = "Informe um nome com pelo menos 3 caracteres."
  }

  const normalizedEmail = normalizeEmail(email)

  if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "Informe um e-mail válido."
  }

  if (phoneChanged) {
    if (!phone.trim()) {
      errors.phone = "Informe um telefone."
    } else if (!isValidPhone(phone)) {
      errors.phone = "Informe um telefone válido."
    }
  }

  return errors
}

function SettingsProtectedField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Input value={value} disabled readOnly />
    </Field>
  )
}

export function SettingsProfileSection({
  isSaving = false,
  onOpenPhotoDialog,
  onSave,
  profile,
}: SettingsProfileSectionProps) {
  const [name, setName] = React.useState(profile.name)
  const [email, setEmail] = React.useState(profile.email ?? "")
  const [phone, setPhone] = React.useState(profile.phoneMasked ?? "")
  const [errors, setErrors] = React.useState<SettingsProfileFieldErrors>({})
  const fallback = getProfileInitials(profile.name)
  const normalizedCurrentEmail = profile.email?.trim() || null
  const normalizedCurrentPhone = profile.phoneMasked?.trim() || null
  const normalizedPhone = hasMaskedPhoneValue(phone)
    ? phone.trim() || null
    : normalizePhone(phone)
  const phoneChanged = normalizedPhone !== normalizedCurrentPhone
  const hasChanges =
    name.trim() !== profile.name.trim() ||
    normalizeEmail(email) !== normalizedCurrentEmail ||
    phoneChanged

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateProfileForm({
      email,
      name,
      phone,
      phoneChanged,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    await onSave({
      avatarUrl: profile.avatarPath ?? profile.avatarUrl,
      email: normalizeEmail(email),
      name: name.trim(),
      phone: phoneChanged && !hasMaskedPhoneValue(phone) ? normalizePhone(phone) : undefined,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <UserIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="space-y-1">
          <CardTitle className="text-base">{settingsCopy.profile.sectionTitle}</CardTitle>
          <CardDescription>{settingsCopy.profile.sectionDescription}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <section className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/25 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-14 shrink-0">
                {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
                <AvatarFallback className="text-base">{fallback}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {settingsCopy.profile.avatarTitle}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {settingsCopy.profile.avatarHint}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={onOpenPhotoDialog}
            >
              <CameraIcon aria-hidden="true" />
              {settingsCopy.profile.avatarAction}
            </Button>
          </section>

          <section className="grid gap-4">
            <div className="flex items-start gap-2">
              <IdCardIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-0.5">
                <h2 className="text-sm font-medium">
                  {settingsCopy.profile.accountTitle}
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {settingsCopy.profile.accountDescription}
                </p>
              </div>
            </div>

            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="settings-profile-name">
                  {settingsCopy.profile.fields.name}
                </FieldLabel>
                <Input
                  id="settings-profile-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setErrors((state) => ({ ...state, name: undefined }))
                  }}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.name)}
                />
                <FieldDescription>
                  {settingsCopy.profile.nameDescription}
                </FieldDescription>
                {errors.name ? <FieldError>{errors.name}</FieldError> : null}
              </Field>
              <Field data-invalid={Boolean(errors.email)}>
                <FieldLabel htmlFor="settings-profile-email">
                  {settingsCopy.profile.fields.email}
                </FieldLabel>
                <Input
                  id="settings-profile-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setErrors((state) => ({ ...state, email: undefined }))
                  }}
                  placeholder={settingsCopy.profile.noEmail}
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.email)}
                />
                <FieldDescription>
                  {settingsCopy.profile.emailDescription}
                </FieldDescription>
                {errors.email ? <FieldError>{errors.email}</FieldError> : null}
              </Field>
              <Field data-invalid={Boolean(errors.phone)} className="md:col-span-2">
                <FieldLabel htmlFor="settings-profile-phone">
                  {settingsCopy.profile.fields.phone}
                </FieldLabel>
                <Input
                  id="settings-profile-phone"
                  value={phone}
                  onChange={(event) => {
                    setPhone(formatPhone(onlyDigits(event.target.value)))
                    setErrors((state) => ({ ...state, phone: undefined }))
                  }}
                  placeholder={settingsCopy.profile.noPhone}
                  disabled={isSaving}
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                />
                <FieldDescription>
                  {settingsCopy.profile.phoneDescription}
                </FieldDescription>
                {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
              </Field>
            </FieldGroup>
          </section>

          <section className="grid gap-4 border-t pt-4">
            <div className="flex items-start gap-2">
              <LockKeyholeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-0.5">
                <h2 className="text-sm font-medium">
                  {settingsCopy.profile.protectedTitle}
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {settingsCopy.profile.protectedDescription}
                </p>
              </div>
            </div>
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <SettingsProtectedField
                label={settingsCopy.profile.fields.cpf}
                value={resolveProfileCpf(profile.cpfMasked)}
              />
              <SettingsProtectedField
                label={settingsCopy.profile.fields.role}
                value={resolveProfileRole(profile.roleLabel)}
              />
              <SettingsProtectedField
                label={settingsCopy.profile.fields.unit}
                value={resolveDisplayValue(profile.unitLabel)}
              />
              <SettingsProtectedField
                label={settingsCopy.profile.fields.status}
                value={settingsCopy.profile.statusLabels[profile.status]}
              />
            </FieldGroup>
          </section>

          {hasChanges ? (
            <div className="flex justify-end border-t pt-4">
              <Button type="submit" size="lg" disabled={isSaving}>
                <SaveIcon aria-hidden="true" />
                {isSaving ? settingsCopy.profile.saving : settingsCopy.profile.save}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
