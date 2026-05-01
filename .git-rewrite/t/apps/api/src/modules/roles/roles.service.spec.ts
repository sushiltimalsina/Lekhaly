import { ConflictException, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../common/auth/auth.types";
import { RolesService } from "./roles.service";

describe("RolesService", () => {
  let service: RolesService;
  let prisma: any;
  const user = { sub: "user-1", companyId: "company-1" } as AuthUser;

  beforeEach(() => {
    prisma = {
      role: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      permission: {
        findMany: jest.fn()
      },
      rolePermission: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      userRole: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn()
      },
      user: {
        findFirst: jest.fn()
      },
      $transaction: jest.fn()
    };

    prisma.$transaction.mockImplementation((callback: (client: any) => any) => callback(prisma));
    service = new RolesService(prisma);
  });

  it("lists roles", async () => {
    prisma.role.findMany.mockResolvedValue([{ id: "role-1", name: "Admin" }]);
    const result = await service.list(user, {});
    expect(result).toHaveLength(1);
  });

  it("creates role with permissions", async () => {
    prisma.permission.findMany.mockResolvedValue([{ code: "reports.view" }]);
    prisma.role.create.mockResolvedValue({ id: "role-1" });

    const result = await service.create(user, {
      name: "Viewer",
      permissionCodes: ["reports.view"]
    });

    expect(result.id).toBe("role-1");
    expect(prisma.role.create).toHaveBeenCalled();
  });

  it("throws conflict on duplicate role name", async () => {
    prisma.permission.findMany.mockResolvedValue([{ code: "reports.view" }]);
    prisma.role.create.mockRejectedValue({ code: "P2002" });

    await expect(
      service.create(user, { name: "Admin", permissionCodes: ["reports.view"] })
    ).rejects.toThrow(ConflictException);
  });

  it("updates role permissions", async () => {
    prisma.role.findFirst.mockResolvedValue({ id: "role-1", companyId: user.companyId });
    prisma.permission.findMany.mockResolvedValue([{ code: "reports.view" }]);
    prisma.role.update.mockResolvedValue({ id: "role-1" });

    const result = await service.update(user, "role-1", {
      permissionCodes: ["reports.view"]
    });

    expect(result.id).toBe("role-1");
    expect(prisma.rolePermission.deleteMany).toHaveBeenCalled();
    expect(prisma.rolePermission.createMany).toHaveBeenCalled();
  });

  it("removes role only when unassigned", async () => {
    prisma.role.findFirst.mockResolvedValue({ id: "role-1", userRoles: [] });
    const result = await service.remove(user, "role-1");
    expect(result).toEqual({ id: "role-1", deleted: true });
  });

  it("assigns and removes user roles", async () => {
    prisma.role.findFirst.mockResolvedValue({ id: "role-1", companyId: user.companyId });
    prisma.user.findFirst.mockResolvedValue({ id: "user-2", companyId: user.companyId });
    prisma.userRole.create.mockResolvedValue({ userId: "user-2", roleId: "role-1" });

    const assigned = await service.assignUser(user, "role-1", "user-2");
    expect(assigned.assigned).toBe(true);

    prisma.userRole.findUnique.mockResolvedValue({ userId: "user-2", roleId: "role-1" });
    const removed = await service.removeUser(user, "role-1", "user-2");
    expect(removed.removed).toBe(true);
  });

  it("throws when role missing", async () => {
    prisma.role.findFirst.mockResolvedValue(null);
    await expect(service.getById(user, "missing")).rejects.toThrow(NotFoundException);
  });
});
