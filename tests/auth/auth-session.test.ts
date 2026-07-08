import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const { selectedColumns } = vi.hoisted(() => ({
  selectedColumns: {
    appUsers: "",
  },
}))

vi.mock("@/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config")>()

  return {
    ...actual,
    shouldBypassAuthInDev: () => false,
  }
})

vi.mock("@/lib/supabase-browser", () => {
  const appUsersBuilder = {
    eq() {
      return this
    },
    maybeSingle() {
      return Promise.resolve({
        data: {
          auth_user_id: "auth-user-1",
          cpf_masked: "***.***.***-97",
          email: "igor.nicoletti@redemontecarlo.com",
          id: "app-user-1",
          name: "Igor Nicoletti",
          phone_masked: "(17) 99130-4197",
          role: "owner",
          status: "active",
        },
        error: null,
      })
    },
    select(columns: string) {
      selectedColumns.appUsers = columns
      return this
    },
  }

  const unitLinksBuilder = {
    eq() {
      return this
    },
    maybeSingle() {
      return Promise.resolve({
        data: null,
        error: null,
      })
    },
    select() {
      return this
    },
  }

  return {
    getSupabaseBrowserClient: () => ({
      auth: {
        getUser: () => Promise.resolve({
          data: { user: { id: "auth-user-1" } },
          error: null,
        }),
        passkey: {
          list: () => Promise.resolve({
            data: [{ id: "passkey-1" }],
            error: null,
          }),
        },
      },
      from(table: string) {
        return table === "app_users" ? appUsersBuilder : unitLinksBuilder
      },
    }),
  }
})

describe("getCurrentSessionProfile", () => {
  beforeEach(() => {
    selectedColumns.appUsers = ""
  })

  it("does not require display PII columns during login profile resolution", async () => {
    vi.resetModules()
    const { getCurrentSessionProfile } = await import(
      "@/features/auth/services/auth-session"
    )
    const profile = await getCurrentSessionProfile()

    expect(profile?.name).toBe("Igor Nicoletti")
    expect(profile?.passkeyStatus).toBe("active")
    expect(selectedColumns.appUsers).not.toContain("phone_display")
    expect(selectedColumns.appUsers).not.toContain("cpf_display")
  })
})
