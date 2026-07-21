import { DatabaseIcon, PlusIcon, ShieldAlertIcon } from "lucide-react"
import * as React from "react"
import { useSearchParams } from "react-router"

import { DataTable, type DataTableStateAction } from "@/components/data-table"
import { PageHeader, PageHeaderActions, PageSection } from "@/components/page"
import { AppTabs } from "@/components/shared"
import { AppAlertDialog } from "@/components/shared/app-alert-dialog"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { notify } from "@/components/toast"
import { Button } from "@/components/ui/button"
import { shouldBypassAuthInDev } from "@/config"
import { AccessRequestsPanel, accessRequestsCopy } from "@/features/access-requests"
import { AUTH_PERMISSION, AUTH_ROLE_KEY, useAuth } from "@/features/auth"
import { useUnits } from "@/features/units"
import { getSupabaseBrowserClient } from "@/lib"

import {
  UserDetailsSheet,
  UserFormDialog,
  type UserFormUnitOption,
} from "../components"
import {
  ACCESS_REQUESTS_TAB_VALUE,
  USERS_TABLE_COLUMN_VISIBILITY_KEY,
  USERS_TAB_VALUE,
  usersCopy,
} from "../constants"
import { useUsers } from "../hooks"
import {
  interpolateUserCopy,
  userRoleValues,
  type UserRecord,
  type UsersFormValues,
} from "../model"
import {
  createUserOnlineFilterOptions,
  createUserRoleFilterOptions,
  createUserStatusFilterOptions,
  createUserUnitFilterOptions,
  createUsersColumns,
} from "../table"

