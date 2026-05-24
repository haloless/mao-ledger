import { db } from './db';
import type {
  Contract,
  ExportPayload,
  ImportResult,
  MergeConflict,
  MonthlyPlan,
  MonthlySummary,
  Transaction,
} from './types';
import { EXPORT_VERSION } from './types';

// ─── Export ──────────────────────────────────────────────────────────────────

export async function exportData(): Promise<ExportPayload> {
  const [contracts, monthlyPlans, transactions, monthlySummaries, settingsRows] =
    await Promise.all([
      db.contracts.toArray(),
      db.monthlyPlans.toArray(),
      db.transactions.toArray(),
      db.monthlySummaries.toArray(),
      db.appSettings.toArray(),
    ]);

  const payload: ExportPayload = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    contracts,
    monthlyPlans,
    transactions,
    monthlySummaries,
    appSettings: settingsRows[0] ?? null,
  };

  // Update lastExportAt in settings
  const settings = settingsRows[0];
  if (settings) {
    await db.appSettings.update('settings', { lastExportAt: payload.exportedAt });
  }

  return payload;
}

/** Trigger a file download for the export payload. */
export function downloadExport(payload: ExportPayload): void {
  const date = payload.exportedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mao-ledger-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Validation ──────────────────────────────────────────────────────────────

export class ImportValidationError extends Error {}

function requireField(obj: Record<string, unknown>, field: string, context: string): void {
  if (obj[field] === undefined || obj[field] === null) {
    throw new ImportValidationError(`缺少必填字段 "${field}" (${context})`);
  }
}

function validateContract(c: unknown, idx: number): void {
  const o = c as Record<string, unknown>;
  const ctx = `contracts[${idx}]`;
  requireField(o, 'id', ctx);
  requireField(o, 'version', ctx);
  requireField(o, 'updatedAt', ctx);
  requireField(o, 'monthlyAllowance', ctx);
}

function validatePlan(p: unknown, idx: number): void {
  const o = p as Record<string, unknown>;
  const ctx = `monthlyPlans[${idx}]`;
  requireField(o, 'id', ctx);
  requireField(o, 'month', ctx);
  requireField(o, 'updatedAt', ctx);
}

function validateTransaction(t: unknown, idx: number): void {
  const o = t as Record<string, unknown>;
  const ctx = `transactions[${idx}]`;
  requireField(o, 'id', ctx);
  requireField(o, 'date', ctx);
  requireField(o, 'month', ctx);
  requireField(o, 'type', ctx);
  requireField(o, 'amount', ctx);
  requireField(o, 'updatedAt', ctx);
}

export function validatePayload(raw: unknown): ExportPayload {
  if (typeof raw !== 'object' || raw === null) {
    throw new ImportValidationError('JSON 格式无效');
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj['version'] !== 'number') {
    throw new ImportValidationError('缺少版本号字段 version');
  }
  if (obj['version'] > EXPORT_VERSION) {
    throw new ImportValidationError(
      `文件版本 ${obj['version']} 高于当前支持的版本 ${EXPORT_VERSION}，请升级应用`,
    );
  }

  const contracts = Array.isArray(obj['contracts']) ? obj['contracts'] : [];
  contracts.forEach(validateContract);

  const monthlyPlans = Array.isArray(obj['monthlyPlans']) ? obj['monthlyPlans'] : [];
  monthlyPlans.forEach(validatePlan);

  const transactions = Array.isArray(obj['transactions']) ? obj['transactions'] : [];
  transactions.forEach(validateTransaction);

  return raw as ExportPayload;
}

// ─── Merge Logic ─────────────────────────────────────────────────────────────

type Updatable = { id: string; updatedAt?: string };

/**
 * Merge a single table using the rules from design.md:
 * - Different id  → insert
 * - Same id, identical content → skip
 * - Same id, different content, both have updatedAt → keep newer
 * - Same id, different content, missing updatedAt → add to conflicts
 */
async function mergeTable<T extends Updatable>(
  table: { get: (id: string) => Promise<T | undefined>; put: (item: T) => Promise<unknown> },
  incoming: T[],
  tableName: string,
  result: ImportResult,
): Promise<void> {
  for (const item of incoming) {
    const local = await table.get(item.id);

    if (!local) {
      await table.put(item);
      result.added++;
      continue;
    }

    // Check if content is identical (compare JSON sans whitespace)
    if (JSON.stringify(local) === JSON.stringify(item)) {
      result.skipped++;
      continue;
    }

    // Content differs — resolve by updatedAt
    if (!local.updatedAt || !item.updatedAt) {
      const conflict: MergeConflict = { table: tableName, id: item.id, local, incoming: item };
      result.conflicts.push(conflict);
      continue;
    }

    if (item.updatedAt > local.updatedAt) {
      await table.put(item);
      result.overwritten++;
    } else {
      result.skipped++;
    }
  }
}

/** Merge an imported payload into the local DB. Returns counts and conflicts. */
export async function mergeImport(payload: ExportPayload): Promise<ImportResult> {
  const result: ImportResult = { added: 0, skipped: 0, overwritten: 0, conflicts: [] };

  await mergeTable(db.contracts, payload.contracts as Contract[], 'contracts', result);
  await mergeTable(db.monthlyPlans, payload.monthlyPlans as MonthlyPlan[], 'monthlyPlans', result);
  await mergeTable(
    db.transactions,
    payload.transactions as Transaction[],
    'transactions',
    result,
  );
  await mergeTable(
    db.monthlySummaries,
    payload.monthlySummaries as MonthlySummary[],
    'monthlySummaries',
    result,
  );

  return result;
}

/** Overwrite-import: replaces all local data with the payload. */
export async function overwriteImport(payload: ExportPayload): Promise<void> {
  await db.transaction(
    'rw',
    [db.contracts, db.monthlyPlans, db.transactions, db.monthlySummaries],
    async () => {
      await db.contracts.clear();
      await db.monthlyPlans.clear();
      await db.transactions.clear();
      await db.monthlySummaries.clear();

      if (payload.contracts.length) await db.contracts.bulkPut(payload.contracts);
      if (payload.monthlyPlans.length) await db.monthlyPlans.bulkPut(payload.monthlyPlans);
      if (payload.transactions.length) await db.transactions.bulkPut(payload.transactions);
      if (payload.monthlySummaries.length)
        await db.monthlySummaries.bulkPut(payload.monthlySummaries);
    },
  );
}
