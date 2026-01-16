import { Body, Controller, Get, Post } from "@nestjs/common";
import { RequirePerm, RequireStep } from "../../common/auth/auth.decorator";

@Controller("reports")
export class ReportsController {
  @Get("trial-balance")
  @RequirePerm("reports.view")
  trialBalance() {
    return { ok: true, report: "trial-balance" };
  }

  @Post("export")
  @RequirePerm("export.pdf")
  @RequireStep("sensitive")
  export(@Body() body: { report: string }) {
    return { ok: true, report: body.report || "unknown" };
  }
}
