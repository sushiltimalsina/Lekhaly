import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    let candidate = value;
    if (typeof value === "string") {
      try {
        candidate = JSON.parse(value);
      } catch {
        candidate = value;
      }
    }
    const parsed = this.schema.safeParse(candidate);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: parsed.error.issues
      });
    }
    return parsed.data;
  }
}
