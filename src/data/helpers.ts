import type {
  Contract,
  MonthKey,
  MonthlyPlan,
  MonthlySummary,
  PlanVsActual,
  PlanVsActualItem,
  Transaction,
} from './types';

// ─── Month Key Utilities ─────────────────────────────────────────────────────

/** Returns "YYYY-MM" for the given Date (defaults to today). */
export function toMonthKey(date: Date = new Date()): MonthKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Parse a "YYYY-MM" key into { year, month } (1-based month). */
export function parseMonthKey(key: MonthKey): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number);
  return { year: y, month: m };
}

/** Returns the first ISO-8601 day of the given month key. */
export function monthStart(key: MonthKey): string {
  return `${key}-01`;
}

/** Returns the last ISO-8601 day of the given month key. */
export function monthEnd(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  const lastDay = new Date(year, month, 0).getDate();
  return `${key}-${String(lastDay).padStart(2, '0')}`;
}

/** Returns the previous month key. */
export function prevMonthKey(key: MonthKey): MonthKey {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 2, 1);
  return toMonthKey(d);
}

/** Returns the next month key. */
export function nextMonthKey(key: MonthKey): MonthKey {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month, 1);
  return toMonthKey(d);
}

/** Format a MonthKey for display, e.g. "2024-06" → "2024年6月". */
export function formatMonthLabel(key: MonthKey): string {
  const { year, month } = parseMonthKey(key);
  return `${year}年${month}月`;
}

// ─── Settlement / Summary Calculation ────────────────────────────────────────

/**
 * Compute a MonthlySummary from transactions + optional plan/contract snapshots.
 * This does NOT write to the DB; callers persist as needed.
 */
export function computeSummary(
  month: MonthKey,
  transactions: Transaction[],
  plan: MonthlyPlan | null,
  contract: Contract | null,
): MonthlySummary {
  const monthTxns = transactions.filter((t) => t.month === month);
  const totalIncome = monthTxns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  return {
    id: month,
    month,
    planSnapshot: plan,
    contractSnapshot: contract,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    settledAt: new Date().toISOString(),
  };
}

// ─── Plan vs Actual ──────────────────────────────────────────────────────────

/**
 * Build a plan-vs-actual comparison for the given month.
 * All income and expense transactions are included per business rules.
 */
export function buildPlanVsActual(
  month: MonthKey,
  plan: MonthlyPlan | null,
  transactions: Transaction[],
): PlanVsActual {
  const monthTxns = transactions.filter((t) => t.month === month);
  const totalIncome = monthTxns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = monthTxns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const savingGoal = plan
    ? (plan.contractSnapshot.monthlyAllowance * plan.contractSnapshot.savingRatio)
    : 0;

  // Build actual spending by category
  const actualByCategory = new Map<string, number>();
  for (const t of monthTxns.filter((t) => t.type === 'expense')) {
    actualByCategory.set(t.category, (actualByCategory.get(t.category) ?? 0) + t.amount);
  }

  const items: PlanVsActualItem[] = [];

  if (plan) {
    for (const item of plan.items) {
      const actual = actualByCategory.get(item.categoryId) ?? 0;
      items.push({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        plannedAmount: item.plannedAmount,
        actualAmount: actual,
        diff: actual - item.plannedAmount,
      });
      actualByCategory.delete(item.categoryId);
    }
  }

  // Any remaining categories that weren't in the plan
  for (const [catId, actual] of actualByCategory) {
    items.push({
      categoryId: catId,
      categoryName: catId,
      plannedAmount: 0,
      actualAmount: actual,
      diff: actual,
    });
  }

  return { month, totalIncome, totalExpense, balance: totalIncome - totalExpense, savingGoal, items };
}

// ─── Contract Snapshot ────────────────────────────────────────────────────────

/**
 * Returns the latest contract version whose updatedAt is <= the first day of month.
 * Falls back to the earliest available contract if none precede the month.
 */
export function resolveContractForMonth(
  month: MonthKey,
  contracts: Contract[],
): Contract | null {
  if (contracts.length === 0) return null;
  const cutoff = `${month}-01`;
  const eligible = contracts
    .filter((c) => c.updatedAt <= cutoff)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return eligible[0] ?? contracts.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))[0];
}
