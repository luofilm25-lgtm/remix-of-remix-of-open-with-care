import { cachedSetting } from "./app-settings";

export type PaymentSettings = { backend_url?: string };

export const DEFAULT_PAYMENT_BACKEND = "https://function-bun-production-038e6.up.railway.app";

export function paymentBackend() {
  const saved = cachedSetting<PaymentSettings>("payment", {});
  return (saved.backend_url || DEFAULT_PAYMENT_BACKEND).trim().replace(/\/+$/, "");
}

export const CURRENCY_CODE = "UGX";
export const CURRENCY_LABEL = "UG SHS";
export const formatMoney = (n: number) =>
  `${CURRENCY_LABEL} ${Number(n || 0).toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;

export function normalizeMsisdn(input: string) {
  const d = (input ?? "").replace(/[^0-9]/g, "");
  if (d.startsWith("256")) return `+${d}`;
  if (d.startsWith("0")) return `+256${d.slice(1)}`;
  if (d.length === 9) return `+256${d}`;
  return `+${d}`;
}

export const isValidMsisdn = (v: string) => /^\+256[37]\d{8}$/.test(normalizeMsisdn(v));

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${paymentBackend()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { message: text };
  }
  if (!res.ok) {
    const p = payload as { message?: string; error?: string };
    throw new Error(p.message ?? p.error ?? `Payment service error (${res.status})`);
  }
  return payload as T;
}

export type DepositInput = {
  msisdn: string;
  amount: number;
  currency?: string;
  reference: string;
  description?: string;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const relworx = {
  health: () => call<any>("/health"),
  validatePhone: (msisdn: string) =>
    call<any>("/api/validate-phone", { method: "POST", body: JSON.stringify({ msisdn }) }),
  deposit: (input: DepositInput) =>
    call<any>("/api/deposit", {
      method: "POST",
      body: JSON.stringify({ currency: CURRENCY_CODE, ...input }),
    }),
  withdraw: (input: DepositInput) =>
    call<any>("/api/withdraw", {
      method: "POST",
      body: JSON.stringify({ currency: CURRENCY_CODE, ...input }),
    }),
  balance: (currency = CURRENCY_CODE) =>
    call<any>(`/api/wallet/balance?currency=${encodeURIComponent(currency)}`),
  requestStatus: (internalReference: string) =>
    call<any>(`/api/request-status?internal_reference=${encodeURIComponent(internalReference)}`),
  transactions: () => call<any>("/api/transactions"),
};

const SUCCESS = /^(success|successful|completed|complete|paid)$/i;
const FAILED = /^(failed|failure|cancelled|canceled|declined|error|rejected|expired)$/i;

export function readStatus(payload: any): {
  status: "pending" | "success" | "failed";
  message: string;
} {
  const raw =
    payload?.status ??
    payload?.data?.status ??
    payload?.request?.status ??
    payload?.transaction?.status ??
    payload?.request_status;
  const message = String(
    payload?.message ?? payload?.data?.message ?? payload?.request?.message ?? "",
  );
  if (typeof raw === "string") {
    if (SUCCESS.test(raw)) return { status: "success", message: message || "Payment received" };
    if (FAILED.test(raw)) return { status: "failed", message: message || "Payment failed" };
  }
  if (raw == null && payload?.success === false)
    return { status: "failed", message: message || "Payment failed" };
  return { status: "pending", message: message || "Waiting for confirmation" };
}

/** Live Relworx wallet balance in UGX; null when the service is unreachable. */
export async function walletBalance(currency = CURRENCY_CODE): Promise<number | null> {
  try {
    const res = await relworx.balance(currency);
    const raw =
      res?.balance ?? res?.data?.balance ?? res?.wallet?.balance ?? res?.available_balance;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}
