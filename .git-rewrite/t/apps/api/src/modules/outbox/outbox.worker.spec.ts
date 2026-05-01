import { OutboxWorkerService } from "./outbox.worker";

describe("OutboxWorkerService", () => {
  let worker: OutboxWorkerService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      outboxEvent: {
        findMany: jest.fn(),
        update: jest.fn()
      }
    };
    worker = new OutboxWorkerService(prisma);
  });

  it("processes report export events", async () => {
    prisma.outboxEvent.findMany.mockResolvedValue([
      { id: "evt-1", type: "report.export", payload: { report: "trial-balance" }, attempts: 0 }
    ]);

    await worker.processPendingBatch(1);

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "evt-1" },
      data: {
        status: "processed",
        processedAt: expect.any(Date),
        lastError: null
      }
    });
  });

  it("marks unsupported events as failed after retries", async () => {
    prisma.outboxEvent.findMany.mockResolvedValue([
      { id: "evt-2", type: "unknown", payload: {}, attempts: 5 }
    ]);

    await worker.processPendingBatch(1);

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "evt-2" },
      data: {
        attempts: 6,
        status: "failed",
        lastError: expect.stringContaining("Unsupported outbox type"),
        nextAttemptAt: null
      }
    });
  });
});
