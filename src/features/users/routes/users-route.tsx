import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, SearchIcon, ShieldAlertIcon } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { useSearchParams } from "react-router"

import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppDialog } from "@/components/shared/app-dialog"
import { AppPasswordField } from "@/components/shared/app-password-field"
import { AppDetailsSheet, type AppDetailsSheetItem } from "@/components/shared/app-details-sheet"
import {
  createDataTableFilterOptions,
  DataTable,
  type DataTableStateAction,
} from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { notify } from "@/components/toast"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccessRequestsPanel, accessRequestsCopy } from "@/features/access-requests"
import { AUTH_PERMISSION, AUTH_ROLE_KEY } from "@/features/auth"
import { useAuth } from "@/features/auth"
import { formatCpfInput } from "@/features/auth/validation"
import { useUnits } from "@/features/units"
import { formatPhone, getSupabaseBrowserClient, onlyDigits } from "@/lib"
import { preventDialogCloseOnFloatingLayerInteraction } from "@/lib/dialog-interactions"
import { shouldBypassAuthInDev } from "@/config"

import { createUsersColumns } from "../columns/users-columns"
import { useUsers } from "../hooks/use-users"
import { usersFormSchema, type UsersFormValues } from "../schemas/users-form-schema"
import {
  appUserStatusLabels,
  isGlobalRole,
  type UserRecord,
  userRoleLabels,
  userRoleValues,
} from "../types/users-types"
import { usersCopy } from "../users-copy"
import {
  interpolateUserCopy,
  resolveEmailLabel,
  resolveLastAccessLabel,
  resolvePasskeyLabel,
  resolveUnitLabel,
} from "../utils/users-models"

const USERS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.users.columns.v1"
const USERS_DIALOG_FORM_ID = "users-dialog-form"
const USERS_TAB_VALUE = "usuarios"
const ACCESS_REQUESTS_TAB_VALUE = "solicitacoes"

interface UnitOption {
  label: string
  value: string
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

function getUserDetailItems(user: UserRecord): readonly AppDetailsSheetItem[] {
  return [
    { label: usersCopy.form.fields.name, value: user.name },
    { label: usersCopy.form.fields.cpf, value: user.cpf },
    { label: usersCopy.form.fields.email, value: resolveEmailLabel(user.email) },
    { label: usersCopy.form.fields.phone, value: user.phoneMasked || "—" },
    { label: usersCopy.form.roleLabel, value: userRoleLabels[user.role] },
    { label: usersCopy.filters.status, value: appUserStatusLabels[user.status] },
    { label: usersCopy.form.unitLabel, value: resolveUnitLabel(user.unitName) },
    { label: usersCopy.details.passkeyLabel, value: resolvePasskeyLabel(user.passkeyStatus) },
    { label: usersCopy.details.lastAccessLabel, value: resolveLastAccessLabel(user.lastAccessAt) },
  ]
}

function UserDetailsSheet({
  user,
  onOpenChange,
}: {
  user: UserRecord | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AppDetailsSheet
      open={Boolean(user)}
      onOpenChange={onOpenChange}
      title={user?.name ?? usersCopy.details.title}
      description={user ? resolveEmailLabel(user.email) : undefined}
      items={user ? getUserDetailItems(user) : []}
    />
  )
}

export function UsersRoute() {
  const auth = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const remoteMode = Boolean(getSupabaseBrowserClient()) && !shouldBypassAuthInDev()
  const {
    data,
    error,
    isLoading,
    isSaving,
    addUser,
    editUser,
    inactivateUser,
    refetch,
    resetAccess,
    resetPasskey,
    clearLock,
    revokeSessions,
  } = useUsers()
  const unitsSnapshot = useUnits()
  const units = unitsSnapshot.data
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null)
  const [detailsUser, setDetailsUser] = React.useState<UserRecord | null>(null)
  const [pendingAction, setPendingAction] = React.useState<{
    type: "block" | "reset" | "resetPasskey" | "clearLock" | "revokeSessions"
    user: UserRecord
  } | null>(null)

