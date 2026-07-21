import { render, screen } from "@testing-library/react"
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  type Location,
} from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { appRoutePaths } from "@/app/router/route-registry"
import {
  PrivateRouteGate,
  PublicRouteGate,
} from "@/app/router/route-elements"
import {
  AUTH_PERMISSION,
  AUTH_PERMISSION_WILDCARD,
  AUTH_STATUS,
  type AuthPermission,
  type AuthStatus,
} from "@/features/auth/contracts"

const mocks = vi.hoisted(() => ({
  authContext: {
    access: {
      hasAllPermissions: () => true,
      hasAnyPermission: () => true,
      hasPermission: () => true,
      permissions: ["*"],
    },
    actions: {
      applyProfilePatch: vi.fn(),
      clearRequiredPasswordChallenge: vi.fn(),
      completeRequiredPassword: vi.fn(),
      logout: vi.fn(),
      logoutAsync: vi.fn(),
      refreshProfile: vi.fn(),
      registerProfilePasskey: vi.fn(),
      registerRequiredPasskey: vi.fn(),
      signInWithPasskey: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    error: null,
    inactivity: {
      consumeExpired: vi.fn(() => false),
      continueSession: vi.fn(),
      isWarningOpen: false,
      markExpired: vi.fn(),
      secondsRemaining: 0,
    },
    isAuthenticated: false,
    isLoading: false,
    isSubmitting: false,
    passwordChange: {
      required: false,
    },
    profile: null,
    status: "anonymous",
  },
}))

vi.mock("@/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config")>()

  return {
    ...actual,
    shouldBypassAuthInDev: () => false,
  }
})

vi.mock("@/features/auth", async () => {
  const contracts = await import("@/features/auth/contracts")

  return {
    ...contracts,
    useAuth: () => mocks.authContext,
  }
})

function createAccessState(permissions: readonly AuthPermission[]) {
  const permissionSet = new Set(permissions)
  const hasPermission = (permission: AuthPermission) =>
    permissionSet.has(AUTH_PERMISSION_WILDCARD) || permissionSet.has(permission)

  return {
    permissions,
    hasPermission,
    hasAllPermissions: (requiredPermissions: readonly AuthPermission[]) =>
      requiredPermissions.every(hasPermission),
    hasAnyPermission: (requiredPermissions: readonly AuthPermission[]) =>
      requiredPermissions.length === 0 || requiredPermissions.some(hasPermission),
  }
}

function createProfile({
  permissions,
  status,
}: {
  permissions: readonly AuthPermission[]
  status: AuthStatus
}) {
  return {
    authUserId: "auth-user-1",
    avatarPath: null,
    avatarUrl: null,
    cpfMasked: "421.***.***-97",
    email: "usuario@example.com",
    id: "USR-001",
    name: "Usuario Teste",
    passkeyStatus: "active",
    permissions,
    phoneMasked: "(11) *****-4197",
    role: {
      id: "role-owner",
      key: "owner",
      label: "Proprietario",
    },
    roleKey: "owner",
    status,
    unitId: null,
    unitName: null,
  }
}

function setAnonymousAuthState() {
  Object.assign(mocks.authContext, {
    access: createAccessState([]),
    isAuthenticated: false,
    isLoading: false,
    profile: null,
    status: "anonymous",
  })
}

function setLoadingAuthState() {
  Object.assign(mocks.authContext, {
    access: createAccessState([]),
    isAuthenticated: false,
    isLoading: true,
    profile: null,
    status: "loading",
  })
}

function setAuthenticatedAuthState({
  permissions = [AUTH_PERMISSION_WILDCARD],
  status = AUTH_STATUS.active,
}: {
  permissions?: readonly AuthPermission[]
  status?: AuthStatus
} = {}) {
  Object.assign(mocks.authContext, {
    access: createAccessState(permissions),
    isAuthenticated: true,
    isLoading: false,
    profile: createProfile({ permissions, status }),
    status: "authenticated",
  })
}

function readFromPathname(location: Location) {
  const state: unknown = location.state

  if (!state || typeof state !== "object" || !("from" in state)) {
    return ""
  }

  const from = (state as { from?: Location }).from

  return from?.pathname ?? ""
}

function RouteProbe() {
  const location = useLocation()
  const fromPathname = readFromPathname(location)

  return (
    <output aria-label="Rota atual">
      {location.pathname}|{fromPathname}
    </output>
  )
}

function ProtectedContent() {
  return <div>Conteudo protegido</div>
}

function PublicContent() {
  return <div>Conteudo publico</div>
}

function renderPrivateRoute({
  initialPath = appRoutePaths.security,
  requiredPermissions = [],
}: {
  initialPath?: string
  requiredPermissions?: readonly AuthPermission[]
} = {}) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={appRoutePaths.home} element={<RouteProbe />} />
        <Route path={appRoutePaths.login} element={<RouteProbe />} />
        <Route
          path={initialPath}
          element={
            <PrivateRouteGate requiredPermissions={requiredPermissions}>
              <ProtectedContent />
            </PrivateRouteGate>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

function renderPublicRoute() {
  return render(
    <MemoryRouter initialEntries={[appRoutePaths.login]}>
      <Routes>
        <Route path={appRoutePaths.home} element={<RouteProbe />} />
        <Route path={appRoutePaths.login} element={<PublicRouteGate />}>
          <Route index element={<PublicContent />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe("route auth gates", () => {
  beforeEach(() => {
    setAnonymousAuthState()
  })

  it("shows a loading state while the auth session is resolving", () => {
    setLoadingAuthState()

    renderPrivateRoute()

    expect(screen.getByLabelText("Carregando...")).toBeInTheDocument()
    expect(screen.queryByText("Conteudo protegido")).not.toBeInTheDocument()
  })

  it("redirects anonymous users to login preserving the attempted route", () => {
    setAnonymousAuthState()

    renderPrivateRoute()

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent(
      `${appRoutePaths.login}|${appRoutePaths.security}`
    )
  })

  it("redirects authenticated users without active status to login", () => {
    setAuthenticatedAuthState({ status: AUTH_STATUS.inactive })

    renderPrivateRoute()

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent(
      `${appRoutePaths.login}|${appRoutePaths.security}`
    )
  })

  it("renders protected content when the account is active and permissions match", () => {
    setAuthenticatedAuthState({
      permissions: [AUTH_PERMISSION.settingsReadSelf],
    })

    renderPrivateRoute({
      requiredPermissions: [AUTH_PERMISSION.settingsReadSelf],
    })

    expect(screen.getByText("Conteudo protegido")).toBeInTheDocument()
  })

  it("renders access denied when required permissions are missing", () => {
    setAuthenticatedAuthState({
      permissions: [AUTH_PERMISSION.notificationsRead],
    })

    renderPrivateRoute({
      requiredPermissions: [AUTH_PERMISSION.auditRead],
    })

    expect(screen.getByText(/403.*Acesso negado/)).toBeInTheDocument()
    expect(screen.queryByText("Conteudo protegido")).not.toBeInTheDocument()
  })

  it("keeps public auth routes visible for anonymous users", () => {
    setAnonymousAuthState()

    renderPublicRoute()

    expect(screen.getByText("Conteudo publico")).toBeInTheDocument()
  })

  it("redirects active authenticated users away from public auth routes", () => {
    setAuthenticatedAuthState()

    renderPublicRoute()

    expect(screen.getByLabelText("Rota atual")).toHaveTextContent(
      `${appRoutePaths.home}|`
    )
  })
})
