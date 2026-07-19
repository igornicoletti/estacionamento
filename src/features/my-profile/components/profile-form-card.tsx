import { ImageUpIcon, SaveIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { formatPhone, isValidPhone, onlyDigits } from "@/lib"

import { myProfileCopy } from "../my-profile-copy"
import type { ProfileSummary, ProfileUpdateInput } from "../types/profile-types"
import {
  resolveDisplayValue,
  resolveProfileCpf,
  resolveProfileRole,
} from "../utils/profile-models"

interface ProfileFormCardProps {
  isSaving?: boolean
  onOpenPhotoDialog: () => void
  onSave: (input: ProfileUpdateInput) => Promise<void>
  profile: ProfileSummary
}

type ProfileFieldErrors = Partial<Record<"email" | "name" | "phone", string>>

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

function validateForm({
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
  const errors: ProfileFieldErrors = {}

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

export function ProfileFormCard({
  isSaving = false,
  onOpenPhotoDialog,
  onSave,
  profile,
}: ProfileFormCardProps) {
  const [name, setName] = React.useState(profile.name)
  const [email, setEmail] = React.useState(profile.email ?? "")
  const [phone, setPhone] = React.useState(profile.phoneMasked ?? "")
  const [errors, setErrors] = React.useState<ProfileFieldErrors>({})

  const normalizedCurrentEmail = profile.email?.trim() || null
  const normalizedCurrentPhone = profile.phoneMasked?.trim() || null
  const normalizedPhone = hasMaskedPhoneValue(phone) ? phone.trim() || null : normalizePhone(phone)
  const phoneChanged = normalizedPhone !== normalizedCurrentPhone
  const hasChanges =
    name.trim() !== profile.name.trim() ||
    normalizeEmail(email) !== normalizedCurrentEmail ||
    phoneChanged

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const validationErrors = validateForm({ email, name, phone, phoneChanged })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})

    await onSave({
      avatarPath: profile.avatarPath,
      email: normalizeEmail(email),
      name: name.trim(),
      phone: phoneChanged && !hasMaskedPhoneValue(phone) ? normalizePhone(phone) : undefined,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{myProfileCopy.profile.sectionTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(event) => { void handleSubmit(event) }}>
          <ItemGroup>
            <Item variant="secondary">
              <ItemContent>
                <ItemTitle>{myProfileCopy.profile.avatarTitle}</ItemTitle>
                <ItemDescription>{myProfileCopy.profile.avatarHint}</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto">
                <Button type="button" variant="secondary" size="lg" onClick={onOpenPhotoDialog} disabled={isSaving}>
                  <ImageUpIcon aria-hidden="true" />
                  {myProfileCopy.profile.avatarAction}
                </Button>
              </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="secondary">
              <ItemContent>
                <ItemTitle>{myProfileCopy.profile.fields.name}</ItemTitle>
                <ItemDescription>Nome exibido no sistema.</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto w-full md:w-auto md:min-w-[320px]">
                <div className="w-full">
                  <FieldLabel className="sr-only" htmlFor="my-profile-name">{myProfileCopy.profile.fields.name}</FieldLabel>
                  <Input
                    id="my-profile-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value)
                      setErrors((state) => ({ ...state, name: undefined }))
                    }}
                    disabled={isSaving}
                    aria-invalid={Boolean(errors.name)}
                  />
                  {errors.name ? <FieldError>{errors.name}</FieldError> : null}
                </div>
              </ItemActions>
            </Item>

            <Item variant="secondary">
              <ItemContent>
                <ItemTitle>{myProfileCopy.profile.fields.email}</ItemTitle>
                <ItemDescription>Contato administrativo da conta.</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto w-full md:w-auto md:min-w-[320px]">
                <div className="w-full">
                  <FieldLabel className="sr-only" htmlFor="my-profile-email">{myProfileCopy.profile.fields.email}</FieldLabel>
                  <Input
                    id="my-profile-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setErrors((state) => ({ ...state, email: undefined }))
                    }}
                    disabled={isSaving}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email ? <FieldError>{errors.email}</FieldError> : null}
                </div>
              </ItemActions>
            </Item>

            <Item variant="secondary">
              <ItemContent>
                <ItemTitle>{myProfileCopy.profile.fields.phone}</ItemTitle>
                <ItemDescription>Telefone para contato interno.</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto w-full md:w-auto md:min-w-[320px]">
                <div className="w-full">
                  <FieldLabel className="sr-only" htmlFor="my-profile-phone">{myProfileCopy.profile.fields.phone}</FieldLabel>
                  <Input
                    id="my-profile-phone"
                    value={phone}
                    onChange={(event) => {
                      setPhone(formatPhone(onlyDigits(event.target.value)))
                      setErrors((state) => ({ ...state, phone: undefined }))
                    }}
                    disabled={isSaving}
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
                </div>
              </ItemActions>
            </Item>

            <ItemSeparator />

            <Item variant="secondary">
              <ItemContent>
                <ItemTitle>{myProfileCopy.profile.fields.cpf}</ItemTitle>
                <ItemDescription>{myProfileCopy.profile.protectedDescription}</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto w-full md:w-auto md:min-w-[320px]">
                <Input value={resolveProfileCpf(profile.cpfMasked)} disabled readOnly />
              </ItemActions>
            </Item>

            <Item variant="secondary">
              <ItemContent>
                <ItemTitle>{myProfileCopy.profile.fields.role}</ItemTitle>
                <ItemDescription>{myProfileCopy.profile.protectedDescription}</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto w-full md:w-auto md:min-w-[320px]">
                <Input value={resolveProfileRole(profile.roleLabel)} disabled readOnly />
              </ItemActions>
            </Item>

            <Item variant="secondary">
              <ItemContent>
                <ItemTitle>{myProfileCopy.profile.fields.unit}</ItemTitle>
                <ItemDescription>{myProfileCopy.profile.protectedDescription}</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto w-full md:w-auto md:min-w-[320px]">
                <Input value={resolveDisplayValue(profile.unitLabel)} disabled readOnly />
              </ItemActions>
            </Item>

            <Item variant="secondary">
              <ItemContent>
                <ItemTitle>{myProfileCopy.profile.fields.status}</ItemTitle>
                <ItemDescription>{myProfileCopy.profile.protectedDescription}</ItemDescription>
              </ItemContent>
              <ItemActions className="ml-auto w-full md:w-auto md:min-w-[320px]">
                <Input value={myProfileCopy.profile.statusLabels[profile.status]} disabled readOnly />
              </ItemActions>
            </Item>
          </ItemGroup>

          {hasChanges ? (
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" size="lg" disabled={isSaving}>
                {isSaving ? <Spinner data-icon="inline-start" /> : <SaveIcon aria-hidden="true" />}
                {isSaving ? myProfileCopy.profile.saving : myProfileCopy.profile.save}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
