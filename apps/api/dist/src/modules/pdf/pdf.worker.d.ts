import { OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
export declare class PdfWorker implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private readonly logger;
    private timer;
    private running;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    process(limit?: number): Promise<void>;
}
