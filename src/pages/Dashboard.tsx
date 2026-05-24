import mascotCat from '../../assets/svg/mascot-cat-bank.svg';
import BilingualHeading from '../components/BilingualHeading';
import { useDashboardData } from '../data/useLedger';
import { formatMonthLabel, toMonthKey } from '../data/helpers';

export default function Dashboard() {
  const month = toMonthKey();
  const { totalIncome, totalExpense, balance, loaded } = useDashboardData(month);

  const fmt = (n: number) => `¥${n.toFixed(0)}`;

  return (
    <section className="page-stack">
      <BilingualHeading zh="仪表盘" en="Dashboard" level={1} />
      <p className="page-description">今天也来看看零花钱，慢慢变成理财小高手。</p>
      <div className="hero-card">
        <div>
          <p className="hero-greeting">你好！👋 / Hello!</p>
          <p className="hero-text">{formatMonthLabel(month)} — 从计划开始，再看看收入、支出和结余吧。</p>
        </div>
        <img src={mascotCat} alt="招财猫储蓄罐" className="hero-graphic" />
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span>月收入</span>
          <strong>{loaded ? fmt(totalIncome) : '…'}</strong>
          <small>Income</small>
        </div>
        <div className="stat-card">
          <span>月支出</span>
          <strong>{loaded ? fmt(totalExpense) : '…'}</strong>
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
      <div className="content-card">
        <h2>开始今天的小任务</h2>
        <p>先和家长约好规则，再做好本月计划，记账会更轻松。</p>
      </div>
    </section>
  );
}
