import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { PdfController } from "./pdf.controller";
import { PdfService } from "./pdf.service";
import { PdfWorker } from "./pdf.worker";

@Module({
  imports: [PrismaModule],
  controllers: [PdfController],
  providers: [PdfService, PdfWorker]
})
export class PdfModule {}
