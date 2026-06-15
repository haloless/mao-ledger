import { describe, it, expect } from 'vitest';
import {
  toMonthKey,
  parseMonthKey,
  monthStart,
  monthEnd,
  prevMonthKey,
  nextMonthKey,
  formatMonthLabel,
  computeSummary,
  buildPlanVsActual,
  resolveContractForMonth,
} from '../helpers';
import type { Contract, MonthlyPlan, Transaction } from '../types';

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

function makePlan(month: string, contract: Contract, overrides: Partial<MonthlyPlan> = {}): MonthlyPlan {
  return {
    id: month,
    month,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    contractVersion: contract.version,
    contractSnapshot: contract,
    items: [
      { categoryId: 'food', categoryName: '餐饮', isDefault: true, plannedAmount: 200, plannedRatio: 0.5 },
      { categoryId: 'books', categoryName: '书籍', isDefault: false, plannedAmount: 200, plannedRatio: 0.5 },
    ],
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

// ─── Month Key Utilities ───────────────────────────────────────────────────────

describe('toMonthKey', () => {
  it('formats a known date correctly', () => {
    expect(toMonthKey(new Date('2024-06-15'))).toBe('2024-06');
  });

  it('zero-pads single-digit months', () => {
    expect(toMonthKey(new Date('2024-03-01'))).toBe('2024-03');
  });
});

describe('parseMonthKey', () => {
  it('parses year and 1-based month', () => {
    expect(parseMonthKey('2024-06')).toEqual({ year: 2024, month: 6 });
  });

  it('parses January correctly', () => {
    expect(parseMonthKey('2025-01')).toEqual({ year: 2025, month: 1 });
  });
});

describe('monthStart', () => {
  it('returns first day of month', () => {
    expect(monthStart('2024-06')).toBe('2024-06-01');
  });
});

describe('monthEnd', () => {
  it('returns last day of June', () => {
    expect(monthEnd('2024-06')).toBe('2024-06-30');
  });

  it('returns last day of February in a leap year', () => {
    expect(monthEnd('2024-02')).toBe('2024-02-29');
  });

  it('returns last day of February in a non-leap year', () => {
    expect(monthEnd('2023-02')).toBe('2023-02-28');
  });

  it('returns last day of December', () => {
    expect(monthEnd('2024-12')).toBe('2024-12-31');
  });
});

describe('prevMonthKey', () => {
  it('returns previous month', () => {
    expect(prevMonthKey('2024-06')).toBe('2024-05');
  });

  it('wraps around to December of previous year', () => {
    expect(prevMonthKey('2024-01')).toBe('2023-12');
  });
});

describe('nextMonthKey', () => {
  it('returns next month', () => {
    expect(nextMonthKey('2024-06')).toBe('2024-07');
  });

  it('wraps around to January of next year', () => {
    expect(nextMonthKey('2024-12')).toBe('2025-01');
  });
});

describe('formatMonthLabel', () => {
  it('formats with Chinese year/month notation', () => {
    expect(formatMonthLabel('2024-06')).toBe('2024年6月');
  });

  it('does not zero-pad the month in the label', () => {
    expect(formatMonthLabel('2024-03')).toBe('2024年3月');
  });
});

// ─── computeSummary ────────────────────────────────────────────────────────────

describe('computeSummary', () => {
  const contract = makeContract();
  const plan = makePlan('2024-06', contract);

  it('sums income and expense correctly', () => {
    const txns: Transaction[] = [
      makeTxn({ id: 't1', type: 'income', amount: 500, category: 'allowance' }),
      makeTxn({ id: 't2', type: 'expense', amount: 100, category: 'food' }),
      makeTxn({ id: 't3', type: 'expense', amount: 50, category: 'books' }),
    ];
    const result = computeSummary('2024-06', txns, plan, contract);
    expect(result.totalIncome).toBe(500);
    expect(result.totalExpense).toBe(150);
    expect(result.balance).toBe(350);
    expect(result.month).toBe('2024-06');
    expect(result.planSnapshot).toBe(plan);
    expect(result.contractSnapshot).toBe(contract);
  });

  it('ignores transactions from other months', () => {
    const txns: Transaction[] = [
      makeTxn({ id: 't1', type: 'income', amount: 500, month: '2024-06' }),
      makeTxn({ id: 't2', type: 'income', amount: 200, month: '2024-05' }),
    ];
    const result = computeSummary('2024-06', txns, null, null);
    expect(result.totalIncome).toBe(500);
  });

  it('handles zero transactions', () => {
    const result = computeSummary('2024-06', [], null, null);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.balance).toBe(0);
  });
});

// ─── buildPlanVsActual ─────────────────────────────────────────────────────────

describe('buildPlanVsActual', () => {
  const contract = makeContract({ monthlyAllowance: 500, savingRatio: 0.2 });
  const plan = makePlan('2024-06', contract);

  it('computes diff correctly for a planned category', () => {
    const txns: Transaction[] = [
      makeTxn({ id: 't1', type: 'expense', amount: 180, category: 'food' }), // planned 200
    ];
    const result = buildPlanVsActual('2024-06', plan, txns);
    const foodItem = result.items.find((i) => i.categoryId === 'food')!;
    expect(foodItem.plannedAmount).toBe(200);
    expect(foodItem.actualAmount).toBe(180);
    expect(foodItem.diff).toBe(-20); // under budget: negative diff
  });

  it('adds unplanned categories with diff equal to actual', () => {
    const txns: Transaction[] = [
      makeTxn({ id: 't1', type: 'expense', amount: 30, category: 'toys' }),
    ];
    const result = buildPlanVsActual('2024-06', plan, txns);
    const toysItem = result.items.find((i) => i.categoryId === 'toys')!;
    expect(toysItem).toBeDefined();
    expect(toysItem.plannedAmount).toBe(0);
    expect(toysItem.diff).toBe(30);
  });

  it('calculates savingGoal from contract snapshot', () => {
    const result = buildPlanVsActual('2024-06', plan, []);
    // 500 * 0.2 = 100
    expect(result.savingGoal).toBe(100);
  });

  it('savingGoal is 0 when no plan', () => {
    const result = buildPlanVsActual('2024-06', null, []);
    expect(result.savingGoal).toBe(0);
  });

  it('computes totals correctly', () => {
    const txns: Transaction[] = [
      makeTxn({ id: 't1', type: 'income', amount: 500 }),
      makeTxn({ id: 't2', type: 'expense', amount: 150, category: 'food' }),
    ];
    const result = buildPlanVsActual('2024-06', plan, txns);
    expect(result.totalIncome).toBe(500);
    expect(result.totalExpense).toBe(150);
    expect(result.balance).toBe(350);
  });

  it('ignores transactions from other months', () => {
    const txns: Transaction[] = [
      makeTxn({ id: 't1', type: 'expense', amount: 200, month: '2024-05', category: 'food' }),
    ];
    const result = buildPlanVsActual('2024-06', plan, txns);
    const foodItem = result.items.find((i) => i.categoryId === 'food')!;
    expect(foodItem.actualAmount).toBe(0);
  });
});

// ─── resolveContractForMonth ───────────────────────────────────────────────────

describe('resolveContractForMonth', () => {
  it('returns null for empty contracts list', () => {
    expect(resolveContractForMonth('2024-06', [])).toBeNull();
  });

  it('returns the contract whose updatedAt <= month start', () => {
    const c1 = makeContract({ id: 'c1', updatedAt: '2024-05-15T00:00:00.000Z' });
    const c2 = makeContract({ id: 'c2', updatedAt: '2024-07-01T00:00:00.000Z' }); // future
    const result = resolveContractForMonth('2024-06', [c1, c2]);
    expect(result?.id).toBe('c1');
  });

  it('picks the most recent eligible contract', () => {
    const c1 = makeContract({ id: 'c1', updatedAt: '2024-04-01T00:00:00.000Z' });
    const c2 = makeContract({ id: 'c2', updatedAt: '2024-05-20T00:00:00.000Z' });
    const result = resolveContractForMonth('2024-06', [c1, c2]);
    expect(result?.id).toBe('c2');
  });

  it('falls back to earliest contract if none precede the month', () => {
    const c1 = makeContract({ id: 'c1', updatedAt: '2024-08-01T00:00:00.000Z' });
    const c2 = makeContract({ id: 'c2', updatedAt: '2024-07-01T00:00:00.000Z' });
    const result = resolveContractForMonth('2024-06', [c1, c2]);
    // Both are future; fallback to earliest
    expect(result?.id).toBe('c2');
  });

  it('includes a contract updated exactly on month start day', () => {
    // updatedAt of '2024-06-01' should be <= '2024-06-01'
    const c = makeContract({ id: 'c1', updatedAt: '2024-06-01' });
    const result = resolveContractForMonth('2024-06', [c]);
    expect(result?.id).toBe('c1');
  });
});