  const form = useForm<UsersFormValues>({
    resolver: zodResolver(usersFormSchema),
    mode: "onSubmit",
    defaultValues: createDefaultFormValues(),
  })

  const isEditMode = editingUser !== null
  const selectedRole = form.watch("role")
  const isGlobalScopeRole = isGlobalRole(selectedRole)
  const canAssignOwnerRole =
    auth.profile?.role?.key === AUTH_ROLE_KEY.owner ||
    auth.access.hasPermission(AUTH_PERMISSION.all)
  const canReadUsers = auth.access.hasPermission(AUTH_PERMISSION.usersRead)
  const canManageUsers = auth.access.hasPermission(AUTH_PERMISSION.usersManage)
  const canCreateUsers = canManageUsers
  const canEditUsers = canManageUsers
  const canBlockUsers = canManageUsers
  const canResetPasswords = canManageUsers
  const canResetPasskeys = canManageUsers
  const canClearLocks = canManageUsers
  const canRevokeUserSessions = canManageUsers
  const canExportUsers = canReadUsers
  const canReadAccessRequests =
    auth.access.hasPermission(AUTH_PERMISSION.accessRequestsRead)
  const canReviewAccessRequests =
    auth.access.hasPermission(AUTH_PERMISSION.accessRequestsReview)
  const selectedTab =
    canReadAccessRequests &&
    searchParams.get("tab") === ACCESS_REQUESTS_TAB_VALUE
      ? ACCESS_REQUESTS_TAB_VALUE
      : USERS_TAB_VALUE

  const handleUsersTabChange = React.useCallback(
    (value: string) => {
      const nextSearchParams = new URLSearchParams(searchParams)

      if (value === ACCESS_REQUESTS_TAB_VALUE && canReadAccessRequests) {
        nextSearchParams.set("tab", ACCESS_REQUESTS_TAB_VALUE)
      } else {
        nextSearchParams.delete("tab")
      }

      setSearchParams(nextSearchParams, { replace: true })
    },
    [canReadAccessRequests, searchParams, setSearchParams]
  )

