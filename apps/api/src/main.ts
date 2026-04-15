import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS — use CORS_ORIGINS env var in production, fallback to localhost
  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:3000", "http://localhost:1420"];
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.setGlobalPrefix("v1");

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`);
}
bootstrap();
