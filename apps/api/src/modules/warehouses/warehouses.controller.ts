import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Audit } from "../../common/audit/audit.decorator";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import {
  CreateBinSchema,
  CreateWarehouseSchema,
  UpdateBinSchema,
  UpdateWarehouseSchema,
  WarehouseListQuerySchema,
  ReorderSchema,
} from "./dto/warehouse.schemas";
import { WarehousesService } from "./warehouses.service";

@Controller("warehouses")
@Audit({ entityType: "warehouse", idParam: "id" })
export class WarehousesController {
  constructor(private warehouses: WarehousesService) {}

  @Post()
  @RequirePerm("masters.write")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateWarehouseSchema)) body: any
  ) {
    return this.warehouses.create(user, body);
  }

  @Get()
  @RequirePerm("masters.read")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(WarehouseListQuerySchema)) query: any
  ) {
    return this.warehouses.list(user, query);
  }

  @Get(":id")
  @RequirePerm("masters.read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.warehouses.get(user, id);
  }

  @Patch("reorder")
  @RequirePerm("masters.write")
  reorder(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ReorderSchema)) body: any
  ) {
    return this.warehouses.updateSortOrder(user, body);
  }

  @Patch(":id")
  @RequirePerm("masters.write")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateWarehouseSchema)) body: any
  ) {
    return this.warehouses.update(user, id, body);
  }

  @Delete(":id")
  @RequirePerm("masters.write")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.warehouses.remove(user, id);
  }

  // ─── Bin endpoints (nested under warehouse) ─────────────

  @Post(":id/bins")
  @RequirePerm("masters.write")
  createBin(
    @CurrentUser() user: AuthUser,
    @Param("id") warehouseId: string,
    @Body(new ZodValidationPipe(CreateBinSchema)) body: any
  ) {
    return this.warehouses.createBin(user, warehouseId, body);
  }

  @Get(":id/bins")
  @RequirePerm("masters.read")
  listBins(
    @CurrentUser() user: AuthUser,
    @Param("id") warehouseId: string
  ) {
    return this.warehouses.listBins(user, warehouseId);
  }

  @Patch("bins/reorder")
  @RequirePerm("masters.write")
  reorderBins(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(ReorderSchema)) body: any
  ) {
    return this.warehouses.updateBinSortOrder(user, body);
  }

  @Patch("bins/:binId")
  @RequirePerm("masters.write")
  updateBin(
    @CurrentUser() user: AuthUser,
    @Param("binId") binId: string,
    @Body(new ZodValidationPipe(UpdateBinSchema)) body: any
  ) {
    return this.warehouses.updateBin(user, binId, body);
  }

  @Delete("bins/:binId")
  @RequirePerm("masters.write")
  removeBin(
    @CurrentUser() user: AuthUser,
    @Param("binId") binId: string
  ) {
    return this.warehouses.removeBin(user, binId);
  }
}
