import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
export declare class OutboxWorkerService implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private readonly logger;
    private timer;
    private running;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private nextDelay;
    private handleEvent;
    processPendingBatch(limit?: number): Promise<void>;
}
