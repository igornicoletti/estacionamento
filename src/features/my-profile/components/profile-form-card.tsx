import {
  Building2Icon,
  IdCardIcon,
  ImageUpIcon,
  KeyRoundIcon,
  MailIcon,
  PhoneIcon,
  SaveIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react"
import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { formatPhone, getBadgeToneClassName, isValidPhone, onlyDigits, type BadgeTone } from "@/lib"

import { myProfileCopy } from "../my-profile-copy"
import type { ProfileSummary, ProfileUpdateInput } from "../types/profile-types"
import {
  resolveDisplayValue,
  resolveProfileCpf,
  resolveProfileEmail,
  resolveProfileRole,
} from "../utils/profile-models"

import { getProfileInitials } from "./profile-photo-dialog"

interface ProfileFormCardProps {
  isSaving?: boolean
  onOpenPasswordDialog: () => void
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

function getProfileStatusTone(status: ProfileSummary["status"]): BadgeTone {
  if (status === "active") {
    return "success"
  }

  if (status === "inactive") {
    return "destructive"
  }

  if (status === "pending") {
    return "info"
  }

  return "warning"
}

function ProfileActionRow({
  action,
  description,
  icon,
  title,
}: {
  action: React.ReactNode
  description: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <Item variant="default" className="items-start gap-3 px-0 py-0">
      <ItemMedia variant="icon" className="mt-0.5 text-muted-foreground">
        {icon}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="line-clamp-none">{title}</ItemTitle>
        <ItemDescription className="line-clamp-none">{description}</ItemDescription>
      </ItemContent>
      <ItemActions className="basis-full justify-start sm:ml-auto sm:basis-auto sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
        {action}
      </ItemActions>
    </Item>
  )
}

function EditableProfileRow({
  children,
  description,
  icon,
  title,
}: {
  children: React.ReactNode
  description: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <Item variant="default" className="items-start gap-3 px-0 py-0">
      <ItemMedia variant="icon" className="mt-0.5 text-muted-foreground">
        {icon}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription className="line-clamp-none">{description}</ItemDescription>
      </ItemContent>
      <ItemActions className="basis-full justify-start sm:ml-auto sm:basis-auto sm:justify-end">
        <div className="w-full sm:min-w-[320px]">{children}</div>
      </ItemActions>
    </Item>
  )
}

function ProtectedProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Item variant="default" className="items-start gap-3 px-0 py-0">
      <ItemMedia variant="icon" className="mt-0.5 text-muted-foreground">
        {icon}
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{label}</ItemTitle>
        <ItemDescription className="line-clamp-none">{myProfileCopy.profile.protectedDescription}</ItemDescription>
      </ItemContent>
      <ItemActions className="basis-full sm:ml-auto sm:basis-auto">
        <Input className="w-full sm:min-w-[260px]" value={value} disabled readOnly />
      </ItemActions>
    </Item>
  )
}

