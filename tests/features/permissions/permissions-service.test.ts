import { afterEach, describe, expect, it, vi } from "vitest"

import {
  resetPermissionsGateway,
  setPermissionsGateway,
} from "@/features/permissions/gateways/permissions-gateway"
import { listPermissionMatrix } from "@/features/permissions/services/permissions-service"
import { createPermissionMatrixPayload } from "../../helpers/permissions-memory-gateway"

describe("permissions service", () => {
  afterEach(() => {
    resetPermissionsGateway()
  })

  it("returns the matrix supplied by the protected backend gateway", async () => {
    const listMatrix = vi.fn().mockResolvedValue(createPermissionMatrixPayload())
    setPermissionsGateway({ listMatrix })

    const matrix = await listPermissionMatrix()

    expect(listMatrix).toHaveBeenCalledOnce()
    expect(matrix.permissions).toHaveLength(1)
    expect(matrix.permissions[0]?.key).toBe("audit.read")
    expect(matrix.roles).toHaveLength(5)
  })

  it("does not replace a backend failure with a generated fallback", async () => {
    setPermissionsGateway({
      listMatrix: () => Promise.reject(new Error("backend indisponível")),
    })

    await expect(listPermissionMatrix()).rejects.toThrow("backend indisponível")
  })
})
