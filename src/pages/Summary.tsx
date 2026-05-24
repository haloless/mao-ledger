import BilingualHeading from '../components/BilingualHeading';
import { usePlanVsActual, useMonthlySummary } from '../data/useLedger';
import { formatMonthLabel, toMonthKey } from '../data/helpers';

export default function Summary() {
  const month = toMonthKey();
  const summary = useMonthlySummary(month);
  const pva = usePlanVsActual(month);

  const fmt = (n: number) => `¥${n.toFixed(0)}`;

  return (
    <section className="page-stack">
      <BilingualHeading zh="汇总分析" en="Summary" level={1} />
      <p className="page-description">看看计划和实际差多少，学会温柔地复盘。</p>

      {/* Monthly totals */}
      <div className="content-card">
        <h2>{formatMonthLabel(month)} 收支汇总</h2>
        <div className="stats-grid" style={{ marginTop: '0.75rem' }}>
          <div className="stat-card">
            <span>总收入</span>
            <strong>{summary ? fmt(summary.totalIncome) : '…'}</strong>
            <small>Total Income</small>
          </div>
          <div className="stat-card">
            <span>总支出</span>
            <strong>{summary ? fmt(summary.totalExpense) : '…'}</strong>
            <small>Total Expense</small>
          </div>
          <div className="stat-card">
            <span>结余</span>
            <strong
              style={{
                color:
                  summary && summary.balance >= 0
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

      {/* Plan vs Actual */}
      {pva && (
        <div className="content-card">
          <h2>计划 vs 实际 <small style={{ fontWeight: 400, fontSize: '0.8em' }}>Plan vs Actual</small></h2>
          {pva.savingGoal > 0 && (
            <p style={{ marginBottom: '0.5rem', fontSize: '0.9em' }}>
              储蓄目标 {fmt(pva.savingGoal)}（Saving Goal）
            </p>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border, #ccc)', textAlign: 'left' }}>
                <th style={{ padding: '4px 8px' }}>分类 Category</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>计划 Plan</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>实际 Actual</th>
                <th style={{ padding: '4px 8px', textAlign: 'right' }}>差额 Diff</th>
              </tr>
            </thead>
            <tbody>
              {pva.items.map((item) => (
                <tr key={item.categoryId} style={{ borderBottom: '1px solid var(--color-border, #eee)' }}>
                  <td style={{ padding: '4px 8px' }}>{item.categoryName}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmt(item.plannedAmount)}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmt(item.actualAmount)}</td>
                  <td
                    style={{
                      padding: '4px 8px',
                      textAlign: 'right',
                      color: item.diff <= 0 ? 'var(--color-success, green)' : 'var(--color-danger, red)',
                    }}
                  >
                    {item.diff > 0 ? '+' : ''}{fmt(item.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
