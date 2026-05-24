// ─── Domain Types ───────────────────────────────────────────────────────────

/** "YYYY-MM" string, e.g. "2024-06" */
export type MonthKey = string;

export interface Contract {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  /** Fixed monthly allowance amount (CNY) */
  monthlyAllowance: number;
  /** Recommended saving ratio, 0–1, e.g. 0.2 for 20% */
  savingRatio: number;
  /** Free-text notes about spending scope */
  rules: string;
  /** Amount above which child should discuss with parent */
  threshold: number;
}

export interface PlanItem {
  categoryId: string;
  categoryName: string;
  /** Default categories cannot be deleted */
  isDefault: boolean;
  plannedAmount: number;
  /** 0–1, derived from plannedAmount / totalPlanned, stored for display */
  plannedRatio: number;
}

export interface MonthlyPlan {
  /** Same as month, e.g. "2024-06" */
  id: string;
  month: MonthKey;
  createdAt: string;
  updatedAt: string;
  contractVersion: number;
  /** Snapshot of contract at time of plan creation */
  contractSnapshot: Contract;
  items: PlanItem[];
}

export type IncomeSource = 'fixed' | 'special';
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  /** ISO date string, e.g. "2024-06-05" */
  date: string;
  month: MonthKey;
  type: TransactionType;
  /** Only present when type === 'income' */
  incomeSource?: IncomeSource;
  category: string;
  amount: number;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  /** Same as month, e.g. "2024-06" */
  id: string;
  month: MonthKey;
  planSnapshot: MonthlyPlan | null;
  contractSnapshot: Contract | null;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  settledAt: string;
}

export interface AppSettings {
  theme: string;
  aiProvider: string;
  aiModel: string;
  /** Masked hint shown in UI, never the real key */
  apiKeyMaskedHint: string;
  lastExportAt: string | null;
}

// ─── Plan vs Actual ──────────────────────────────────────────────────────────

export interface PlanVsActualItem {
  categoryId: string;
  categoryName: string;
  plannedAmount: number;
  actualAmount: number;
  diff: number; // actual - planned; negative = under budget
}

export interface PlanVsActual {
  month: MonthKey;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingGoal: number;
  items: PlanVsActualItem[];
}

// ─── Import / Export ─────────────────────────────────────────────────────────

export const EXPORT_VERSION = 1;

export interface ExportPayload {
  version: number;
  exportedAt: string;
  contracts: Contract[];
  monthlyPlans: MonthlyPlan[];
  transactions: Transaction[];
  monthlySummaries: MonthlySummary[];
  appSettings: AppSettings | null;
}

/** Result of a merge operation with optional conflicts for user resolution */
export interface MergeConflict {
  table: string;
  id: string;
  local: unknown;
  incoming: unknown;
}

export interface ImportResult {
  added: number;
  skipped: number;
  overwritten: number;
  conflicts: MergeConflict[];
}
