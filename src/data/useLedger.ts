import { useEffect, useState } from 'react';
import { db } from './db';
import { buildSeedData } from './seed';
import { buildPlanVsActual, computeSummary, toMonthKey } from './helpers';
import type { MonthlySummary, PlanVsActual, Transaction, MonthlyPlan, Contract } from './types';

// ─── Seed on First Run ────────────────────────────────────────────────────────

let seedPromise: Promise<void> | null = null;

/** Seed demo data the first time the DB is empty. Idempotent. */
export function ensureSeedData(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const count = await db.transactions.count();
    if (count > 0) return;
    const { contracts, monthlyPlans, transactions } = buildSeedData();
    await db.contracts.bulkPut(contracts);
    await db.monthlyPlans.bulkPut(monthlyPlans);
    await db.transactions.bulkPut(transactions);
  })();
  return seedPromise;
}

// ─── Generic hook: live Dexie query with auto-refresh ─────────────────────────

function useLiveQuery<T>(
  query: () => Promise<T>,
  defaultValue: T,
  deps: unknown[] = [],
): T {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    let cancelled = false;
    ensureSeedData().then(() => {
      query().then((v) => {
        if (!cancelled) setValue(v);
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return value;
}

// ─── Dashboard Summary Hook ───────────────────────────────────────────────────

export interface DashboardData {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  loaded: boolean;
}

export function useDashboardData(month: string = toMonthKey()): DashboardData {
  const [data, setData] = useState<DashboardData>({
    month,
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    loaded: false,
  });

  useEffect(() => {
    let cancelled = false;
    ensureSeedData().then(async () => {
      const txns = await db.transactions.where('month').equals(month).toArray();
      const plan = await db.monthlyPlans.get(month);
      const contracts = await db.contracts.toArray();
      const contract = contracts[0] ?? null;
      const summary = computeSummary(month, txns, plan ?? null, contract);
      if (!cancelled) {
        setData({
          month,
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          balance: summary.balance,
          loaded: true,
        });
      }
    });
    return () => { cancelled = true; };
  }, [month]);

  return data;
}

// ─── Monthly Summary Hook ─────────────────────────────────────────────────────

export function useMonthlySummary(month: string = toMonthKey()): MonthlySummary | null {
  return useLiveQuery(
    async () => {
      const txns = await db.transactions.where('month').equals(month).toArray();
      const plan = await db.monthlyPlans.get(month);
      const contracts = await db.contracts.toArray();
      const contract = contracts[0] ?? null;
      return computeSummary(month, txns, plan ?? null, contract);
    },
    null,
    [month],
  );
}

// ─── Plan vs Actual Hook ──────────────────────────────────────────────────────

export function usePlanVsActual(month: string = toMonthKey()): PlanVsActual | null {
  return useLiveQuery(
    async () => {
      const txns = await db.transactions.where('month').equals(month).toArray();
      const plan = await db.monthlyPlans.get(month);
      return buildPlanVsActual(month, plan ?? null, txns);
    },
    null,
    [month],
  );
}

// ─── Transactions Hook ─────────────────────────────────────────────────────────

export function useTransactions(month: string = toMonthKey(), refreshKey = 0): Transaction[] {
  return useLiveQuery(
    () => db.transactions.where('month').equals(month).sortBy('date'),
    [],
    [month, refreshKey],
  );
}

// ─── Plans Hook ───────────────────────────────────────────────────────────────

export function useMonthlyPlan(month: string = toMonthKey(), refreshKey = 0): MonthlyPlan | null {
  return useLiveQuery(
    async () => (await db.monthlyPlans.get(month)) ?? null,
    null,
    [month, refreshKey],
  );
}

// ─── Contracts Hook ───────────────────────────────────────────────────────────

export function useContracts(refreshKey = 0): Contract[] {
  return useLiveQuery(() => db.contracts.toArray(), [], [refreshKey]);
}
