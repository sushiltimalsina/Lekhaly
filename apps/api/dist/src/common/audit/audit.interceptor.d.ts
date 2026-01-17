import { NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { Observable } from "rxjs";
export declare class AuditInterceptor implements NestInterceptor {
    private prisma;
    private reflector;
    constructor(prisma: PrismaService, reflector: Reflector);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
