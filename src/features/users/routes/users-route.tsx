import { zodResolver } from "@hookform/resolvers/zod"
import {
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"

import {
  appUserStatusLabels,
  AuthCpfField,
  AuthPasswordField,
  isGlobalRole,
  userRoleLabels,
  userRoleValues,
} from "@/features/auth"
import { useUnits } from "@/features/units"
import {
  formatPhone,
  onlyDigits,
} from "@/lib"
import { preventDialogCloseOnFloatingLayerInteraction } from "@/lib/dialog-interactions"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
import { PageHeader, PageSection } from "@/components/page"
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
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroupAddon } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { createUsersColumns } from "../columns/users-columns"
import { useUsers } from "../hooks/use-users"
import {
  usersFormSchema,
  type UsersFormValues,
} from "../schemas/users-form-schema"
import { type UserRecord } from "../types/users-types"
import { usersCopy } from "../users-copy"
import { interpolateUserCopy } from "../utils/users-models"

const USERS_TABLE_COLUMN_VISIBILITY_KEY = "rmc.table.users.columns.v1"
const USERS_DIALOG_FORM_ID = "users-dialog-form"

interface UnitOption {
  label: string
  value: string
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

export function UsersRoute() {
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
  } = useUsers()
  const { data: units } = useUnits()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null)
  const [blockingUser, setBlockingUser] = React.useState<UserRecord | null>(null)

  const form = useForm<UsersFormValues>({
    resolver: zodResolver(usersFormSchema),
    mode: "onSubmit",
    defaultValues: createDefaultFormValues(),
  })

  const isEditMode = editingUser !== null
  const selectedRole = form.watch("role")
  const isGlobalScopeRole = isGlobalRole(selectedRole)

  const roleOptions = React.useMemo(
    () =>
      createDataTableFilterOptions(
        data,
        (user) => user.role,
        (user) => userRoleLabels[user.role]
      ),
    [data]
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

  const handleBlockUser = React.useCallback((user: UserRecord) => {
    void notify.track(inactivateUser(user.id), {
      loading: usersCopy.feedback.block.loading,
      success: usersCopy.feedback.block.success,
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : usersCopy.feedback.block.error,
    })
  }, [inactivateUser])

  const handleResetAccess = React.useCallback((user: UserRecord) => {
    void notify.track(resetAccess(user.id), {
      loading: usersCopy.feedback.reset.loading,
      success: usersCopy.feedback.reset.success,
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : usersCopy.feedback.reset.error,
    })
  }, [resetAccess])

  const columns = React.useMemo(
    () =>
      createUsersColumns({
        onBlockUser: (user) => {
          setBlockingUser(user)
        },
        onEditUser: handleOpenEditDialog,
        onResetAccess: handleResetAccess,
      }),
    [handleOpenEditDialog, handleResetAccess]
  )

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

  return (
    <PageSection>
      <PageHeader
        title={usersCopy.page.title}
        subtitle={usersCopy.page.subtitle}
        actions={(
          <Button
            type="button"
            variant="secondary"
            onClick={handleOpenCreateDialog}
          >
            <PlusIcon aria-hidden="true" />
            {usersCopy.actions.create}
          </Button>
        )}
      />

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          onInteractOutside={(event) => {
            preventDialogCloseOnFloatingLayerInteraction(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? usersCopy.dialogs.editTitle : usersCopy.dialogs.createTitle}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? usersCopy.dialogs.editDescription
                : usersCopy.dialogs.createDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
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
                        {usersCopy.form.fields.name}{" "}
                        <span className="text-destructive">{usersCopy.form.requiredMark}</span>
                      </FieldLabel>
                      <Input
                        id="user-name"
                        className="w-full"
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
                    <AuthCpfField
                      id="user-cpf"
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSaving}
                      error={fieldState.error?.message}
                    />
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
                        className="w-full"
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
                      <FieldLabel htmlFor="user-phone">{usersCopy.form.fields.phone}</FieldLabel>
                      <Input
                        id="user-phone"
                        className="w-full"
                        value={field.value}
                        onChange={(event) => {
                          field.onChange(formatPhone(onlyDigits(event.target.value)))
                        }}
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
                  name="role"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={Boolean(fieldState.error)}>
                      <FieldLabel>
                        {usersCopy.form.roleLabel}{" "}
                        <span className="text-destructive">{usersCopy.form.requiredMark}</span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)

                          if (isGlobalRole(value as UserRecord["role"])) {
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
                          className="w-full"
                          aria-invalid={Boolean(fieldState.error)}
                        >
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {userRoleValues.map((role) => (
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
                        {!isGlobalScopeRole ? (
                          <span className="text-destructive"> *</span>
                        ) : null}
                      </FieldLabel>
                      <Combobox<UnitOption>
                        items={unitOptions}
                        value={
                          isGlobalScopeRole
                            ? null
                            : unitOptions.find((unit) => unit.value === field.value) ||
                            null
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
                          className="w-full"
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
                    <AuthPasswordField
                      id="user-password"
                      label={usersCopy.form.passwordLabel}
                      value={field.value}
                      onValueChange={field.onChange}
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
          </div>
          <DialogFooter className="grid grid-cols-2 sm:grid-cols-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full">
                {usersCopy.dialogs.cancel}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form={USERS_DIALOG_FORM_ID}
              className="w-full"
              disabled={isSaving}
            >
              {isEditMode ? usersCopy.actions.save : usersCopy.actions.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        ]}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          void refetch()
        }}
        enablePagination
        enableViewOptions
      />

      <DestructiveConfirmDialog
        size="sm"
        open={Boolean(blockingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockingUser(null)
          }
        }}
        title={usersCopy.dialogs.blockTitle}
        description={blockingUser
          ? interpolateUserCopy(usersCopy.dialogs.blockDescription, {
            name: blockingUser.name,
          })
          : usersCopy.dialogs.blockDescriptionFallback}
        confirmLabel={usersCopy.dialogs.blockConfirm}
        onConfirm={() => {
          if (!blockingUser) {
            return
          }

          handleBlockUser(blockingUser)
          setBlockingUser(null)
        }}
      />
    </PageSection>
  )
}
