// apps/web/src/lib/api/roles.ts
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

export async function getRole(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/roles/${id}`,
  });
}

export async function updateRole(id: string, input: RoleInput) {
  return apiRequest<any>({
    method: "PUT",
    path: `/roles/${id}`,
    body: input,
  });
}

export async function deleteRole(id: string) {
  return apiRequest<any>({
    method: "DELETE",
    path: `/roles/${id}`,
  });
}

export async function addUsersToRole(id: string, body: { userIds: string[] }) {
  return apiRequest<any>({
    method: "POST",
    path: `/roles/${id}/users`,
    body,
  });
}

export async function removeUserFromRole(id: string, userId: string) {
  return apiRequest<any>({
    method: "DELETE",
    path: `/roles/${id}/users/${userId}`,
  });
}
