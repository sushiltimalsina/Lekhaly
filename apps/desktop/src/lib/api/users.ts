// apps/web/src/lib/api/users.ts
import { apiRequest } from "./client";

export type UserInput = {
  email: string;
  password: string;
  name?: string;
  roleIds?: string[];
};

export async function listUsers(params?: { skip?: number; take?: number }) {
  return apiRequest<any>({
    method: "GET",
    path: "/users",
    query: params,
  });
}

export async function createUser(input: UserInput) {
  return apiRequest<any>({
    method: "POST",
    path: "/users",
    body: input,
  });
}

export async function getUser(id: string) {
  return apiRequest<any>({
    method: "GET",
    path: `/users/${id}`,
  });
}

export async function updateUser(id: string, input: Partial<UserInput>) {
  return apiRequest<any>({
    method: "PUT",
    path: `/users/${id}`,
    body: input,
  });
}