export function UsersRoute() {
  const auth = useAuth()
  const [searchParams] = useSearchParams()
  const remoteMode = Boolean(getSupabaseBrowserClient()) && !shouldBypassAuthInDev()
  const canReadUsers = auth.access.hasPermission(AUTH_PERMISSION.usersRead)
  const canManageUsers = auth.access.hasPermission(AUTH_PERMISSION.usersManage)
  const canExportUsers = canReadUsers
  const canReadAccessRequests = auth.access.hasPermission(AUTH_PERMISSION.accessRequestsRead)
  const canReviewAccessRequests = auth.access.hasPermission(AUTH_PERMISSION.accessRequestsReview)
  const canAssignOwnerRole =
    auth.profile?.role?.key === AUTH_ROLE_KEY.owner ||
    auth.access.hasPermission(AUTH_PERMISSION.all)
  const usersSnapshot = useUsers({ enabled: canReadUsers })
  const unitsSnapshot = useUnits()
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null)
  const [detailsUser, setDetailsUser] = React.useState<UserRecord | null>(null)
  const [pendingAction, setPendingAction] = React.useState<{
    type: "block" | "reset" | "resetPasskey" | "clearLock" | "revokeSessions"
    user: UserRecord
  } | null>(null)
  const assignableRoleValues = React.useMemo(
    () =>
      canAssignOwnerRole
        ? userRoleValues
        : userRoleValues.filter((role) => role !== AUTH_ROLE_KEY.owner),
    [canAssignOwnerRole]
  )

  const visibleUsers = React.useMemo(
    () => usersSnapshot.data.filter((user) => canAssignOwnerRole || user.role !== AUTH_ROLE_KEY.owner),
    [canAssignOwnerRole, usersSnapshot.data]
  )

  const defaultUsersTab = searchParams.get("tab") === ACCESS_REQUESTS_TAB_VALUE
    ? ACCESS_REQUESTS_TAB_VALUE
    : USERS_TAB_VALUE

  const unitOptions = React.useMemo<UserFormUnitOption[]>(() => {
    return unitsSnapshot.data.map((unit) => ({
      label: unit.nom_fantasia,
      value: String(unit.cod_empresa),
    }))
  }, [unitsSnapshot.data])

  const roleOptions = React.useMemo(
    () => createUserRoleFilterOptions(visibleUsers),
    [visibleUsers]
  )
  const statusOptions = React.useMemo(
    () => createUserStatusFilterOptions(visibleUsers),
    [visibleUsers]
  )
  const unitFilterOptions = React.useMemo(
    () => createUserUnitFilterOptions(visibleUsers),
    [visibleUsers]
  )
  const onlineFilterOptions = React.useMemo(
    () => createUserOnlineFilterOptions(visibleUsers),
    [visibleUsers]
  )

  const handleOpenCreateDialog = React.useCallback(() => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }, [])

  const handleOpenEditDialog = React.useCallback((user: UserRecord) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }, [])

  async function refreshAuthProfileWhenCurrentUser(user: UserRecord) {
    if (user.authUserId && user.authUserId === auth.profile?.authUserId) {
      auth.actions.applyProfilePatch({
        email: user.email,
        name: user.name,
        phoneMasked: user.phoneMasked ?? undefined,
      })
      await auth.actions.refreshProfile()
    }
  }

  async function handleFormSubmit(values: UsersFormValues) {
    if (values.mode === "edit" && values.id) {
      const updatedUser = await notify.track(
        usersSnapshot.editUser({
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
        usersCopy.feedback.update
      )
      await refreshAuthProfileWhenCurrentUser(updatedUser)
      return
    }

    await notify.track(
      usersSnapshot.addUser({
        cpf: values.cpf,
        email: values.email,
        firstAccessPassword: values.firstAccessPassword,
        name: values.name,
        phone: values.phone,
        role: values.role,
        unitId: values.unitId,
        unitName: values.unitName,
      }),
      usersCopy.feedback.create
    )
  }

  const pendingActionConfig = React.useMemo(() => {
    if (!pendingAction) {
      return null
    }

    const userName = { name: pendingAction.user.name }

    if (pendingAction.type === "block") {
      return {
        actionLabel: usersCopy.actions.continue,
        description: interpolateUserCopy(usersCopy.dialogs.blockDescription, userName),
        feedback: usersCopy.feedback.block,
        onAction: () => usersSnapshot.inactivateUser(pendingAction.user.id),
        title: usersCopy.dialogs.blockTitle,
      }
    }

    if (pendingAction.type === "reset") {
      return {
        actionLabel: usersCopy.actions.continue,
        description: interpolateUserCopy(usersCopy.dialogs.resetDescription, userName),
        feedback: usersCopy.feedback.reset,
        onAction: () => usersSnapshot.resetAccess(pendingAction.user.id),
        title: usersCopy.dialogs.resetTitle,
      }
    }

    if (pendingAction.type === "resetPasskey") {
      return {
        actionLabel: usersCopy.actions.continue,
        description: interpolateUserCopy(usersCopy.dialogs.resetPasskeyDescription, userName),
        feedback: usersCopy.feedback.resetPasskey,
        onAction: () => usersSnapshot.resetPasskey(pendingAction.user.id),
        title: usersCopy.dialogs.resetPasskeyTitle,
      }
    }

    if (pendingAction.type === "clearLock") {
      const isBlocked = pendingAction.user.status === "inactive"

      return {
        actionLabel: usersCopy.actions.continue,
        description: interpolateUserCopy(
          isBlocked
            ? usersCopy.dialogs.unblockDescription
            : usersCopy.dialogs.clearLockDescription,
          userName
        ),
        feedback: usersCopy.feedback.clearLock,
        onAction: () => usersSnapshot.clearLock(pendingAction.user.id),
        title: isBlocked ? usersCopy.dialogs.unblockTitle : usersCopy.dialogs.clearLockTitle,
      }
    }

    return {
      actionLabel: usersCopy.actions.continue,
      description: interpolateUserCopy(usersCopy.dialogs.revokeSessionsDescription, userName),
      feedback: usersCopy.feedback.revokeSessions,
      onAction: () => usersSnapshot.revokeSessions(pendingAction.user.id),
      title: usersCopy.dialogs.revokeSessionsTitle,
    }
  }, [pendingAction, usersSnapshot])

  const columns = React.useMemo(
    () =>
      createUsersColumns({
        canBlockUser: canManageUsers,
        canClearLock: canManageUsers,
        canEditUser: canManageUsers,
        canManageOwnerUser: canAssignOwnerRole,
        canResetPasskey: canManageUsers,
        canResetPassword: canManageUsers,
        canRevokeSessions: canManageUsers,
        currentAuthUserId: auth.profile?.authUserId ?? null,
        onBlockUser: (user) => setPendingAction({ type: "block", user }),
        onClearLock: (user) => setPendingAction({ type: "clearLock", user }),
        onEditUser: handleOpenEditDialog,
        onResetAccess: (user) => setPendingAction({ type: "reset", user }),
        onResetPasskey: (user) => setPendingAction({ type: "resetPasskey", user }),
        onRevokeSessions: (user) => setPendingAction({ type: "revokeSessions", user }),
        onViewUserDetails: setDetailsUser,
        remoteMode,
      }),
    [
      auth.profile?.authUserId,
      canAssignOwnerRole,
      canManageUsers,
      handleOpenEditDialog,
      remoteMode,
    ]
  )

  const emptyAction = React.useMemo<DataTableStateAction | undefined>(() => {
    if (!canManageUsers) {
      return undefined
    }

    return {
      icon: <PlusIcon aria-hidden="true" />,
      label: usersCopy.table.emptyAction,
      onClick: handleOpenCreateDialog,
    }
  }, [canManageUsers, handleOpenCreateDialog])

  const usersTable = (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden">
      <DataTable
        columns={columns}
        data={visibleUsers}
        defaultColumnVisibility={{ onlineStatus: false }}
        columnVisibilityStorageKey={USERS_TABLE_COLUMN_VISIBILITY_KEY}
        getRowId={(user: UserRecord) => user.id}
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
          { id: "role", title: usersCopy.filters.role, options: roleOptions },
          { id: "status", title: usersCopy.filters.status, options: statusOptions },
          { id: "unitName", title: usersCopy.filters.unit, options: unitFilterOptions },
          { id: "onlineStatus", title: usersCopy.filters.online, options: onlineFilterOptions },
        ]}
        emptyAction={emptyAction}
        emptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={usersCopy.empty.title}
            description={usersCopy.empty.description}
          />
        )}
        filteredEmptyState={(
          <AppEmptyState
            media={<DatabaseIcon />}
            title={usersCopy.filteredEmpty.title}
            description={usersCopy.filteredEmpty.description}
          />
        )}
        isLoading={usersSnapshot.isLoading}
        error={usersSnapshot.error}
        onRetry={() => { void usersSnapshot.refetch() }}
        enablePagination
        enableExport={canExportUsers}
        enableViewOptions
      />
    </div>
  )

  return (
    <PageSection>
      <PageHeader
        title={usersCopy.page.title}
        subtitle={usersCopy.page.subtitle}
        actions={
          canManageUsers ? (
            <PageHeaderActions>
              <Button type="button" variant="secondary" size="lg" onClick={handleOpenCreateDialog}>
                <PlusIcon aria-hidden="true" />
                {usersCopy.actions.create}
              </Button>
            </PageHeaderActions>
          ) : null
        }
      />

      <UserFormDialog
        key={editingUser?.id ?? "create"}
        assignableRoleValues={assignableRoleValues}
        editingUser={editingUser}
        isSaving={usersSnapshot.isSaving}
        onOpenChange={(open: boolean) => {
          setIsDialogOpen(open)

          if (!open) {
            setEditingUser(null)
          }
        }}
        onSubmit={handleFormSubmit}
        open={isDialogOpen}
        unitOptions={unitOptions}
      />

      {canReadAccessRequests ? (
        <AppTabs
          className="min-h-0 min-w-0 w-full"
          defaultValue={defaultUsersTab}
          items={[
            {
              value: USERS_TAB_VALUE,
              label: usersCopy.page.title,
              content: usersTable,
            },
            {
              value: ACCESS_REQUESTS_TAB_VALUE,
              label: accessRequestsCopy.page.title,
              content: <AccessRequestsPanel canReview={canReviewAccessRequests} showHeader={false} />,
            },
          ]}
        />
      ) : (
        usersTable
      )}

      <UserDetailsSheet
        user={detailsUser}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDetailsUser(null)
          }
        }}
      />

      <AppAlertDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setPendingAction(null)
          }
        }}
        media={<ShieldAlertIcon />}
        title={pendingActionConfig?.title ?? ""}
        description={pendingActionConfig?.description ?? ""}
        cancelLabel={usersCopy.dialogs.cancel}
        actionLabel={pendingActionConfig?.actionLabel}
        onAction={async () => {
          if (!pendingActionConfig) {
            return
          }

          await notify.track(pendingActionConfig.onAction(), pendingActionConfig.feedback)
          setPendingAction(null)
        }}
      />
    </PageSection>
  )
}
