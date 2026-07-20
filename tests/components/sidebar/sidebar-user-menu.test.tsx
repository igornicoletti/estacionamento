import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { describe, expect, it, vi } from "vitest"

import { UserMenu } from "@/components/sidebar"
import { updateCurrentProfile, uploadProfileAvatarFile } from "@/features/my-profile/services/profile-service"

vi.mock("@/features/my-profile/services/profile-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/my-profile/services/profile-service")>()

  return {
    ...actual,
    updateCurrentProfile: vi.fn(async () => ({
      avatarPath: "test-auth-user/avatar-1.png",
      avatarUrl: "https://cdn.example.com/avatar-1.png",
      email: "admin.test@example.com",
      name: "Administrador Atualizado",
      phoneMasked: "(11) 90000-0001",
      requiresPasskeyRegistration: false,
    })),
    uploadProfileAvatarFile: vi.fn(async () => "test-auth-user/avatar-1.png"),
  }
})

describe("UserMenu", () => {
  it("abre menu do usuario com acoes principais", async () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.pointerDown(screen.getByRole("button", { name: /abrir menu de usuário/i }))

    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Meu perfil" })).toBeInTheDocument()
    })

    expect(screen.getByRole("menuitem", { name: "Alterar foto" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Notificações" })).toBeInTheDocument()
  })

  it("atualiza avatar pelo fluxo de URL segura", async () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.pointerDown(screen.getByRole("button", { name: /abrir menu de usuário/i }))
    const changePhotoItem = await screen.findByRole("menuitem", { name: "Alterar foto" })
    fireEvent.keyDown(changePhotoItem, { key: "Enter" })

    expect(await screen.findByRole("heading", { name: "Alterar foto" })).toBeInTheDocument()

    const urlInput = await screen.findByPlaceholderText("https://")
    fireEvent.change(urlInput, { target: { value: "https://cdn.example.com/avatar-1.png" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(updateCurrentProfile).toHaveBeenCalled()
    })

    expect(uploadProfileAvatarFile).not.toHaveBeenCalled()
  })

  it("mostra erro de validacao para URL de imagem invalida", async () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.pointerDown(screen.getByRole("button", { name: /abrir menu de usuário/i }))
    const changePhotoItem = await screen.findByRole("menuitem", { name: "Alterar foto" })
    fireEvent.keyDown(changePhotoItem, { key: "Enter" })

    expect(await screen.findByRole("heading", { name: "Alterar foto" })).toBeInTheDocument()

    const urlInput = await screen.findByPlaceholderText("https://")
    fireEvent.change(urlInput, { target: { value: "http://inseguro.com/avatar.png" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(screen.getByText("Informe uma URL HTTPS válida para a imagem.")).toBeInTheDocument()
    })
  })
})
