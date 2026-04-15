# Lekhaly

A Nepal-focused accounting platform built as a monorepo with multi-tenant support, Bikram Sambat (BS) date system, VAT compliance, and offline-first desktop sync.

## Architecture

| App/Package | Technology | Purpose |
|-------------|-----------|---------|
| `apps/api` | NestJS + Prisma + PostgreSQL | REST API backend |
| `apps/web` | Next.js 15 + React 19 + Tailwind | Web dashboard |
| `apps/desktop` | Tauri + Vite | Desktop application (offline-capable) |
| `packages/db` | Prisma Client | Shared database client |
| `packages/core` | TypeScript | Shared business logic & constants |
| `packages/schemas` | Zod | Shared validation schemas |
| `packages/ui` | React | Shared UI component library |
| `packages/utils` | TypeScript | Shared utilities (dates, formatting, logging) |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10.28
- **PostgreSQL** >= 15
- **Rust** (for Tauri desktop app only)

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd lekhaly

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secrets

# 3. Install dependencies
pnpm install

# 4. Set up the database
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..

# 5. Start development servers (API + Web)
pnpm dev
```

The API runs on `http://localhost:4000` and the web app on `http://localhost:3000`.

## Key Features

- **Multi-tenant** — each company is fully isolated
- **Double-entry accounting** — vouchers, journals, invoices
- **Nepali calendar** — BS date support throughout
- **VAT compliance** — 13% VAT, tax register, IRD-ready
- **RBAC** — role-based access control with granular permissions
- **2FA** — TOTP-based two-factor authentication
- **Audit trail** — full audit logging with before/after snapshots
- **Offline sync** — device-based sync for desktop clients
- **PDF generation** — invoices, vouchers, ledger reports
- **Banking** — bank reconciliation, statement import

## Project Structure

```
lekhaly/
├── apps/
│   ├── api/          # NestJS backend (port 4000)
│   ├── web/          # Next.js frontend (port 3000)
│   └── desktop/      # Tauri desktop app
├── packages/
│   ├── db/           # Prisma schema & client
│   ├── core/         # Shared business logic
│   ├── schemas/      # Zod validation schemas
│   ├── ui/           # Shared React components
│   └── utils/        # Shared utilities
├── docs/             # Documentation
├── infra/            # Docker & infrastructure
├── turbo.json        # Turborepo pipeline config
└── pnpm-workspace.yaml
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Run linting across all packages |
| `pnpm test` | Run tests across all packages |

## API Documentation

OpenAPI specification is available at `apps/api/openapi.yaml`.

## License

Private — All rights reserved.
