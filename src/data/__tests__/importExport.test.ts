import { describe, it, expect, beforeEach } from 'vitest';
import { validatePayload, ImportValidationError, mergeImport } from '../importExport';
import type { Contract, ExportPayload, Transaction } from '../types';
import { EXPORT_VERSION } from '../types';
import { db } from '../db';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeContract(overrides: Partial<Contract> = {}): Contract {
  return {
    id: 'c1',
    version: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    monthlyAllowance: 500,
    savingRatio: 0.2,
    threshold: 50,
    rules: '',
    ...overrides,
  };
}

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    date: '2024-06-05',
    month: '2024-06',
    type: 'expense',
    category: 'food',
    amount: 50,
    note: '',
    createdAt: '2024-06-05T00:00:00.000Z',
    updatedAt: '2024-06-05T00:00:00.000Z',
    ...overrides,
  };
}

function makePayload(overrides: Partial<ExportPayload> = {}): ExportPayload {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    contracts: [],
    monthlyPlans: [],
    transactions: [],
    monthlySummaries: [],
    appSettings: null,
    ...overrides,
  };
}

// ─── validatePayload ──────────────────────────────────────────────────────────

describe('validatePayload', () => {
  it('accepts a minimal valid payload', () => {
    const p = makePayload();
    expect(() => validatePayload(p)).not.toThrow();
  });

  it('throws on non-object input', () => {
    expect(() => validatePayload(null)).toThrow(ImportValidationError);
    expect(() => validatePayload('string')).toThrow(ImportValidationError);
  });

  it('throws when version field is missing', () => {
    const p = { ...makePayload(), version: undefined };
    expect(() => validatePayload(p)).toThrow(ImportValidationError);
  });

  it('throws when incoming version is higher than supported', () => {
    const p = makePayload({ version: EXPORT_VERSION + 1 });
    expect(() => validatePayload(p)).toThrow(ImportValidationError);
  });

  it('throws when a contract is missing required field', () => {
    const bad = { version: EXPORT_VERSION, contracts: [{ id: 'c1' }], monthlyPlans: [], transactions: [], monthlySummaries: [] };
    expect(() => validatePayload(bad)).toThrow(ImportValidationError);
  });

  it('throws when a transaction is missing required field', () => {
    const bad = makePayload({ transactions: [{ id: 't1' } as unknown as Transaction] });
    expect(() => validatePayload(bad)).toThrow(ImportValidationError);
  });

  it('treats missing arrays as empty (no throw)', () => {
    const minimal = { version: EXPORT_VERSION };
    expect(() => validatePayload(minimal)).not.toThrow();
  });
});

// ─── mergeImport ─────────────────────────────────────────────────────────────
// Uses fake-indexeddb (auto-polyfilled in setup.ts) for an in-memory Dexie DB.

describe('mergeImport', () => {
  beforeEach(async () => {
    await db.contracts.clear();
    await db.transactions.clear();
    await db.monthlyPlans.clear();
    await db.monthlySummaries.clear();
  });

  it('adds new records (different id)', async () => {
    const c = makeContract({ id: 'c-new' });
    const result = await mergeImport(makePayload({ contracts: [c] }));
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(0);
    const stored = await db.contracts.get('c-new');
    expect(stored?.id).toBe('c-new');
  });

  it('skips records with identical content', async () => {
    const c = makeContract({ id: 'c1' });
    await db.contracts.put(c);
    const result = await mergeImport(makePayload({ contracts: [c] }));
    expect(result.skipped).toBe(1);
    expect(result.added).toBe(0);
  });

  it('overwrites when incoming updatedAt is newer', async () => {
    const local = makeContract({ id: 'c1', updatedAt: '2024-01-01T00:00:00.000Z', monthlyAllowance: 400 });
    await db.contracts.put(local);
    const incoming = makeContract({ id: 'c1', updatedAt: '2024-06-01T00:00:00.000Z', monthlyAllowance: 600 });
    const result = await mergeImport(makePayload({ contracts: [incoming] }));
    expect(result.overwritten).toBe(1);
    const stored = await db.contracts.get('c1');
    expect(stored?.monthlyAllowance).toBe(600);
  });

  it('skips when incoming updatedAt is older', async () => {
    const local = makeContract({ id: 'c1', updatedAt: '2024-06-01T00:00:00.000Z', monthlyAllowance: 600 });
    await db.contracts.put(local);
    const incoming = makeContract({ id: 'c1', updatedAt: '2024-01-01T00:00:00.000Z', monthlyAllowance: 400 });
    const result = await mergeImport(makePayload({ contracts: [incoming] }));
    expect(result.skipped).toBe(1);
    const stored = await db.contracts.get('c1');
    expect(stored?.monthlyAllowance).toBe(600); // local wins
  });

  it('records a conflict when updatedAt is missing on either side', async () => {
    const local = makeContract({ id: 'c1', updatedAt: undefined as unknown as string, monthlyAllowance: 400 });
    await db.contracts.put(local);
    const incoming = makeContract({ id: 'c1', updatedAt: undefined as unknown as string, monthlyAllowance: 500 });
    const result = await mergeImport(makePayload({ contracts: [incoming] }));
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].table).toBe('contracts');
    expect(result.conflicts[0].id).toBe('c1');
  });

  it('handles mixed adds and skips across multiple records', async () => {
    const existing = makeTxn({ id: 'existing', amount: 50 });
    await db.transactions.put(existing);
    const payload = makePayload({
      transactions: [
        existing, // identical → skip
        makeTxn({ id: 'new-one', amount: 75 }), // new → add
      ],
    });
    const result = await mergeImport(payload);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);
  });
});
