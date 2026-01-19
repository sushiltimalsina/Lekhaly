import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ["http://localhost:3000"],
    credentials: true,
  });
  app.setGlobalPrefix("v1");
  await app.listen(process.env.API_PORT ? Number(process.env.API_PORT) : 4000);


}
bootstrap();
