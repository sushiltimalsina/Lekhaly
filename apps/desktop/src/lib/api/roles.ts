// apps/desktop/src/lib/api/roles.ts
import { apiRequest } from "./client";

export type RoleInput = {
  name: string;
  permissionCodes: string[];
};

export async function listRoles(params?: { skip?: number; take?: number }) {
  return apiRequest<any>({
    method: "GET",
    path: "/roles",
    query: params,
  });
}

export async function createRole(input: RoleInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/roles",
    body: input,
  });
}

export async function listPermissions() {
  return apiRequest<any>({
    method: "GET",
    path: "/roles/permissions",
  });
}
