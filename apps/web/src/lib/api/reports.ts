// apps/web/src/lib/api/reports.ts
import { apiRequest } from "./client";

export async function getTrialBalance(params?: Record<string, any>) {
  return apiRequest<any>({
    method: "GET",
    path: "/reports/trial-balance",
    query: params,
  });
}

export async function getProfitLoss(params?: Record<string, any>) {
  return apiRequest<any>({
    method: "GET",
    path: "/reports/profit-loss",
    query: params,
  });
}

export async function getBalanceSheet(params?: Record<string, any>) {
  return apiRequest<any>({
    method: "GET",
    path: "/reports/balance-sheet",
    query: params,
  });
}

export async function getPartyAging(params?: Record<string, any>) {
  return apiRequest<any>({
    method: "GET",
    path: "/reports/party-aging",
    query: params,
  });
}

export async function getLedger(params?: Record<string, any>) {
  return apiRequest<any>({
    method: "GET",
    path: "/reports/ledger",
    query: params,
  });
}

export async function exportReport(body: Record<string, any>) {
  return apiRequest<any>({
    method: "POST",
    path: "/reports/export",
    body,
  });
}
