import { NavLink, Outlet } from 'react-router-dom';
import brandMark from '../../assets/svg/brand-mark.svg';
import emptyRecords from '../../assets/svg/empty-records.svg';
import iconAiHelper from '../../assets/svg/icon-ai-helper.svg';
import iconCashflow from '../../assets/svg/icon-cashflow.svg';
import iconContract from '../../assets/svg/icon-contract.svg';
import iconPlan from '../../assets/svg/icon-plan.svg';
import iconSummary from '../../assets/svg/icon-summary.svg';
import ThemeSwitcher from './ThemeSwitcher';

type NavItem = {
  to: string;
  zh: string;
  en: string;
  icon: string;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: '/', zh: '仪表盘', en: 'Dashboard', icon: brandMark, end: true },
  { to: '/contract', zh: '共识契约', en: 'Contract', icon: iconContract },
  { to: '/plan', zh: '月度计划', en: 'Monthly Plan', icon: iconPlan },
  { to: '/transactions', zh: '收支记录', en: 'Transactions', icon: iconCashflow },
  { to: '/summary', zh: '汇总分析', en: 'Summary', icon: iconSummary },
  { to: '/ai-helper', zh: 'AI助手', en: 'AI Helper', icon: iconAiHelper },
  { to: '/settings', zh: '设置', en: 'Settings', icon: emptyRecords },
] as const;

export default function AppShell() {
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <img src={brandMark} alt="Mao Ledger" className="brand-logo" />
          <div>
            <strong>猫咪记账</strong>
            <small>Mao Ledger</small>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <img src={item.icon} alt="" aria-hidden="true" className="nav-icon" />
              <span className="nav-copy">
                <span>{item.zh}</span>
                <small>{item.en}</small>
              </span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="sidebar-footer-label">主题切换 / Theme</p>
          <ThemeSwitcher />
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        <div className="bottom-nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <img src={item.icon} alt="" aria-hidden="true" className="nav-icon" />
              <span className="nav-copy">
                <span>{item.zh}</span>
                <small>{item.en}</small>
              </span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
