export type Contract = Record<string, { input: unknown; output: unknown }>;

export const RPC_CHANNEL = 'extension-rpc';

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