  React.useEffect(() => {
    if (
      canReadAccessRequests ||
      searchParams.get("tab") !== ACCESS_REQUESTS_TAB_VALUE
    ) {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete("tab")
    setSearchParams(nextSearchParams, { replace: true })
  }, [canReadAccessRequests, searchParams, setSearchParams])

  const assignableRoleValues = React.useMemo(
    () =>
      canAssignOwnerRole
        ? userRoleValues
        : userRoleValues.filter((role) => role !== AUTH_ROLE_KEY.owner),
    [canAssignOwnerRole]
  )

  const roleOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data.filter((user) => canAssignOwnerRole || user.role !== AUTH_ROLE_KEY.owner),
        (user) => user.role,
        (user) => userRoleLabels[user.role]
      ),
    [canAssignOwnerRole, data]
  )

  const statusOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data,
        (user) => user.status,
        (user) => appUserStatusLabels[user.status]
      ),
    [data]
  )

  const unitFilterOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data,
        (user) => user.unitName ?? "",
        (user) => resolveUnitLabel(user.unitName),
        {
          emptyOption: {
            label: usersCopy.details.globalUnit,
            value: "",
          },
        }
      ),
    [data]
  )

  const unitOptions = React.useMemo<UnitOption[]>(() => {
    return units.map((unit) => ({
      label: unit.nom_fantasia,
      value: String(unit.cod_empresa),
    }))
  }, [units])

  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    setIsDialogOpen(open)

    if (!open) {
      setEditingUser(null)
      form.reset(createDefaultFormValues())
    }
  }, [form])

  const handleOpenCreateDialog = React.useCallback(() => {
    setEditingUser(null)
    form.reset(createDefaultFormValues())
    setIsDialogOpen(true)
  }, [form])

  const handleOpenEditDialog = React.useCallback((user: UserRecord) => {
    setEditingUser(user)
    form.reset(mapUserToFormValues(user))
    setIsDialogOpen(true)
  }, [form])

  const handleBlockUser = React.useCallback(async (user: UserRecord) => {
    await notify.track(inactivateUser(user.id), {
      loading: usersCopy.feedback.block.loading,
      success: usersCopy.feedback.block.success,
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : usersCopy.feedback.block.error,
    })
  }, [inactivateUser])

  const handleResetAccess = React.useCallback(async (user: UserRecord) => {
    await notify.track(resetAccess(user.id), {
      loading: usersCopy.feedback.reset.loading,
      success: usersCopy.feedback.reset.success,
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : usersCopy.feedback.reset.error,
    })
  }, [resetAccess])

  const handleResetPasskey = React.useCallback(async (user: UserRecord) => {
    await notify.track(resetPasskey(user.id), {
      loading: usersCopy.feedback.resetPasskey.loading,
      success: usersCopy.feedback.resetPasskey.success,
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : usersCopy.feedback.resetPasskey.error,
    })
  }, [resetPasskey])

  const handleClearLock = React.useCallback(async (user: UserRecord) => {
    await notify.track(clearLock(user.id), {
      loading: usersCopy.feedback.clearLock.loading,
      success: usersCopy.feedback.clearLock.success,
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : usersCopy.feedback.clearLock.error,
    })
  }, [clearLock])

  const handleRevokeSessions = React.useCallback(async (user: UserRecord) => {
    await notify.track(revokeSessions(user.id), {
      loading: usersCopy.feedback.revokeSessions.loading,
      success: usersCopy.feedback.revokeSessions.success,
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : usersCopy.feedback.revokeSessions.error,
    })
  }, [revokeSessions])

  const pendingActionConfig = React.useMemo(() => {
    if (!pendingAction) {
      return null
    }

    const { type, user } = pendingAction

    if (type === "block") {
      return {
        title: usersCopy.dialogs.blockTitle,
        description: interpolateUserCopy(usersCopy.dialogs.blockDescription, {
          name: user.name,
        }),
        confirmLabel: usersCopy.dialogs.blockConfirm,
        onConfirm: () => handleBlockUser(user),
      }
    }

    if (type === "reset") {
      return {
        title: usersCopy.dialogs.resetTitle,
        description: interpolateUserCopy(usersCopy.dialogs.resetDescription, {
          name: user.name,
        }),
        confirmLabel: usersCopy.dialogs.resetConfirm,
        onConfirm: () => handleResetAccess(user),
      }
    }

    if (type === "resetPasskey") {
      return {
        title: usersCopy.dialogs.resetPasskeyTitle,
        description: interpolateUserCopy(usersCopy.dialogs.resetPasskeyDescription, {
          name: user.name,
        }),
        confirmLabel: usersCopy.dialogs.resetPasskeyConfirm,
        onConfirm: () => handleResetPasskey(user),
      }
    }

    if (type === "clearLock") {
      const isBlocked = user.status === "inactive"

      return {
        title: isBlocked
          ? usersCopy.dialogs.unblockTitle
          : usersCopy.dialogs.clearLockTitle,
        description: interpolateUserCopy(
          isBlocked
            ? usersCopy.dialogs.unblockDescription
            : usersCopy.dialogs.clearLockDescription,
          { name: user.name }
        ),
        confirmLabel: isBlocked
          ? usersCopy.dialogs.unblockConfirm
          : usersCopy.dialogs.clearLockConfirm,
        onConfirm: () => handleClearLock(user),
      }
    }

    return {
      title: usersCopy.dialogs.revokeSessionsTitle,
      description: interpolateUserCopy(usersCopy.dialogs.revokeSessionsDescription, {
        name: user.name,
      }),
      confirmLabel: usersCopy.dialogs.revokeSessionsConfirm,
      onConfirm: () => handleRevokeSessions(user),
    }
  }, [
    handleBlockUser,
    handleClearLock,
    handleResetAccess,
    handleResetPasskey,
    handleRevokeSessions,
    pendingAction,
  ])

  const columns = React.useMemo(
    () =>
      createUsersColumns({
        canBlockUser: canBlockUsers,
        canClearLock: canClearLocks,
        canEditUser: canEditUsers,
        canResetPasskey: canResetPasskeys,
        canResetPassword: canResetPasswords,
        canRevokeSessions: canRevokeUserSessions,
        canManageOwnerUser: canAssignOwnerRole,
        currentAuthUserId: auth.profile?.authUserId ?? null,
        onViewUserDetails: setDetailsUser,
        onBlockUser: (user) => {
          setPendingAction({ type: "block", user })
        },
        onClearLock: (user) => {
          setPendingAction({ type: "clearLock", user })
        },
        onEditUser: handleOpenEditDialog,
        onResetAccess: (user) => {
          setPendingAction({ type: "reset", user })
        },
        onResetPasskey: (user) => {
          setPendingAction({ type: "resetPasskey", user })
        },
        onRevokeSessions: (user) => {
          setPendingAction({ type: "revokeSessions", user })
        },
        remoteMode,
      }),
    [
      canBlockUsers,
      canClearLocks,
      canEditUsers,
      canResetPasskeys,
      canResetPasswords,
      canAssignOwnerRole,
      canRevokeUserSessions,
      auth.profile?.authUserId,
      handleOpenEditDialog,
      remoteMode,
    ]
  )

  const emptyAction = React.useMemo<DataTableStateAction | undefined>(() => {
    if (!canCreateUsers) {
      return undefined
    }

    return {
      label: usersCopy.table.emptyAction,
      icon: <PlusIcon aria-hidden="true" />,
      onClick: handleOpenCreateDialog,
    }
  }, [canCreateUsers, handleOpenCreateDialog])

  async function handleSubmit(values: UsersFormValues) {
    try {
      if (values.mode === "edit" && values.id) {
        await notify.track(
          editUser({
            cpf: values.cpf,
            email: values.email,
            firstAccessPassword: values.firstAccessPassword,
            id: values.id,
            name: values.name,
            phone: values.phone,
            role: values.role,
            unitId: values.unitId,
            unitName: values.unitName,
          }),
          {
            loading: usersCopy.feedback.update.loading,
            success: usersCopy.feedback.update.success,
            error: usersCopy.feedback.update.error,
          }
        )
      } else {
        await notify.track(
          addUser({
            cpf: values.cpf,
            email: values.email,
            firstAccessPassword: values.firstAccessPassword,
            name: values.name,
            phone: values.phone,
            role: values.role,
            unitId: values.unitId,
            unitName: values.unitName,
          }),
          {
            loading: usersCopy.feedback.create.loading,
            success: usersCopy.feedback.create.success,
            error: usersCopy.feedback.create.error,
          }
        )
      }

      handleDialogOpenChange(false)
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        return
      }
    }
  }

  const usersTable = (
    <DataTable
      columns={columns}
      data={data}
      columnVisibilityStorageKey={USERS_TABLE_COLUMN_VISIBILITY_KEY}
      getRowId={(user) => user.id}
      globalSearch={{
        columnIds: [
          "id",
          "name",
          "cpf",
          "email",
          "phoneMasked",
          "role",
          "status",
          "unitName",
          "passkeyStatus",
        ],
        placeholder: usersCopy.filters.searchPlaceholder,
      }}
      filterFields={[
        {
          id: "role",
          title: usersCopy.filters.role,
          options: roleOptions,
        },
        {
          id: "status",
          title: usersCopy.filters.status,
          options: statusOptions,
        },
        {
          id: "unitName",
          title: usersCopy.filters.unit,
          options: unitFilterOptions,
        },
      ]}
      emptyAction={emptyAction}
      isLoading={isLoading}
      error={error}
      onRetry={() => {
        void refetch()
      }}
      enablePagination
      enableExport={canExportUsers}
      enableViewOptions
    />
  )

  return (
    <PageSection>
      <PageHeader
        title={usersCopy.page.title}
        subtitle={usersCopy.page.subtitle}
        actions={
          canCreateUsers && selectedTab === USERS_TAB_VALUE ? (
            <PageHeaderActions>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleOpenCreateDialog}
              >
                <PlusIcon aria-hidden="true" />
                {usersCopy.actions.create}
              </Button>
            </PageHeaderActions>
          ) : null
        }
      />

      <AppDialog
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={isEditMode ? usersCopy.dialogs.editTitle : usersCopy.dialogs.createTitle}
        description={isEditMode ? usersCopy.dialogs.editDescription : usersCopy.dialogs.createDescription}
        contentProps={{
          onInteractOutside: preventDialogCloseOnFloatingLayerInteraction,
        }}
        footer={
          <div className="grid w-full grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleDialogOpenChange(false)}
            >
              {usersCopy.dialogs.cancel}
            </Button>
            <Button
              type="submit"
              form={USERS_DIALOG_FORM_ID}
              size="lg"
              disabled={isSaving}
            >
              {isEditMode ? usersCopy.actions.save : usersCopy.actions.create}
            </Button>
          </div>
        }
      >
        <form
          id={USERS_DIALOG_FORM_ID}
          onSubmit={(event) => {
            void form.handleSubmit(handleSubmit)(event)
          }}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <FieldLabel htmlFor="user-name">
                    {usersCopy.form.fields.name}
                    <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="user-name"
                    className="h-9 w-full"
                    placeholder={usersCopy.form.placeholders.name}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldState.error)}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="cpf"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <FieldLabel htmlFor="user-cpf">
                    {usersCopy.form.fields.cpf}
                    <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="user-cpf"
                    className="h-9 w-full"
                    value={field.value}
                    onChange={(event) => field.onChange(formatCpfInput(event.target.value))}
                    disabled={isSaving}
                    inputMode="numeric"
                    autoComplete="username"
                    aria-invalid={Boolean(fieldState.error)}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <FieldLabel htmlFor="user-email">{usersCopy.form.fields.email}</FieldLabel>
                  <Input
                    id="user-email"
                    type="email"
                    className="h-9 w-full"
                    placeholder={usersCopy.form.placeholders.email}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSaving}
                    aria-invalid={Boolean(fieldState.error)}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <FieldLabel htmlFor="user-phone">
                    {usersCopy.form.fields.phone}
                    <RequiredMark />
                  </FieldLabel>
                  <Input
                    id="user-phone"
                    className="h-9 w-full"
                    placeholder={usersCopy.form.placeholders.phone}
                    value={field.value}
                    onChange={(event) => {
                      field.onChange(formatPhone(onlyDigits(event.target.value)))
                    }}
                    disabled={isSaving}
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={Boolean(fieldState.error)}
                  />
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="role"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <FieldLabel>
                    {usersCopy.form.roleLabel}
                    <RequiredMark />
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)

                      if (isGlobalRole(value)) {
                        form.setValue("unitId", "", {
                          shouldDirty: true,
                          shouldValidate: false,
                        })
                        form.setValue("unitName", "", {
                          shouldDirty: true,
                          shouldValidate: false,
                        })
                      }
                    }}
                    disabled={isSaving}
                  >
                    <SelectTrigger
                      className="w-full data-[size=default]:h-9"
                      aria-invalid={Boolean(fieldState.error)}
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
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="unitId"
              render={({ field, fieldState }) => (
                <Field data-invalid={Boolean(fieldState.error)}>
                  <FieldLabel htmlFor="user-unit">
                    {usersCopy.form.unitLabel}
                    {!isGlobalScopeRole ? <RequiredMark /> : null}
                  </FieldLabel>
                  <Combobox<UnitOption>
                    items={unitOptions}
                    value={
                      isGlobalScopeRole
                        ? null
                        : unitOptions.find((unit) => unit.value === field.value) || null
                    }
                    onValueChange={(value) => {
                      field.onChange(value?.value || "")
                      form.setValue("unitName", value?.label || "", {
                        shouldDirty: true,
                        shouldValidate: false,
                      })
                    }}
                    itemToStringLabel={(unit) => unit.label}
                    itemToStringValue={(unit) => `${unit.value} ${unit.label}`}
                    disabled={isSaving || isGlobalScopeRole}
                  >
                    <ComboboxInput
                      id="user-unit"
                      className="h-9 w-full"
                      placeholder={
                        isGlobalScopeRole
                          ? usersCopy.form.globalUnitPlaceholder
                          : usersCopy.form.unitPlaceholder
                      }
                      disabled={isSaving || isGlobalScopeRole}
                      aria-invalid={Boolean(fieldState.error)}
                    >
                      <InputGroupAddon>
                        <SearchIcon />
                      </InputGroupAddon>
                    </ComboboxInput>
                    <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                      <ComboboxEmpty>{usersCopy.form.unitEmpty}</ComboboxEmpty>
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
                  {isGlobalScopeRole ? (
                    <p className="text-xs text-muted-foreground">
                      {usersCopy.form.globalScopeHint}
                    </p>
                  ) : null}
                  {fieldState.error ? (
                    <FieldError>{fieldState.error.message}</FieldError>
                  ) : null}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="firstAccessPassword"
              render={({ field, fieldState }) => (
                <AppPasswordField
                  id="user-password"
                  label={usersCopy.form.passwordLabel}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSaving}
                  autoComplete="new-password"
                  description={usersCopy.form.passwordDescription}
                  required={!isEditMode}
                />
              )}
            />
          </FieldGroup>
        </form>
      </AppDialog>

      {canReadAccessRequests ? (
        <Tabs
          value={selectedTab}
          onValueChange={handleUsersTabChange}
          className="min-h-0 flex-1"
        >
          <TabsList>
            <TabsTrigger value={USERS_TAB_VALUE}>
              {usersCopy.page.title}
            </TabsTrigger>
            <TabsTrigger value={ACCESS_REQUESTS_TAB_VALUE}>
              {accessRequestsCopy.page.title}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value={USERS_TAB_VALUE}
            className="min-h-0 flex-1 data-[state=active]:flex data-[state=inactive]:hidden"
          >
            {usersTable}
          </TabsContent>
          <TabsContent
            value={ACCESS_REQUESTS_TAB_VALUE}
            className="min-h-0 flex-1 data-[state=active]:flex data-[state=inactive]:hidden"
          >
            <AccessRequestsPanel
              canReview={canReviewAccessRequests}
              showHeader={false}
            />
          </TabsContent>
        </Tabs>
      ) : (
        usersTable
      )}

      <UserDetailsSheet
        user={detailsUser}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsUser(null)
          }
        }}
      />

      <AppAlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingAction(null)
          }
        }}
        media={<ShieldAlertIcon />}
        title={pendingActionConfig?.title ?? ""}
        description={pendingActionConfig?.description ?? ""}
        cancelLabel={usersCopy.dialogs.cancel}
        actionLabel={pendingActionConfig?.confirmLabel}
        onAction={async () => {
          if (!pendingActionConfig) {
            return
          }

          try {
            await pendingActionConfig.onConfirm()
            setPendingAction(null)
          } catch {
            return
          }
        }}
      />
    </PageSection>
  )
}