function ProfileOverviewCard({
  onOpenPasswordDialog,
  onOpenPhotoDialog,
  profile,
}: Pick<ProfileFormCardProps, "onOpenPasswordDialog" | "onOpenPhotoDialog" | "profile">) {
  const statusTone = getProfileStatusTone(profile.status)

  return (
    <Card>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-24 text-xl">
            {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
            <AvatarFallback>{getProfileInitials(profile.name)}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 gap-2">
            <div className="grid gap-1">
              <h2 className="break-words text-lg font-semibold text-foreground">{profile.name}</h2>
              <p className="break-all text-sm text-muted-foreground">{resolveProfileEmail(profile.email)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className={getBadgeToneClassName(statusTone)}>
                {myProfileCopy.profile.statusLabels[profile.status]}
              </Badge>
              <Badge variant="secondary">{resolveProfileRole(profile.roleLabel)}</Badge>
            </div>
          </div>
        </div>

        <ItemGroup className="gap-4">
          <ProfileActionRow
            title={myProfileCopy.profile.avatarTitle}
            description={myProfileCopy.profile.avatarHint}
            icon={<ImageUpIcon aria-hidden="true" />}
            action={(
              <Button type="button" variant="secondary" size="sm" onClick={onOpenPhotoDialog}>
                <ImageUpIcon aria-hidden="true" />
                {myProfileCopy.profile.avatarAction}
              </Button>
            )}
          />
          <ItemSeparator className="my-0" />
          <ProfileActionRow
            title={myProfileCopy.changePassword.title}
            description={myProfileCopy.changePassword.hint}
            icon={<KeyRoundIcon aria-hidden="true" />}
            action={(
              <Button type="button" variant="secondary" size="sm" onClick={onOpenPasswordDialog}>
                <KeyRoundIcon aria-hidden="true" />
                {myProfileCopy.changePassword.action}
              </Button>
            )}
          />
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

export function ProfileFormCard({
  isSaving = false,
  onOpenPasswordDialog,
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
    <div className="grid gap-4">
      <ProfileOverviewCard
        profile={profile}
        onOpenPhotoDialog={onOpenPhotoDialog}
        onOpenPasswordDialog={onOpenPasswordDialog}
      />

      <Card>
        <CardHeader>
          <CardTitle>{myProfileCopy.profile.sectionTitle}</CardTitle>
          <CardDescription>{myProfileCopy.profile.editDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={(event) => { void handleSubmit(event) }}>
            <ItemGroup className="gap-4">
              <EditableProfileRow
                title={myProfileCopy.profile.fields.name}
                description={myProfileCopy.profile.fieldDescriptions.name}
                icon={<UserRoundIcon aria-hidden="true" />}
              >
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
              </EditableProfileRow>

              <ItemSeparator className="my-0" />

              <EditableProfileRow
                title={myProfileCopy.profile.fields.email}
                description={myProfileCopy.profile.fieldDescriptions.email}
                icon={<MailIcon aria-hidden="true" />}
              >
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
              </EditableProfileRow>

              <ItemSeparator className="my-0" />

              <EditableProfileRow
                title={myProfileCopy.profile.fields.phone}
                description={myProfileCopy.profile.fieldDescriptions.phone}
                icon={<PhoneIcon aria-hidden="true" />}
              >
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
              </EditableProfileRow>
            </ItemGroup>

            {hasChanges ? (
              <div className="flex justify-end">
                <Button type="submit" variant="secondary" size="lg" className="w-full sm:w-auto" disabled={isSaving}>
                  {isSaving ? <Spinner data-icon="inline-start" /> : <SaveIcon aria-hidden="true" />}
                  {isSaving ? myProfileCopy.profile.saving : myProfileCopy.profile.save}
                </Button>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{myProfileCopy.profile.protectedTitle}</CardTitle>
          <CardDescription>{myProfileCopy.profile.protectedDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemGroup className="gap-4">
            <ProtectedProfileRow
              icon={<IdCardIcon aria-hidden="true" />}
              label={myProfileCopy.profile.fields.cpf}
              value={resolveProfileCpf(profile.cpfMasked)}
            />
            <ItemSeparator className="my-0" />
            <ProtectedProfileRow
              icon={<ShieldCheckIcon aria-hidden="true" />}
              label={myProfileCopy.profile.fields.role}
              value={resolveProfileRole(profile.roleLabel)}
            />
            <ItemSeparator className="my-0" />
            <ProtectedProfileRow
              icon={<Building2Icon aria-hidden="true" />}
              label={myProfileCopy.profile.fields.unit}
              value={resolveDisplayValue(profile.unitLabel)}
            />
            <ItemSeparator className="my-0" />
            <ProtectedProfileRow
              icon={<ShieldCheckIcon aria-hidden="true" />}
              label={myProfileCopy.profile.fields.status}
              value={myProfileCopy.profile.statusLabels[profile.status]}
            />
          </ItemGroup>
        </CardContent>
      </Card>
    </div>
  )
}
