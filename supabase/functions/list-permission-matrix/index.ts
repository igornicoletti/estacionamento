import {
  actorHasPermission,
  authError,
  createAdminClient,
  getAuthenticatedActor,
  handleCors,
  jsonResponse,
} from "../_shared/index.ts"
import {
  buildPermissionMatrix,
  permissionMatrixLimits,
} from "./permission-matrix.ts"

function resolveRequestId(request: Request) {
  const requestId = request.headers.get("x-request-id")?.trim()

  return requestId && /^[A-Za-z0-9._:-]{1,128}$/.test(requestId)
    ? requestId
    : crypto.randomUUID()
}

function withRequestId(response: Response, requestId: string) {
  const headers = new Headers(response.headers)
  headers.set("x-request-id", requestId)

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}

Deno.serve(async (req) => {
  const requestId = resolveRequestId(req)
  const cors = handleCors(req)

  if (cors) {
    return withRequestId(cors, requestId)
  }

  if (req.method !== "POST") {
    return withRequestId(authError("method_not_allowed", 405, req), requestId)
  }

  try {
    const actor = await getAuthenticatedActor(req)
    const supabase = createAdminClient()

    if (!actor || actor.status !== "active") {
      return withRequestId(authError("unauthorized", 401, req), requestId)
    }

    if (!(await actorHasPermission(actor, "permissions.read", supabase))) {
      return withRequestId(authError("forbidden", 403, req), requestId)
    }

    const [permissionsResponse, rolesResponse, rolePermissionsResponse] = await Promise.all([
      supabase
        .from("app_permissions")
        .select("key, label, description")
        .order("label", { ascending: true })
        .order("key", { ascending: true })
        .limit(permissionMatrixLimits.permissions + 1),
      supabase
        .from("app_roles")
        .select("key, label")
        .order("label", { ascending: true })
        .order("key", { ascending: true })
        .limit(permissionMatrixLimits.roles + 1),
      supabase
        .from("app_role_permissions")
        .select("permission_key, role_key")
        .limit(permissionMatrixLimits.rolePermissions + 1),
    ])

    if (
      permissionsResponse.error ||
      rolesResponse.error ||
      rolePermissionsResponse.error
    ) {
      console.error("permission_matrix_query_failed", {
        requestId,
        permissions: permissionsResponse.error?.message,
        roles: rolesResponse.error?.message,
        rolePermissions: rolePermissionsResponse.error?.message,
      })
      return withRequestId(authError("dependency_unavailable", 503, req), requestId)
    }

    const permissions = permissionsResponse.data ?? []
    const roles = rolesResponse.data ?? []
    const rolePermissions = rolePermissionsResponse.data ?? []

    if (
      permissions.length > permissionMatrixLimits.permissions ||
      roles.length > permissionMatrixLimits.roles ||
      rolePermissions.length > permissionMatrixLimits.rolePermissions
    ) {
      console.error("permission_matrix_limit_exceeded", {
        requestId,
        permissions: permissions.length,
        roles: roles.length,
        rolePermissions: rolePermissions.length,
      })
      return withRequestId(authError("invalid_response", 502, req), requestId)
    }

    try {
      const matrix = buildPermissionMatrix({ permissions, rolePermissions, roles })
      return withRequestId(jsonResponse({ ok: true, ...matrix }, 200, req), requestId)
    } catch (error) {
      console.error("permission_matrix_invalid_response", {
        requestId,
        error: error instanceof Error ? error.message : "unknown",
      })
      return withRequestId(authError("invalid_response", 502, req), requestId)
    }
  } catch (error) {
    console.error("permission_matrix_request_failed", {
      requestId,
      error: error instanceof Error ? error.message : "unknown",
    })
    return withRequestId(authError("request_failed", 500, req), requestId)
  }
})
