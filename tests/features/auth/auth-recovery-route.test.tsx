import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router"
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const mocks = vi.hoisted(() => ({
  requestAccessRecovery: vi.fn(),
}))

vi.mock("@/features/auth/api", () => ({
  requestAccessRecovery: mocks.requestAccessRecovery,
}))

vi.mock("@/features/auth/api/auth-api", () => ({
  requestAccessRecovery: mocks.requestAccessRecovery,
}))

function LocationProbe() {
  const location = useLocation()

  return <span data-testid="location">{location.pathname}</span>
}

async function renderRecoveryRoute() {
  const { AuthRecoveryRoute } = await import("@/features/auth/routes/auth-recovery-route")

  return render(
    <MemoryRouter initialEntries={["/recuperar-acesso"]}>
      <Routes>
        <Route path="/recuperar-acesso" element={<AuthRecoveryRoute />} />
        <Route path="/login" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("AuthRecoveryRoute", () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.requestAccessRecovery.mockReset()
  })

  it("redirects to login after submitting a valid recovery request", async () => {
    mocks.requestAccessRecovery.mockResolvedValue(undefined)

    await renderRecoveryRoute()

    fireEvent.change(screen.getByLabelText("CPF*"), {
      target: { value: "52998224725" },
    })
    fireEvent.change(screen.getByLabelText("Telefone*"), {
      target: { value: "11987654321" },
    })
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "pessoa@example.com" },
    })

    const reason = screen.getByRole("combobox", { name: "Motivo*" })
    fireEvent.keyDown(reason, { key: "ArrowDown" })
    const lostPhoneOption = await screen.findByRole("option", {
      name: "Perdi acesso ao telefone",
    })
    fireEvent.pointerDown(lostPhoneOption, { button: 0, ctrlKey: false })
    fireEvent.pointerUp(lostPhoneOption)
    fireEvent.click(lostPhoneOption)

    await waitFor(() => {
      expect(reason).toHaveTextContent("Perdi acesso ao telefone")
    })
    const submitButton = screen.getByRole("button", {
      name: "Solicitar recuperação",
    })
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement)

    await waitFor(() => {
      expect(mocks.requestAccessRecovery).toHaveBeenCalledWith({
        cpf: "529.982.247-25",
        description: "",
        email: "pessoa@example.com",
        phone: "(11) 98765-4321",
        reason: "lost_phone",
      })
    })
    expect(await screen.findByTestId("location")).toHaveTextContent("/login")
  })
})
