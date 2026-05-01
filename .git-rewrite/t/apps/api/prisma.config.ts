import { defineConfig } from "prisma/config";
import * as path from "path";
import * as dotenv from "dotenv";

// Load apps/api/.env for Prisma CLI on Windows
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL
  },
  migrations: {
    seed: "pnpm ts-node prisma/seed.ts"
  }
});
