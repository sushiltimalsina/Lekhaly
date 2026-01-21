import { ConflictException, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../common/auth/auth.types";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: any;
  const user = { sub: "user-1", companyId: "company-1" } as AuthUser;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn()
      },
      role: {
        findMany: jest.fn()
      },
      userRole: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
      },
      $transaction: jest.fn()
    };
    prisma.$transaction.mockImplementation((callback: (client: any) => any) => callback(prisma));
    service = new UsersService(prisma);
  });

  it("lists users", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: "user-1" }]);
    const result = await service.list(user, {});
    expect(result).toHaveLength(1);
  });

  it("creates a user with roles", async () => {
    prisma.role.findMany.mockResolvedValue([{ id: "role-1" }]);
    prisma.user.create.mockResolvedValue({ id: "user-2" });

    const result = await service.create(user, {
      email: "new@example.com",
      name: "New User",
      password: "password123",
      roleIds: ["role-1"]
    });

    expect(result.id).toBe("user-2");
    expect(prisma.userRole.createMany).toHaveBeenCalled();
  });

  it("throws on duplicate email", async () => {
    prisma.role.findMany.mockResolvedValue([]);
    prisma.user.create.mockRejectedValue({ code: "P2002" });
    await expect(
      service.create(user, {
        email: "dup@example.com",
        password: "password123"
      })
    ).rejects.toThrow(ConflictException);
  });

  it("updates roles", async () => {
    prisma.user.findFirst.mockResolvedValue({ id: "user-2", companyId: user.companyId });
    prisma.role.findMany.mockResolvedValue([{ id: "role-1" }]);
    prisma.user.update.mockResolvedValue({ id: "user-2" });

    const result = await service.update(user, "user-2", { roleIds: ["role-1"] });
    expect(result.id).toBe("user-2");
    expect(prisma.userRole.deleteMany).toHaveBeenCalled();
    expect(prisma.userRole.createMany).toHaveBeenCalled();
  });

  it("throws when user missing", async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.getById(user, "missing")).rejects.toThrow(NotFoundException);
  });
});
