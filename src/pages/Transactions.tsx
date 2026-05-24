import { useState } from 'react';
import emptyRecords from '../../assets/svg/empty-records.svg';
import BilingualHeading from '../components/BilingualHeading';
import Modal from '../components/Modal';
import MonthSelector from '../components/MonthSelector';
import { addTransaction, deleteTransaction } from '../data/mutations';
import { toMonthKey } from '../data/helpers';
import type { MonthlyPlan } from '../data/types';
import { useMonthlyPlan, useTransactions } from '../data/useLedger';

const fmt = (n: number) => `¥${n.toFixed(2)}`;
const today = () => new Date().toISOString().slice(0, 10);

// Presets for special income categories
const SPECIAL_INCOME_PRESETS = ['奖励', '压岁钱', '任务收入', '其他收入'];

function getCategoryOptions(plan: MonthlyPlan | null): { id: string; name: string }[] {
  if (plan && plan.items.length > 0) {
    return plan.items.map((i) => ({ id: i.categoryId, name: i.categoryName }));
  }
  return [
    { id: 'self', name: '自己使用' },
    { id: 'gift', name: '送礼' },
    { id: 'saving', name: '储蓄' },
    { id: 'other', name: '其他' },
  ];
}

interface FormState {
  type: 'income' | 'expense';
  incomeSource: 'fixed' | 'special';
  date: string;
  amount: string;
  category: string;
  note: string;
}

const emptyForm = (): FormState => ({
  type: 'expense',
  incomeSource: 'fixed',
  date: today(),
  amount: '',
  category: '',
  note: '',
});

export default function Transactions() {
  const [month, setMonth] = useState(toMonthKey);
  const [refreshKey, setRefreshKey] = useState(0);
  const transactions = useTransactions(month, refreshKey);
  const plan = useMonthlyPlan(month);
  const categoryOptions = getCategoryOptions(plan);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openForm() {
    setForm(emptyForm());
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;

    setSubmitting(true);
    try {
      const category =
        form.type === 'income'
          ? form.incomeSource === 'fixed'
            ? '固定零花钱'
            : form.category || '其他收入'
          : form.category;

      await addTransaction({
        date: form.date,
        month,
        type: form.type,
        incomeSource: form.type === 'income' ? form.incomeSource : undefined,
        category,
        amount,
        note: form.note,
      });
      setRefreshKey((k) => k + 1);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!window.confirm(`确认删除"${label}"？\nDelete this record?`)) return;
    await deleteTransaction(id);
    setRefreshKey((k) => k + 1);
  }

  const filtered = transactions.filter((t) => filter === 'all' || t.type === filter);
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <section className="page-stack">
      <BilingualHeading zh="收支记录" en="Transactions" level={1} />
      <p className="page-description">
        每次收支都记一下，进步看得更清楚。
        <br />
        <small>Track every income and expense to see your progress.</small>
      </p>

      <MonthSelector month={month} onChange={(m) => { setMonth(m); setFilter('all'); }} />

      {/* Summary row */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>本月收入</span>
          <strong style={{ color: 'var(--color-success, green)' }}>+{fmt(totalIncome)}</strong>
          <small>Income</small>
        </div>
        <div className="stat-card">
          <span>本月支出</span>
          <strong style={{ color: 'var(--color-danger, red)' }}>-{fmt(totalExpense)}</strong>
          <small>Expense</small>
        </div>
        <div className="stat-card">
          <span>结余</span>
          <strong style={{ color: totalIncome - totalExpense >= 0 ? 'var(--color-success, green)' : 'var(--color-danger, red)' }}>
            {fmt(totalIncome - totalExpense)}
          </strong>
          <small>Balance</small>
        </div>
      </div>

      {/* Filters + add button */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? '' : 'btn-outline'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部 All' : f === 'income' ? '收入 Income' : '支出 Expense'}
          </button>
        ))}
        <button className="btn" style={{ marginLeft: 'auto' }} onClick={openForm}>
          ＋ 添加记录 Add
        </button>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <div className="content-card placeholder-illustration-card">
          <img src={emptyRecords} alt="暂无记录" className="placeholder-graphic" />
          <div>
            <h2>暂无记录 No records yet</h2>
            <p>点击右上角"添加记录"来记第一笔吧！<br /><small>Tap "Add" to log your first entry!</small></p>
          </div>
        </div>
      ) : (
        <div className="content-card" style={{ padding: 0 }}>
          <ul className="txn-list">
            {filtered.map((txn) => (
              <li key={txn.id} className="txn-item">
                <span className={`txn-type-dot ${txn.type}`} />
                <div className="txn-info">
                  <span className="txn-category">{txn.category}</span>
                  {txn.note && <span className="txn-note">{txn.note}</span>}
                  <span className="txn-date">{txn.date}</span>
                </div>
                <span className={`txn-amount ${txn.type}`}>
                  {txn.type === 'income' ? '+' : '-'}{fmt(txn.amount)}
                </span>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(txn.id, txn.category)}
                  aria-label="删除"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add transaction modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="添加记录 Add Record"
        footer={
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
              取消 Cancel
            </button>
            <button form="txn-form" type="submit" className="btn" disabled={submitting}>
              {submitting ? '保存中…' : '💾 保存 Save'}
            </button>
          </div>
        }
      >
        <form id="txn-form" onSubmit={handleSubmit} className="contract-form">
          {/* Type toggle */}
          <div className="form-group">
            <span className="form-label">类型 Type</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn-sm ${form.type === t ? '' : 'btn-outline'}`}
                  onClick={() => setField('type', t)}
                >
                  {t === 'income' ? '💰 收入 Income' : '🛒 支出 Expense'}
                </button>
              ))}
            </div>
          </div>

          {/* Income source (only for income) */}
          {form.type === 'income' && (
            <div className="form-group">
              <span className="form-label">收入来源 Income Source</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['fixed', 'special'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`btn btn-sm ${form.incomeSource === s ? '' : 'btn-outline'}`}
                    onClick={() => setField('incomeSource', s)}
                  >
                    {s === 'fixed' ? '📅 固定零花钱 Fixed' : '🎁 特殊收入 Special'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special income category */}
          {form.type === 'income' && form.incomeSource === 'special' && (
            <div className="form-group">
              <label className="form-label" htmlFor="txn-cat-special">收入分类 Category</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                {SPECIAL_INCOME_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${form.category === p ? '' : 'btn-outline'}`}
                    onClick={() => setField('category', p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input
                id="txn-cat-special"
                className="input"
                type="text"
                placeholder="或自定义分类 or custom…"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              />
            </div>
          )}

          {/* Expense category */}
          {form.type === 'expense' && (
            <div className="form-group">
              <label className="form-label" htmlFor="txn-cat">支出分类 Category <span className="form-required">*</span></label>
              <select
                id="txn-cat"
                className="input select"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
                required
              >
                <option value="">— 选择分类 Select —</option>
                {categoryOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="txn-date">日期 Date <span className="form-required">*</span></label>
              <input
                id="txn-date"
                className="input"
                type="date"
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="txn-amount">金额 Amount <span className="form-required">*</span></label>
              <div className="input-affix-wrap">
                <span className="input-prefix">¥</span>
                <input
                  id="txn-amount"
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setField('amount', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="txn-note">备注 Note</label>
            <input
              id="txn-note"
              className="input"
              type="text"
              placeholder="比如：买了一本课外书 e.g. bought a book"
              value={form.note}
              onChange={(e) => setField('note', e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </section>
  );
}
