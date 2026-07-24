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
import {
  formatPhone,
  onlyDigits,
} from "@/lib"

import {
  createDataTableFilterOptions,
  DataTable,
} from "@/components/data-table"
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
import { DestructiveConfirmDialog } from "@/components/ui/destructive-confirm-dialog"
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

const availableUnitOptions = [
  "Centro",
  "Zona Sul",
  "Zona Norte",
  "Leste",
  "Oeste",
] as const

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
    unitName: user.unitName || "",
  }
}

function getPasswordDescription() {
  return "A senha de primeiro acesso é utilizada apenas na primeira vez que o usuário acessar o sistema. Após o primeiro acesso, o usuário será solicitado a criar uma nova senha."
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

  const unitOptions = React.useMemo(() => {
    const dynamicUnits = data
      .map((user) => user.unitName)
      .filter((unitName): unitName is string => Boolean(unitName))

    return Array.from(new Set([...availableUnitOptions, ...dynamicUnits]))
  }, [data])

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
    void notify.promise(inactivateUser(user.id), {
      loading: "Bloqueando usuário...",
      success: "Usuário bloqueado.",
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível bloquear o usuário.",
    })
  }, [inactivateUser])

  const handleResetAccess = React.useCallback((user: UserRecord) => {
    void notify.promise(resetAccess(user.id), {
      loading: "Resetando autenticação...",
      success: "Autenticação resetada.",
      error: (caughtError) =>
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível resetar a autenticação.",
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
    const parseResult = usersFormSchema.safeParse(values)

    if (!parseResult.success) {
      parseResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]

        if (typeof fieldName === "string") {
          form.setError(fieldName as keyof UsersFormValues, {
            message: issue.message,
            type: "validate",
          })
        }
      })

      return
    }

    try {
      if (parseResult.data.mode === "edit" && parseResult.data.id) {
        await editUser({
          cpf: parseResult.data.cpf,
          email: parseResult.data.email,
          firstAccessPassword: parseResult.data.firstAccessPassword,
          id: parseResult.data.id,
          name: parseResult.data.name,
          phone: parseResult.data.phone,
          role: parseResult.data.role,
          unitName: parseResult.data.unitName,
        })

        notify.success("Usuário atualizado.")
      } else {
        await addUser({
          cpf: parseResult.data.cpf,
          email: parseResult.data.email,
          firstAccessPassword: parseResult.data.firstAccessPassword,
          name: parseResult.data.name,
          phone: parseResult.data.phone,
          role: parseResult.data.role,
          unitName: parseResult.data.unitName,
        })

        notify.success("Usuário cadastrado.")
      }

      handleDialogOpenChange(false)
    } catch (caughtError) {
      notify.error(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível salvar o usuário."
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie os usuários com acesso ao sistema.
          </p>
        </div>

        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={handleOpenCreateDialog}
          >
            <PlusIcon aria-hidden="true" />
            Cadastrar
          </Button>
        </div>
      </header>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar usuário" : "Novo usuário"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Atualize os dados de acesso do usuário."
                : "Cadastre um novo usuário para acesso ao sistema."}
            </DialogDescription>
          </DialogHeader>

          <form
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
                      Nome <span className="text-destructive">*</span>
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
                    <FieldLabel htmlFor="user-email">Email</FieldLabel>
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
                    <FieldLabel htmlFor="user-phone">Telefone</FieldLabel>
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
                      Perfil <span className="text-destructive">*</span>
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)

                        if (isGlobalRole(value as UserRecord["role"])) {
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
                name="unitName"
                render={({ field, fieldState }) => (
                  <Field data-invalid={Boolean(fieldState.error)}>
                    <FieldLabel htmlFor="user-unit">
                      Unidade
                      {!isGlobalScopeRole ? (
                        <span className="text-destructive"> *</span>
                      ) : null}
                    </FieldLabel>
                    <Combobox<string>
                      items={unitOptions}
                      value={isGlobalScopeRole ? null : field.value || null}
                      onValueChange={(value) => field.onChange(value || "")}
                      itemToStringLabel={(unit) => unit}
                      itemToStringValue={(unit) => unit}
                      disabled={isSaving || isGlobalScopeRole}
                    >
                      <ComboboxInput
                        id="user-unit"
                        className="w-full"
                        placeholder={
                          isGlobalScopeRole
                            ? "Global (todas as unidades)"
                            : "Buscar unidade..."
                        }
                        disabled={isSaving || isGlobalScopeRole}
                        aria-invalid={Boolean(fieldState.error)}
                      >
                        <InputGroupAddon>
                          <SearchIcon />
                        </InputGroupAddon>
                      </ComboboxInput>
                      <ComboboxContent className="w-(--anchor-width) min-w-(--anchor-width)">
                        <ComboboxEmpty>Nenhuma unidade encontrada.</ComboboxEmpty>
                        <ComboboxList>
                          <ComboboxCollection>
                            {(unit: string) => (
                              <ComboboxItem key={unit} value={unit}>
                                {unit}
                              </ComboboxItem>
                            )}
                          </ComboboxCollection>
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    {isGlobalScopeRole ? (
                      <p className="text-xs text-muted-foreground">
                        Este perfil possui escopo global.
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
                    label="Senha de primeiro acesso"
                    value={field.value}
                    onValueChange={field.onChange}
                    error={fieldState.error?.message}
                    disabled={isSaving}
                    autoComplete="new-password"
                    description={getPasswordDescription()}
                    required={!isEditMode}
                  />
                )}
              />
            </FieldGroup>

            <DialogFooter className="grid grid-cols-2 sm:grid-cols-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isEditMode ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={data}
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
          placeholder: "Buscar usuários...",
        }}
        filterFields={[
          {
            id: "role",
            title: "Perfis",
            options: roleOptions,
          },
          {
            id: "status",
            title: "Status",
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
        size='sm'
        open={Boolean(blockingUser)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockingUser(null)
          }
        }}
        title="Bloquear usuário"
        description={blockingUser
          ? `Tem certeza que deseja bloquear ${blockingUser.name}? O acesso ao sistema será interrompido imediatamente.`
          : "Tem certeza que deseja bloquear este usuário?"}
        confirmLabel="Bloquear"
        onConfirm={() => {
          if (!blockingUser) {
            return
          }

          handleBlockUser(blockingUser)
          setBlockingUser(null)
        }}
      />
    </div>
  )
}
