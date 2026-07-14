import { ImageUpIcon, SaveIcon, UserIcon } from "lucide-react"
import * as React from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
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
import { validateAvatarFile } from "../services/settings-profile-service"

interface SettingsProfileSectionProps {
  isSaving?: boolean
  onSave: (input: SettingsProfileUpdateInput, avatarFile: File | null) => Promise<void>
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
  Record<"avatar" | "email" | "name" | "phone", string>
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

export function SettingsProfileSection({
  isSaving = false,
  onSave,
  profile,
}: SettingsProfileSectionProps) {
  const fileInputId = React.useId()
  const [name, setName] = React.useState(profile.name)
  const [email, setEmail] = React.useState(profile.email ?? "")
  const [phone, setPhone] = React.useState(profile.phoneMasked ?? "")
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<SettingsProfileFieldErrors>({})
  const fallback = getProfileInitials(profile.name)
  const displayAvatarUrl = avatarPreviewUrl || profile.avatarUrl
  const normalizedCurrentEmail = profile.email?.trim() || null
  const normalizedCurrentPhone = profile.phoneMasked?.trim() || null
  const normalizedPhone = hasMaskedPhoneValue(phone)
    ? phone.trim() || null
    : normalizePhone(phone)
  const phoneChanged = normalizedPhone !== normalizedCurrentPhone
  const hasChanges =
    name.trim() !== profile.name.trim() ||
    normalizeEmail(email) !== normalizedCurrentEmail ||
    phoneChanged ||
    Boolean(avatarFile)

  React.useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  function handleAvatarFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      validateAvatarFile(file)
      const previewUrl = URL.createObjectURL(file)

      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }

      setAvatarFile(file)
      setAvatarPreviewUrl(previewUrl)
      setErrors((state) => ({ ...state, avatar: undefined }))
    } catch (caughtError) {
      setErrors((state) => ({
        ...state,
        avatar:
          caughtError instanceof Error
            ? caughtError.message
            : settingsCopy.feedback.profile.error,
      }))
    }
  }

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
    await onSave(
      {
        avatarUrl: profile.avatarPath ?? profile.avatarUrl,
        email: normalizeEmail(email),
        name: name.trim(),
        phone: phoneChanged && !hasMaskedPhoneValue(phone) ? normalizePhone(phone) : undefined,
      },
      avatarFile
    )
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
          className="grid gap-4"
          onSubmit={(event) => {
            void handleSubmit(event)
          }}
        >
          <Accordion type="multiple" defaultValue={["avatar", "account", "protected"]}>
            <AccordionItem value="avatar">
              <AccordionTrigger>
                <span className="grid gap-0.5">
                  <span>{settingsCopy.profile.avatarTitle}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {settingsCopy.profile.avatarDescription}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Avatar className="size-20">
                    {displayAvatarUrl ? <AvatarImage src={displayAvatarUrl} alt="" /> : null}
                    <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-2">
                    <Input
                      id={fileInputId}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={handleAvatarFileChange}
                    />
                    <Button type="button" variant="outline" size="lg" asChild>
                      <label htmlFor={fileInputId} className="cursor-pointer">
                        <ImageUpIcon aria-hidden="true" />
                        {settingsCopy.profile.avatarUpload}
                      </label>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {settingsCopy.profile.avatarHint}
                    </p>
                    {errors.avatar ? <FieldError>{errors.avatar}</FieldError> : null}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account">
              <AccordionTrigger>
                <span className="grid gap-0.5">
                  <span>{settingsCopy.profile.accountTitle}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {settingsCopy.profile.accountDescription}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1">
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
                  <Field data-invalid={Boolean(errors.phone)}>
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="protected">
              <AccordionTrigger>
                <span className="grid gap-0.5">
                  <span>{settingsCopy.profile.protectedTitle}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {settingsCopy.profile.protectedDescription}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>{settingsCopy.profile.fields.cpf}</FieldLabel>
                    <Input value={resolveProfileCpf(profile.cpfMasked)} disabled readOnly />
                  </Field>
                  <Field>
                    <FieldLabel>{settingsCopy.profile.fields.role}</FieldLabel>
                    <Input value={resolveProfileRole(profile.roleLabel)} disabled readOnly />
                  </Field>
                  <Field>
                    <FieldLabel>{settingsCopy.profile.fields.unit}</FieldLabel>
                    <Input value={resolveDisplayValue(profile.unitLabel)} disabled readOnly />
                  </Field>
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {hasChanges ? (
            <div className="flex justify-end">
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
