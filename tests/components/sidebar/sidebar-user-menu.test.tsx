import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { UserMenu } from "@/components/sidebar"
import { updateCurrentProfile, uploadProfileAvatarFile } from "@/features/my-profile/services/profile-service"

vi.mock("@/features/my-profile/services/profile-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/my-profile/services/profile-service")>()

  return {
    ...actual,
    updateCurrentProfile: vi.fn(() => Promise.resolve({
      avatarPath: "test-auth-user/avatar-1.png",
      avatarUrl: "https://cdn.example.com/avatar-1.png",
      email: "admin.test@example.com",
      name: "Administrador Atualizado",
      phoneMasked: "(11) 90000-0001",
      requiresPasskeyRegistration: false,
    })),
    uploadProfileAvatarFile: vi.fn(() => Promise.resolve("test-auth-user/avatar-1.png")),
  }
})

describe("UserMenu", () => {
  beforeEach(() => {
    vi.mocked(updateCurrentProfile).mockClear()
    vi.mocked(uploadProfileAvatarFile).mockClear()
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:test-avatar"),
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    })
  })

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

    expect(screen.getByRole("menuitem", { name: "Foto do perfil" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "Notificações" })).toBeInTheDocument()
  })

  it("atualiza avatar pelo fluxo de upload suportado", async () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.pointerDown(screen.getByRole("button", { name: /abrir menu de usuário/i }))
    const changePhotoItem = await screen.findByRole("menuitem", { name: "Foto do perfil" })
    fireEvent.keyDown(changePhotoItem, { key: "Enter" })

    expect(await screen.findByRole("heading", { name: "Foto do perfil" })).toBeInTheDocument()

    const input = document.querySelector<HTMLInputElement>("input[type='file']")
    const file = new File(["avatar"], "avatar.png", { type: "image/png" })

    expect(input).not.toBeNull()
    fireEvent.change(input!, { target: { files: [file] } })
    expect(screen.getByText("avatar.png")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(uploadProfileAvatarFile).toHaveBeenCalledWith(file, "test-auth-user")
      expect(updateCurrentProfile).toHaveBeenCalled()
    })
  })

  it("aceita imagem arrastada para a area da foto", async () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.pointerDown(screen.getByRole("button", { name: /abrir menu de usuário/i }))
    const changePhotoItem = await screen.findByRole("menuitem", { name: "Foto do perfil" })
    fireEvent.keyDown(changePhotoItem, { key: "Enter" })

    expect(await screen.findByRole("heading", { name: "Foto do perfil" })).toBeInTheDocument()

    const file = new File(["avatar"], "avatar-drop.png", { type: "image/png" })
    fireEvent.drop(screen.getByRole("button", { name: /Escolha uma imagem/ }), {
      dataTransfer: { files: [file] },
    })

    expect(screen.getByText("avatar-drop.png")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      expect(uploadProfileAvatarFile).toHaveBeenCalledWith(file, "test-auth-user")
      expect(updateCurrentProfile).toHaveBeenCalled()
    })
  })

  it("mostra erro de validacao para arquivo de imagem invalido", async () => {
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>
    )

    fireEvent.pointerDown(screen.getByRole("button", { name: /abrir menu de usuário/i }))
    const changePhotoItem = await screen.findByRole("menuitem", { name: "Foto do perfil" })
    fireEvent.keyDown(changePhotoItem, { key: "Enter" })

    expect(await screen.findByRole("heading", { name: "Foto do perfil" })).toBeInTheDocument()

    const input = document.querySelector<HTMLInputElement>("input[type='file']")
    const file = new File(["avatar"], "avatar.txt", { type: "text/plain" })

    expect(input).not.toBeNull()
    fireEvent.change(input!, { target: { files: [file] } })

    expect(screen.getByText("Envie uma imagem JPG, PNG ou WebP.")).toBeInTheDocument()
    expect(uploadProfileAvatarFile).not.toHaveBeenCalled()
  })
})
