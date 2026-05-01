import type { AuthUser } from "../../common/auth/auth.types";
import { PdfService } from "./pdf.service";

describe("PdfService", () => {
  let service: PdfService;
  let prisma: any;
  const user = { sub: "user-1", companyId: "company-1" } as AuthUser;

  beforeEach(() => {
    prisma = {
      pdfJob: {
        create: jest.fn(),
        findFirst: jest.fn()
      }
    };
    service = new PdfService(prisma);
  });

  it("creates a PDF job", async () => {
    prisma.pdfJob.create.mockResolvedValue({ id: "job-1" });
    const result = await service.createJob(user, "invoice", { invoiceId: "inv-1" });
    expect(result.id).toBe("job-1");
  });

  it("returns job download url", async () => {
    prisma.pdfJob.findFirst.mockResolvedValue({
      id: "job-2",
      companyId: user.companyId,
      resultKey: "pdf/invoice/job-2.pdf"
    });

    const result = await service.getJobDownloadUrl(user, "job-2");
    expect(result.url).toContain("pdf/invoice/job-2.pdf");
  });
});
