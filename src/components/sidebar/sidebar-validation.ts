import type {
  SidebarNavigationBranch,
  SidebarNavigationGroup,
} from "./sidebar.types"

function assertNonBlank(value: string, field: string) {
  if (!value.trim()) {
    throw new Error(`[Sidebar] ${field} não pode ser vazio.`)
  }
}

function assertUniqueIds(ids: readonly string[], scope: string) {
  const seen = new Set<string>()

  for (const id of ids) {
    assertNonBlank(id, `${scope}.id`)

    if (seen.has(id)) {
      throw new Error(`[Sidebar] ID duplicado em ${scope}: ${id}`)
    }

    seen.add(id)
  }
}

function validateBranch(branch: SidebarNavigationBranch) {
  if (branch.items.length === 0) {
    throw new Error(
      `[Sidebar] O submenu "${branch.id}" deve possuir pelo menos um item.`
    )
  }

  assertUniqueIds(
    branch.items.map((item) => item.id),
    `submenu ${branch.id}`
  )

  for (const child of branch.items) {
    assertNonBlank(child.label, `submenu ${branch.id}.${child.id}.label`)
  }
}

export function validateSidebarGroups(
  groups: readonly SidebarNavigationGroup[]
) {
  assertUniqueIds(
    groups.map((group) => group.id),
    "groups"
  )

  const itemIds: string[] = []

  for (const group of groups) {
    if (group.collapsible) {
      assertNonBlank(group.label, `group ${group.id}.label`)
    }

    for (const item of group.items) {
      itemIds.push(item.id)
      assertNonBlank(item.label, `item ${item.id}.label`)

      if (item.kind === "collapsible") {
        validateBranch(item)
      }
    }
  }

  assertUniqueIds(itemIds, "navigation items")
}
