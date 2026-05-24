import { db } from './db';
import { nanoid } from './nanoid';
import type { AppSettings, Contract, MonthlyPlan, PlanItem, Transaction } from './types';

// ─── Contract ─────────────────────────────────────────────────────────────────

export interface ContractFormData {
  monthlyAllowance: number;
  savingRatio: number;
  threshold: number;
  rules: string;
}

/** Creates a new contract version. Never mutates existing records. */
export async function saveContractVersion(data: ContractFormData): Promise<Contract> {
  const existing = await db.contracts.toArray();
  const maxVersion = existing.reduce((m, c) => Math.max(m, c.version), 0);
  const now = new Date().toISOString();
  const contract: Contract = {
    id: nanoid(),
    version: maxVersion + 1,
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  await db.contracts.put(contract);
  return contract;
}

// ─── Monthly Plan ─────────────────────────────────────────────────────────────

/** Upsert a monthly plan, recalculating ratios before save. */
export async function saveMonthlyPlan(plan: MonthlyPlan): Promise<void> {
  const total = plan.items.reduce((s, i) => s + i.plannedAmount, 0);
  const updated: MonthlyPlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
    items: plan.items.map((item) => ({
      ...item,
      plannedRatio: total > 0 ? item.plannedAmount / total : 0,
    })),
  };
  await db.monthlyPlans.put(updated);
}

/** Build a fresh default MonthlyPlan for the given month from the latest contract. */
export async function buildDefaultPlan(month: string): Promise<MonthlyPlan | null> {
  const contracts = await db.contracts.toArray();
  if (contracts.length === 0) return null;
  const contract = [...contracts].sort((a, b) => b.version - a.version)[0];

  const savingAmt = Math.round(contract.monthlyAllowance * contract.savingRatio);
  const spendable = contract.monthlyAllowance - savingAmt;

  const items: PlanItem[] = [
    { categoryId: 'self', categoryName: '自己使用', isDefault: true, plannedAmount: Math.round(spendable * 0.5), plannedRatio: 0 },
    { categoryId: 'gift', categoryName: '送礼', isDefault: true, plannedAmount: Math.round(spendable * 0.2), plannedRatio: 0 },
    { categoryId: 'saving', categoryName: '储蓄', isDefault: true, plannedAmount: savingAmt, plannedRatio: 0 },
    { categoryId: 'other', categoryName: '其他', isDefault: true, plannedAmount: Math.round(spendable * 0.3), plannedRatio: 0 },
  ];
  const total = items.reduce((s, i) => s + i.plannedAmount, 0);
  for (const item of items) item.plannedRatio = total > 0 ? item.plannedAmount / total : 0;

  const now = new Date().toISOString();
  return { id: month, month, createdAt: now, updatedAt: now, contractVersion: contract.version, contractSnapshot: contract, items };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface TransactionFormData {
  date: string;
  month: string;
  type: 'income' | 'expense';
  incomeSource?: 'fixed' | 'special';
  category: string;
  amount: number;
  note: string;
}

export async function addTransaction(data: TransactionFormData): Promise<Transaction> {
  const now = new Date().toISOString();
  const txn: Transaction = { id: nanoid(), createdAt: now, updatedAt: now, ...data };
  await db.transactions.put(txn);
  return txn;
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
}

// ─── App Settings ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cute',
  aiProvider: '',
  aiModel: '',
  apiKeyMaskedHint: '',
  lastExportAt: null,
};

export async function loadAppSettings(): Promise<AppSettings> {
  const row = await db.appSettings.get('settings');
  return row ? { ...DEFAULT_SETTINGS, ...row } : { ...DEFAULT_SETTINGS };
}

export async function saveAppSettings(patch: Partial<AppSettings>): Promise<void> {
  const existing = await db.appSettings.get('settings');
  const merged = { ...DEFAULT_SETTINGS, ...existing, ...patch, id: 'settings' as const };
  await db.appSettings.put(merged);
}
