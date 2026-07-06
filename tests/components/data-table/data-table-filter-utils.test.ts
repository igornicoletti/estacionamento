import { describe, expect, it } from "vitest"

import {
  dedupeFilterOptions,
  dedupeGlobalSearchColumnIds,
  normalizeFilterText,
  normalizeSearchValue,
} from "@/components/data-table/data-table-filter-utils"
import { type DataTableGlobalSearch } from "@/components/data-table/data-table-types"

interface TestRow {
  id: string
  name: string
}

describe("data-table filter utils", () => {
  it("normalizes search values without preserving extra whitespace", () => {
    expect(normalizeSearchValue("  alpha   beta  ")).toBe("alpha beta")
  })

  it("normalizes filter text for case-insensitive and accent-insensitive search", () => {
    expect(normalizeFilterText(" São   Paulo ")).toBe("sao paulo")
  })

  it("dedupes global search column ids", () => {
    const config = {
      columnIds: ["id", "name", "name"],
    } satisfies DataTableGlobalSearch<TestRow>

    expect(dedupeGlobalSearchColumnIds(config)).toEqual(["id", "name"])
  })

  it("dedupes faceted filter options by value", () => {
    expect(
      dedupeFilterOptions([
        { value: "active", label: "Active" },
        { value: "active", label: "Enabled" },
        { value: "inactive", label: "Inactive" },
      ])
    ).toEqual([
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ])
  })
})
