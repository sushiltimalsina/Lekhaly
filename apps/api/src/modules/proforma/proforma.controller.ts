import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser, RequirePerm } from "../../common/auth/auth.decorator";
import { ZodValidationPipe } from "../../common/zod/zod.pipe";
import type { AuthUser } from "../../common/auth/auth.types";
import { CreateProformaSchema, ListProformaQuerySchema } from "./dto/proforma.schemas";
import { ProformaService } from "./proforma.service";

@Controller("proforma")
export class ProformaController {
  constructor(private proforma: ProformaService) {}

  /**
   * Create a proforma invoice for offline printing.
   * Returns a device-specific local number (e.g. PRF-D1-003).
   */
  @Post("create")
  @RequirePerm("voucher.draft.create")
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateProformaSchema)) body: any
  ) {
    return this.proforma.create(user, body);
  }

  /**
   * Convert a proforma into a real posted voucher.
   * Assigns the next sequential IRD-compliant voucher number.
   */
  @Post(":id/convert")
  @RequirePerm("voucher.post")
  convert(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string
  ) {
    return this.proforma.convert(user, id);
  }

  /**
   * Batch convert all unconverted proformas for a device.
   * Called when desktop app comes online and syncs.
   */
  @Post("batch-convert/:deviceId")
  @RequirePerm("voucher.post")
  batchConvert(
    @CurrentUser() user: AuthUser,
    @Param("deviceId") deviceId: string
  ) {
    return this.proforma.batchConvert(user, deviceId);
  }

  /** List proformas (filter by converted status) */
  @Get()
  @RequirePerm("voucher.preview")
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(ListProformaQuerySchema)) query: any
  ) {
    return this.proforma.list(user, query);
  }

  /** Get proforma details */
  @Get(":id")
  @RequirePerm("voucher.preview")
  getById(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string
  ) {
    return this.proforma.getById(user, id);
  }
}
