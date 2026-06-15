import { Link } from 'react-router-dom';
import mascotCat from '../../assets/svg/mascot-cat-bank.svg';
import BilingualHeading from '../components/BilingualHeading';
import { formatMonthLabel, toMonthKey } from '../data/helpers';
import { useDashboardData, useContracts, useMonthlyPlan, usePlanVsActual } from '../data/useLedger';

const fmt = (n: number) => `¥${n.toFixed(0)}`;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return '早上好！☀️ Good morning!';
  if (h < 18) return '下午好！🌤 Good afternoon!';
  return '晚上好！🌙 Good evening!';
}

export default function Dashboard() {
  const month = toMonthKey();
  const { totalIncome, totalExpense, balance, loaded } = useDashboardData(month);
  const contracts = useContracts();
  const plan = useMonthlyPlan(month);
  const pva = usePlanVsActual(month);

  const hasContract = contracts.length > 0;
  const hasPlan = plan !== null;

  const savingGoal = pva?.savingGoal ?? 0;
  const actualSaving = pva?.items.find((i) => i.categoryId === 'saving')?.actualAmount ?? 0;
  const savingPct = savingGoal > 0 ? Math.min(100, Math.round((actualSaving / savingGoal) * 100)) : 0;

  return (
    <section className="page-stack">
      <BilingualHeading zh="仪表盘" en="Dashboard" level={1} />

      <div className="hero-card">
        <div>
          <p className="hero-greeting">{getGreeting()}</p>
          <p className="hero-text">
            {formatMonthLabel(month)} — 先计划，再记账，慢慢变成理财小能手！
            <br />
            <small>Plan first, then track — you're doing great! 🌟</small>
          </p>
        </div>
        <img src={mascotCat} alt="招财猫储蓄罐" className="hero-graphic" />
      </div>

      {/* Monthly stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>月收入</span>
          <strong style={{ color: 'var(--color-success, green)' }}>{loaded ? fmt(totalIncome) : '…'}</strong>
          <small>Income</small>
        </div>
        <div className="stat-card">
          <span>月支出</span>
          <strong style={{ color: 'var(--color-danger, red)' }}>{loaded ? fmt(totalExpense) : '…'}</strong>
          <small>Expense</small>
        </div>
        <div className="stat-card">
          <span>结余</span>
          <strong style={{ color: balance >= 0 ? 'var(--color-success, green)' : 'var(--color-danger, red)' }}>
            {loaded ? fmt(balance) : '…'}
          </strong>
          <small>Balance</small>
        </div>
      </div>

      {/* Saving goal progress */}
      {savingGoal > 0 && (
        <div className="content-card">
          <h2 style={{ margin: '0 0 8px', fontSize: '1rem' }}>
            储蓄进度 <small style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.8em' }}>Saving Progress</small>
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88em', marginBottom: '6px' }}>
            <span>{fmt(actualSaving)}</span>
            <span style={{ color: 'var(--color-text-muted)' }}>目标 {fmt(savingGoal)}</span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${savingPct}%`, background: savingPct >= 100 ? 'var(--color-success, green)' : 'var(--color-primary)' }}
            />
          </div>
          <p style={{ fontSize: '0.82em', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {savingPct >= 100 ? '🎉 完成！Goal reached!' : `${savingPct}% 完成 done`}
          </p>
        </div>
      )}

      {/* Quick actions / setup prompts */}
      <div className="content-card">
        <h2 style={{ margin: '0 0 12px' }}>今日任务 <small style={{ fontWeight: 400, fontSize: '0.75em', color: 'var(--color-text-muted)' }}>Quick Actions</small></h2>
        <div className="quick-actions">
          <Link to="/contract" className={`quick-action-btn ${hasContract ? 'done' : 'todo'}`}>
            <span className="qa-icon">{hasContract ? '✅' : '📝'}</span>
            <span className="qa-label">
              {hasContract ? '查看契约' : '创建契约'}
              <small>{hasContract ? 'View Contract' : 'Create Contract'}</small>
            </span>
          </Link>
          <Link to="/plan" className={`quick-action-btn ${hasPlan ? 'done' : 'todo'}`}>
            <span className="qa-icon">{hasPlan ? '✅' : '📋'}</span>
            <span className="qa-label">
              {hasPlan ? '查看计划' : '制定本月计划'}
              <small>{hasPlan ? 'View Plan' : 'Set Monthly Plan'}</small>
            </span>
          </Link>
          <Link to="/transactions" className="quick-action-btn todo">
            <span className="qa-icon">💳</span>
            <span className="qa-label">
              记一笔收支
              <small>Log a Transaction</small>
            </span>
          </Link>
          <Link to="/summary" className="quick-action-btn done">
            <span className="qa-icon">📊</span>
            <span className="qa-label">
              查看汇总
              <small>View Summary</small>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
