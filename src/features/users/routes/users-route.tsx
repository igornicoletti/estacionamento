import { PlusIcon } from "lucide-react"
import * as React from "react"
import { useSearchParams } from "react-router"

import { AppPage } from "@/components/shared/app-page"
import { AppTabs } from "@/components/shared/app-tabs"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { AccessRequestsPanel } from "@/features/access-requests"
import {
  AUTH_PERMISSION,
  isUserRole,
  useAuth,
} from "@/features/auth"

import { UserAdminActionDialog } from "../components/user-admin-action-dialog"
import { UserDetailsSheet } from "../components/user-details-sheet"
import { UserFormDialog } from "../components/user-form-dialog"
import { UsersTable } from "../components/users-table"
import { usersCopy } from "../constants/users-copy"
import {
  ACCESS_REQUESTS_TAB_VALUE,
  USERS_TAB_VALUE,
} from "../constants/users-persistence"
import { useUsers } from "../hooks/use-users"
import { getUserAdminActionPresentation } from "../model/users-admin-actions"
import {
  canManageUserTarget,
  getAssignableUserRoles,
} from "../model/users-admin-policy"
import {
  type UserAdminAction,
  type UserRecord,
} from "../model/users-types"
import { type UsersFormValues } from "../schemas/users-form-schema"

export function UsersRoute() {
  const [searchParams, setSearchParams] = useSearchParams()
  const auth = useAuth()
  const canReadAccessRequests = auth.access.hasPermission(
    AUTH_PERMISSION.accessRequestsRead
  )
  const activeTab =
    canReadAccessRequests &&
    searchParams.get("tab") === ACCESS_REQUESTS_TAB_VALUE
      ? ACCESS_REQUESTS_TAB_VALUE
      : USERS_TAB_VALUE
  const {
    addUser,
    block,
    clearLock,
    data,
    editUser,
    error,
    isLoading,
    isMutationPending,
    isSaving,
    refetch,
    resetPasskey,
    resetPassword,
    revokeSessions,
    unitCatalog,
    unitCatalogError,
  } = useUsers({ enabled: activeTab === USERS_TAB_VALUE })
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null)
  const [detailsUser, setDetailsUser] = React.useState<UserRecord | null>(null)
  const [adminAction, setAdminAction] =
    React.useState<UserAdminAction | null>(null)
  const actorRole = isUserRole(auth.profile?.roleKey)
    ? auth.profile.roleKey
    : null
  const canManageUsers = auth.access.hasPermission(AUTH_PERMISSION.usersManage)
  const assignableRoleValues = React.useMemo(
    () => (canManageUsers ? getAssignableUserRoles(actorRole) : []),
    [actorRole, canManageUsers]
  )
  const canManageTarget = React.useCallback(
    (user: UserRecord) =>
      canManageUsers &&
      canManageUserTarget(
        {
          authUserId: auth.profile?.authUserId,
          role: actorRole,
        },
        user
      ),
    [actorRole, auth.profile?.authUserId, canManageUsers]
  )

  const handleDialogOpenChange = React.useCallback((open: boolean) => {
    setIsDialogOpen(open)

    if (!open) {
      setEditingUser(null)
    }
  }, [])

  const handleOpenCreateDialog = React.useCallback(() => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }, [])

  const handleOpenEditDialog = React.useCallback((user: UserRecord) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }, [])

  const handleOpenAdminAction = React.useCallback(
    (action: UserAdminAction) => setAdminAction(action),
    []
  )

  const handleTabChange = React.useCallback(
    (value: string) => {
      const nextParams = new URLSearchParams(searchParams)

      if (value === ACCESS_REQUESTS_TAB_VALUE && canReadAccessRequests) {
        nextParams.set("tab", ACCESS_REQUESTS_TAB_VALUE)
      } else {
        nextParams.delete("tab")
      }

      setSearchParams(nextParams, { replace: true })
    },
    [canReadAccessRequests, searchParams, setSearchParams]
  )

  async function handleSubmit(values: UsersFormValues) {
    if (values.mode === "edit" && values.id) {
      await editUser({
        cpf: values.cpf,
        email: values.email,
        id: values.id,
        name: values.name,
        phone: values.phone,
        role: values.role,
        unitId: values.unitId,
      })
      notify.success(usersCopy.feedback.update.success)
      return
    }

    await addUser({
      cpf: values.cpf,
      email: values.email,
      firstAccessPassword: values.firstAccessPassword,
      name: values.name,
      phone: values.phone,
      role: values.role,
      unitId: values.unitId,
    })
    notify.success(usersCopy.feedback.create.success)
  }

  async function handleAdminAction(action: UserAdminAction) {
    const presentation = getUserAdminActionPresentation(action)
    const operation = (() => {
      switch (action.kind) {
        case "block":
          return block(action.user)
        case "clear-lock":
          return clearLock(action.user)
        case "reset-passkey":
          return resetPasskey(action.user)
        case "reset-password":
          return resetPassword(action.user)
        case "revoke-sessions":
          return revokeSessions(action.user)
      }
    })()

    await notify.track(operation, {
      error: presentation.error,
      loading: presentation.loading,
      success: presentation.success,
    })
  }

  const userTable = (
    <UsersTable
      canManageUser={canManageTarget}
      data={data}
      error={error}
      isLoading={isLoading}
      onAdminAction={handleOpenAdminAction}
      onCreateUser={canManageUsers ? handleOpenCreateDialog : undefined}
      onEditUser={handleOpenEditDialog}
      onRetry={() => void refetch()}
      onViewUser={setDetailsUser}
    />
  )

  return (
    <AppPage
      title={usersCopy.page.title}
      subtitle={usersCopy.page.subtitle}
      actions={
        canManageUsers ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleOpenCreateDialog}
          >
            <PlusIcon data-icon="inline-start" aria-hidden="true" />
            {usersCopy.actions.create}
          </Button>
        ) : null
      }
    >
      <AppTabs
        value={activeTab}
        onValueChange={handleTabChange}
        items={[
          {
            value: USERS_TAB_VALUE,
            label: usersCopy.page.title,
            content: userTable,
          },
          ...(canReadAccessRequests
            ? [
                {
                  value: ACCESS_REQUESTS_TAB_VALUE,
                  label: usersCopy.tabs.accessRequests,
                  content: <AccessRequestsPanel showHeader={false} />,
                },
              ]
            : []),
        ]}
      />

      <UserFormDialog
        key={editingUser?.id ?? "create-user"}
        assignableRoleValues={assignableRoleValues}
        editingUser={editingUser}
        isSaving={isSaving}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmit}
        open={isDialogOpen}
        unitCatalog={unitCatalog}
        unitCatalogError={Boolean(unitCatalogError)}
      />

      <UserAdminActionDialog
        action={adminAction}
        isPending={isMutationPending}
        onConfirm={handleAdminAction}
        onOpenChange={(open) => {
          if (!open) {
            setAdminAction(null)
          }
        }}
      />

      <UserDetailsSheet
        user={detailsUser}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsUser(null)
          }
        }}
      />
    </AppPage>
  )
}
