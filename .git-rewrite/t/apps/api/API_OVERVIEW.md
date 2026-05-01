# Lekhaly API Overview

This is a lightweight reference for frontend integration (not exhaustive).

## Nepali (BS) dates

For key date fields, BS dates are primary. Clients can send BS-only and the backend converts to AD for storage. AD is still accepted. Responses include both AD and BS fields when available. If a report has no date range, it defaults to the current BS fiscal year (company fiscalYearStartMonth).

- Vouchers: `voucherDateBs`
- Invoices: `dateBs`, `dueDateBs`
- Expenses: `dateBs`
- Bank statements: `periodFromBs`, `periodToBs`
- Bank statement lines: `dateBs`
- Stock adjustments: `dateBs`

## Auth

- `POST /auth/login` and `POST /v1/auth/login`
- `POST /auth/register` and `POST /v1/auth/register`
- `POST /auth/refresh` and `POST /v1/auth/refresh`
- `POST /auth/logout` and `POST /v1/auth/logout`
- `GET /auth/profile` and `GET /v1/auth/profile`
- `PATCH /auth/profile` and `PATCH /v1/auth/profile`
- `GET /auth/company` and `GET /v1/auth/company`
- `PATCH /auth/company` and `PATCH /v1/auth/company`
- `PATCH /auth/notifications` and `PATCH /v1/auth/notifications`
- `POST /auth/billing/portal` and `POST /v1/auth/billing/portal`
- `POST /auth/totp/setup` and `POST /v1/auth/totp/setup`
- `POST /auth/totp/enable` and `POST /v1/auth/totp/enable`
- `POST /auth/step-up` and `POST /v1/auth/step-up`

## Masters

- `GET/POST/PUT/DELETE /accounts`
- `GET/POST/PUT/DELETE /parties`
- `GET/POST/PUT/DELETE /items`
- `GET /items/:id/stock`
- `GET/POST/PUT/DELETE /taxes`

## Vouchers & Attachments

- `POST /vouchers/draft`
- `PUT /vouchers/:id/draft`
- `GET /vouchers/:id`
- `GET /vouchers/:id/preview`
- `GET /vouchers`
- `POST /vouchers/:id/post`
- `POST /vouchers/:id/void`
- `GET /vouchers/:id/attachments`
- `POST /vouchers/:id/attachments`
- `DELETE /vouchers/:id/attachments/:attachmentId`
- `GET /vouchers/:id/attachments/:attachmentId/url`

## Invoices

- `POST /invoices/draft`
- `POST /invoices/preview`
- `POST /invoices/:id/post`
- `POST /invoices/:id/void`
- `GET /invoices`
- `GET /invoices/:id`

## Expenses

- `POST /expenses/draft`
- `POST /expenses/preview`
- `POST /expenses/:id/post`
- `GET /expenses`

## Banking

- `POST /banking/accounts`
- `POST /banking/statements`
- `POST /banking/statements/:id/lines`
- `GET /banking/statements`
- `GET /banking/statements/:id`
- `POST /banking/reconcile`
- `POST /banking/reconcile/:lineId/unmatch`
- `POST /banking/sync/connect`
- `GET /banking/sync/status`
- `POST /banking/sync/refresh`

## Reports

- `GET /reports/trial-balance`
- `GET /reports/profit-loss`
- `GET /reports/balance-sheet`
- `GET /reports/party-aging`
- `GET /reports/ledger`
- `POST /reports/export`

## PDF

- `POST /pdf/invoice/:invoiceId`
- `POST /pdf/voucher/:voucherId`
- `POST /pdf/ledger`
- `GET /pdf/jobs/:id`
- `GET /pdf/jobs/:id/url`

## Audit & Outbox

- `GET /audit`
- `GET /audit/export`
- `GET /outbox`
- `POST /outbox/:id/ack`

## Devices

- `GET /devices`
- `POST /devices/:id/trust`
- `DELETE /devices/:id/users/:userId`

## Roles & Users

- `GET /roles`
- `GET /roles/permissions`
- `GET /roles/:id`
- `POST /roles`
- `PUT /roles/:id`
- `DELETE /roles/:id`
- `POST /roles/:id/users`
- `DELETE /roles/:id/users/:userId`

- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
