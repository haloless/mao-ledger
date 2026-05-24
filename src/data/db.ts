import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  Contract,
  MonthlyPlan,
  MonthlySummary,
  Transaction,
} from './types';

/** Single-row settings record stored with a fixed id */
type SettingsRow = AppSettings & { id: 'settings' };

class LedgerDB extends Dexie {
  contracts!: Table<Contract, string>;
  monthlyPlans!: Table<MonthlyPlan, string>;
  transactions!: Table<Transaction, string>;
  monthlySummaries!: Table<MonthlySummary, string>;
  appSettings!: Table<SettingsRow, string>;

  constructor() {
    super('mao-ledger');
    this.version(1).stores({
      contracts: 'id, updatedAt',
      monthlyPlans: 'id, month, updatedAt',
      transactions: 'id, month, date, type, updatedAt',
      monthlySummaries: 'id, month',
      appSettings: 'id',
    });
  }
}

export const db = new LedgerDB();
export type { SettingsRow };
