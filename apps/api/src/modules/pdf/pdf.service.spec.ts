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
});
