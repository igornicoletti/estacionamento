import {
  Building2Icon,
  CircleDotIcon,
  ClockIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"
import * as React from "react"

import {
  DataTable,
  type DataTableFilterField,
} from "@/components/data-table"
import { AppEmptyState } from "@/components/shared/app-empty-state"
import { Button } from "@/components/ui/button"

import { usersCopy } from "../constants/users-copy"
import { USERS_TABLE_COLUMN_VISIBILITY_KEY } from "../constants/users-persistence"
import type { UserAdminAction, UserRecord } from "../model/users-types"
import { createUsersColumns } from "../table/users-columns"
import {
  createUserRecentAccessFilterOptions,
  createUserRoleFilterOptions,
  createUserStatusFilterOptions,
  createUserUnitFilterOptions,
} from "../table/users-filter-options"
import { USER_RECENT_ACCESS_COLUMN_ID } from "../table/users-table-ids"

interface UsersTableProps {
  canManageUser: (user: UserRecord) => boolean
  data: UserRecord[]
  error: Error | null
  isLoading: boolean
  onAdminAction: (action: UserAdminAction) => void
  onCreateUser?: () => void
  onEditUser: (user: UserRecord) => void
  onRetry: () => void
  onViewUser: (user: UserRecord) => void
}

export function UsersTable({
  canManageUser,
  data,
  error,
  isLoading,
  onAdminAction,
  onCreateUser,
  onEditUser,
  onRetry,
  onViewUser,
}: UsersTableProps) {
  const columns = React.useMemo(
    () =>
      createUsersColumns({
        canManageUser,
        onBlockUser: (user) => onAdminAction({ kind: "block", user }),
        onClearLock: (user) =>
          onAdminAction({ kind: "clear-lock", user }),
        onEditUser,
        onResetAccess: (user) =>
          onAdminAction({ kind: "reset-password", user }),
        onResetPasskey: (user) =>
          onAdminAction({ kind: "reset-passkey", user }),
        onRevokeSessions: (user) =>
          onAdminAction({ kind: "revoke-sessions", user }),
        onViewUserDetails: onViewUser,
      }),
    [canManageUser, onAdminAction, onEditUser, onViewUser]
  )

  const filterFields = React.useMemo<
    readonly DataTableFilterField<UserRecord>[]
  >(
    () => [
      {
        id: "role",
        icon: ShieldCheckIcon,
        options: createUserRoleFilterOptions(data),
        title: usersCopy.filters.role,
      },
      {
        id: "status",
        icon: CircleDotIcon,
        options: createUserStatusFilterOptions(data),
        title: usersCopy.filters.status,
      },
      {
        id: "unitName",
        icon: Building2Icon,
        options: createUserUnitFilterOptions(data),
        title: usersCopy.filters.unit,
      },
      {
        id: USER_RECENT_ACCESS_COLUMN_ID,
        icon: ClockIcon,
        options: createUserRecentAccessFilterOptions(data),
        title: usersCopy.filters.recentAccess,
      },
    ],
    [data]
  )

  return (
    <DataTable
      ariaLabel={usersCopy.table.ariaLabel}
      columns={columns}
      data={data}
      columnVisibilityStorageKey={USERS_TABLE_COLUMN_VISIBILITY_KEY}
      getRowId={(user) => user.id}
      globalSearch={{
        columnIds: [
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
      filterFields={filterFields}
      emptyState={(
        <AppEmptyState
          media={<UsersIcon aria-hidden="true" />}
          title={usersCopy.empty.title}
          description={usersCopy.empty.description}
          actions={
            onCreateUser ? (
              <Button type="button" variant="secondary" onClick={onCreateUser}>
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                {usersCopy.table.emptyAction}
              </Button>
            ) : null
          }
        />
      )}
      filteredEmptyState={(
        <AppEmptyState
          media={<UsersIcon aria-hidden="true" />}
          title={usersCopy.filteredEmpty.title}
          description={usersCopy.filteredEmpty.description}
        />
      )}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      enablePagination
      enableViewOptions
    />
  )
}
