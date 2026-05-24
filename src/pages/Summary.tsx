import { useState } from 'react';
import BilingualHeading from '../components/BilingualHeading';
import MonthSelector from '../components/MonthSelector';
import { formatMonthLabel, toMonthKey } from '../data/helpers';
import { usePlanVsActual, useMonthlySummary } from '../data/useLedger';

const fmt = (n: number) => `¥${n.toFixed(0)}`;

export default function Summary() {
  const [month, setMonth] = useState(toMonthKey);
  const summary = useMonthlySummary(month);
  const pva = usePlanVsActual(month);

  const savingGoal = pva?.savingGoal ?? 0;
  const actualSaving =
    pva?.items.find((i) => i.categoryId === 'saving')?.actualAmount ?? 0;
  const savingPct = savingGoal > 0 ? Math.min(100, Math.round((actualSaving / savingGoal) * 100)) : 0;

  return (
    <section className="page-stack">
      <BilingualHeading zh="汇总分析" en="Summary" level={1} />
      <p className="page-description">
        看看计划和实际差多少，学会温柔地复盘。
        <br />
        <small>Compare your plan with actual spending and reflect.</small>
      </p>

      <MonthSelector month={month} onChange={setMonth} />

      {/* Monthly totals */}
      <div className="content-card">
        <h2>{formatMonthLabel(month)} 收支汇总 <small style={{ fontWeight: 400, fontSize: '0.75em', color: 'var(--color-text-muted)' }}>Monthly Totals</small></h2>
        <div className="stats-grid" style={{ marginTop: '0.75rem' }}>
          <div className="stat-card">
            <span>总收入</span>
            <strong style={{ color: 'var(--color-success, green)' }}>{summary ? fmt(summary.totalIncome) : '…'}</strong>
            <small>Total Income</small>
          </div>
          <div className="stat-card">
            <span>总支出</span>
            <strong style={{ color: 'var(--color-danger, red)' }}>{summary ? fmt(summary.totalExpense) : '…'}</strong>
            <small>Total Expense</small>
          </div>
          <div className="stat-card">
            <span>结余</span>
            <strong
              style={{
                color: summary && summary.balance >= 0
                  ? 'var(--color-success, green)'
                  : 'var(--color-danger, red)',
              }}
            >
              {summary ? fmt(summary.balance) : '…'}
            </strong>
            <small>Balance</small>
          </div>
        </div>
      </div>

      {/* Saving goal progress */}
      {savingGoal > 0 && (
        <div className="content-card">
          <h2 style={{ margin: '0 0 10px' }}>
            储蓄进度{' '}
            <small style={{ fontWeight: 400, fontSize: '0.75em', color: 'var(--color-text-muted)' }}>
              Saving Progress
            </small>
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginBottom: '6px' }}>
            <span>实际储蓄 {fmt(actualSaving)}</span>
            <span>目标 Goal {fmt(savingGoal)}</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${savingPct}%`, background: savingPct >= 100 ? 'var(--color-success, green)' : 'var(--color-primary)' }}
            />
          </div>
          <p style={{ fontSize: '0.85em', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            {savingPct >= 100
              ? '🎉 太棒了！储蓄目标达成！Great job hitting your saving goal!'
              : savingPct >= 50
              ? '👍 已完成一半以上，继续加油！Halfway there, keep it up!'
              : '💪 加油，存钱中！Keep saving!'}
          </p>
        </div>
      )}

      {/* Plan vs Actual */}
      {pva && (
        <div className="content-card">
          <h2 style={{ margin: '0 0 12px' }}>
            计划 vs 实际{' '}
            <small style={{ fontWeight: 400, fontSize: '0.75em', color: 'var(--color-text-muted)' }}>
              Plan vs Actual
            </small>
          </h2>
          {pva.items.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>本月暂无计划数据。No plan data for this month.</p>
          ) : (
            <div className="pva-table">
              <div className="pva-row pva-header">
                <span>分类 Category</span>
                <span>计划 Plan</span>
                <span>实际 Actual</span>
                <span>差额 Diff</span>
              </div>
              {pva.items.map((item) => (
                <div key={item.categoryId} className="pva-row">
                  <span className="pva-cat">{item.categoryName}</span>
                  <span>{fmt(item.plannedAmount)}</span>
                  <span>{fmt(item.actualAmount)}</span>
                  <span
                    style={{
                      color: item.diff <= 0
                        ? 'var(--color-success, green)'
                        : 'var(--color-danger, red)',
                      fontWeight: 600,
                    }}
                  >
                    {item.diff > 0 ? '+' : ''}{fmt(item.diff)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
