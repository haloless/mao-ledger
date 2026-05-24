import { nanoid } from './nanoid';
import { toMonthKey, prevMonthKey } from './helpers';
import type { Contract, MonthlyPlan, Transaction } from './types';

/** Default expense categories — cannot be deleted. */
export const DEFAULT_CATEGORIES = [
  { id: 'self', name: '自己使用', isDefault: true },
  { id: 'gift', name: '送礼', isDefault: true },
  { id: 'saving', name: '储蓄', isDefault: true },
  { id: 'other', name: '其他', isDefault: true },
] as const;

function isoNow(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Generate seed data for demo / first-run. */
export function buildSeedData(): {
  contracts: Contract[];
  monthlyPlans: MonthlyPlan[];
  transactions: Transaction[];
} {
  const thisMonth = toMonthKey();
  const lastMonth = prevMonthKey(thisMonth);
  const [ty, tm] = thisMonth.split('-').map(Number);
  const [ly, lm] = lastMonth.split('-').map(Number);

  // ── Contract ──────────────────────────────────────────────────────────────
  const contract: Contract = {
    id: 'contract-default',
    version: 1,
    createdAt: isoNow(-60),
    updatedAt: isoNow(-60),
    monthlyAllowance: 200,
    savingRatio: 0.2,
    rules: '零食、文具、小礼物都可以自己决定；买超过50元的东西要先和爸爸妈妈商量。',
    threshold: 50,
  };

  // ── Plan items helper ─────────────────────────────────────────────────────
  const makeItems = (allowance: number) => {
    const savingAmt = allowance * contract.savingRatio;
    const remainForSpend = allowance - savingAmt;
    return [
      {
        categoryId: 'self',
        categoryName: '自己使用',
        isDefault: true,
        plannedAmount: Math.round(remainForSpend * 0.5),
        plannedRatio: 0.4,
      },
      {
        categoryId: 'gift',
        categoryName: '送礼',
        isDefault: true,
        plannedAmount: Math.round(remainForSpend * 0.2),
        plannedRatio: 0.16,
      },
      {
        categoryId: 'saving',
        categoryName: '储蓄',
        isDefault: true,
        plannedAmount: savingAmt,
        plannedRatio: 0.2,
      },
      {
        categoryId: 'other',
        categoryName: '其他',
        isDefault: true,
        plannedAmount: Math.round(remainForSpend * 0.3),
        plannedRatio: 0.24,
      },
    ];
  };

  // ── Last month plan ───────────────────────────────────────────────────────
  const lastMonthPlan: MonthlyPlan = {
    id: lastMonth,
    month: lastMonth,
    createdAt: isoNow(-35),
    updatedAt: isoNow(-35),
    contractVersion: contract.version,
    contractSnapshot: contract,
    items: makeItems(contract.monthlyAllowance),
  };

  // ── This month plan ───────────────────────────────────────────────────────
  const thisMonthPlan: MonthlyPlan = {
    id: thisMonth,
    month: thisMonth,
    createdAt: isoNow(-5),
    updatedAt: isoNow(-5),
    contractVersion: contract.version,
    contractSnapshot: contract,
    items: makeItems(contract.monthlyAllowance),
  };

  // ── Transactions ──────────────────────────────────────────────────────────
  const transactions: Transaction[] = [
    // Last month
    {
      id: nanoid(),
      date: isoDate(ly, lm, 1),
      month: lastMonth,
      type: 'income',
      incomeSource: 'fixed',
      category: '固定零花钱',
      amount: 200,
      note: '本月零花钱',
      createdAt: isoNow(-30),
      updatedAt: isoNow(-30),
    },
    {
      id: nanoid(),
      date: isoDate(ly, lm, 8),
      month: lastMonth,
      type: 'expense',
      category: 'self',
      amount: 35,
      note: '买了一本课外书',
      createdAt: isoNow(-22),
      updatedAt: isoNow(-22),
    },
    {
      id: nanoid(),
      date: isoDate(ly, lm, 14),
      month: lastMonth,
      type: 'expense',
      category: 'gift',
      amount: 28,
      note: '给同学的生日礼物',
      createdAt: isoNow(-16),
      updatedAt: isoNow(-16),
    },
    {
      id: nanoid(),
      date: isoDate(ly, lm, 20),
      month: lastMonth,
      type: 'income',
      incomeSource: 'special',
      category: '奖励',
      amount: 50,
      note: '期中考试进步奖励',
      createdAt: isoNow(-10),
      updatedAt: isoNow(-10),
    },
    {
      id: nanoid(),
      date: isoDate(ly, lm, 25),
      month: lastMonth,
      type: 'expense',
      category: 'other',
      amount: 22,
      note: '文具补充',
      createdAt: isoNow(-5),
      updatedAt: isoNow(-5),
    },
    // This month
    {
      id: nanoid(),
      date: isoDate(ty, tm, 1),
      month: thisMonth,
      type: 'income',
      incomeSource: 'fixed',
      category: '固定零花钱',
      amount: 200,
      note: '本月零花钱',
      createdAt: isoNow(-3),
      updatedAt: isoNow(-3),
    },
    {
      id: nanoid(),
      date: isoDate(ty, tm, 3),
      month: thisMonth,
      type: 'expense',
      category: 'self',
      amount: 18,
      note: '买了小零食',
      createdAt: isoNow(-2),
      updatedAt: isoNow(-2),
    },
    {
      id: nanoid(),
      date: isoDate(ty, tm, 5),
      month: thisMonth,
      type: 'expense',
      category: 'saving',
      amount: 40,
      note: '存入储蓄罐',
      createdAt: isoNow(-1),
      updatedAt: isoNow(-1),
    },
  ];

  return {
    contracts: [contract],
    monthlyPlans: [lastMonthPlan, thisMonthPlan],
    transactions,
  };
}
