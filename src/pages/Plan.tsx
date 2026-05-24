import { useEffect, useState } from 'react';
import BilingualHeading from '../components/BilingualHeading';
import MonthSelector from '../components/MonthSelector';
import { buildDefaultPlan, saveMonthlyPlan } from '../data/mutations';
import { toMonthKey } from '../data/helpers';
import type { MonthlyPlan, PlanItem } from '../data/types';
import { useMonthlyPlan } from '../data/useLedger';

const fmt = (n: number) => `¥${n.toFixed(0)}`;

export default function Plan() {
  const [month, setMonth] = useState(toMonthKey);
  const [refreshKey, setRefreshKey] = useState(0);
  const dbPlan = useMonthlyPlan(month, refreshKey);

  // Local editable copy of plan items
  const [items, setItems] = useState<PlanItem[]>([]);
  const [contractVersion, setContractVersion] = useState(1);
  const [contractSnapshot, setContractSnapshot] = useState<MonthlyPlan['contractSnapshot'] | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Sync local state when DB plan changes
  useEffect(() => {
    if (dbPlan) {
      setItems(dbPlan.items.map((i) => ({ ...i })));
      setContractVersion(dbPlan.contractVersion);
      setContractSnapshot(dbPlan.contractSnapshot);
      setPlanCreatedAt(dbPlan.createdAt);
      setDirty(false);
    }
  }, [dbPlan]);

  async function handleCreateDefault() {
    setCreating(true);
    try {
      const plan = await buildDefaultPlan(month);
      if (!plan) {
        alert('请先创建契约，才能生成默认计划。\nPlease create a contract first.');
        return;
      }
      await saveMonthlyPlan(plan);
      setRefreshKey((k) => k + 1);
    } finally {
      setCreating(false);
    }
  }

  function updateAmount(idx: number, value: string) {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], plannedAmount: Number(value) || 0 };
      return next;
    });
    setDirty(true);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  }

  function addCustomCategory() {
    const name = newCatName.trim();
    if (!name) return;
    const catId = `custom-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      { categoryId: catId, categoryName: name, isDefault: false, plannedAmount: 0, plannedRatio: 0 },
    ]);
    setNewCatName('');
    setAddingCat(false);
    setDirty(true);
  }

  async function handleSave() {
    if (!contractSnapshot) return;
    setSaving(true);
    try {
      const plan: MonthlyPlan = {
        id: month,
        month,
        createdAt: planCreatedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contractVersion,
        contractSnapshot,
        items,
      };
      await saveMonthlyPlan(plan);
      setRefreshKey((k) => k + 1);
      setDirty(false);
      setSaveMsg('已保存！Saved!');
      setTimeout(() => setSaveMsg(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  const totalPlanned = items.reduce((s, i) => s + i.plannedAmount, 0);
  const allowance = contractSnapshot?.monthlyAllowance ?? 0;
  const overBudget = allowance > 0 && totalPlanned > allowance;

  return (
    <section className="page-stack">
      <BilingualHeading zh="月度计划" en="Monthly Plan" level={1} />
      <p className="page-description">
        把这个月的钱先分好，花钱更安心。
        <br />
        <small>Plan how to use your allowance before spending.</small>
      </p>

      <MonthSelector month={month} onChange={(m) => { setMonth(m); setDirty(false); }} />

      {dbPlan === null ? (
        <div className="content-card empty-state">
          <p>
            {month} 还没有计划哦！<br />
            <small>No plan for this month yet.</small>
          </p>
          <button className="btn" onClick={handleCreateDefault} disabled={creating}>
            {creating ? '生成中…' : '✨ 按契约生成默认计划 Create Default Plan'}
          </button>
        </div>
      ) : (
        <>
          <div className="content-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0 }}>
                支出计划{' '}
                <small style={{ fontWeight: 400, fontSize: '0.75em', color: 'var(--color-text-muted)' }}>
                  Spending Plan
                </small>
              </h2>
              {allowance > 0 && (
                <span style={{ fontSize: '0.9em', color: overBudget ? 'var(--color-danger, red)' : 'var(--color-text-muted)' }}>
                  {overBudget ? '⚠️ 超出' : '已分配'} {fmt(totalPlanned)} / {fmt(allowance)}
                </span>
              )}
            </div>

            <div className="plan-items">
              {items.map((item, idx) => (
                <div key={item.categoryId} className="plan-item">
                  <span className="plan-item-name">
                    {item.isDefault && <span className="plan-default-badge">默认</span>}
                    {item.categoryName}
                  </span>
                  <div className="input-affix-wrap plan-item-amount-wrap">
                    <span className="input-prefix">¥</span>
                    <input
                      className="input plan-item-input"
                      type="number"
                      min="0"
                      step="1"
                      value={item.plannedAmount}
                      onChange={(e) => updateAmount(idx, e.target.value)}
                      aria-label={`${item.categoryName} 计划金额`}
                    />
                  </div>
                  {allowance > 0 && totalPlanned > 0 && (
                    <span className="plan-item-pct">
                      {Math.round((item.plannedAmount / allowance) * 100)}%
                    </span>
                  )}
                  {!item.isDefault && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => removeItem(idx)}
                      aria-label={`删除 ${item.categoryName}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add custom category */}
            {addingCat ? (
              <div className="add-cat-form">
                <input
                  className="input"
                  type="text"
                  placeholder="新分类名称 Category name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } }}
                  autoFocus
                />
                <button className="btn btn-sm" onClick={addCustomCategory} disabled={!newCatName.trim()}>
                  确认 Add
                </button>
                <button className="btn btn-sm btn-outline" onClick={() => { setAddingCat(false); setNewCatName(''); }}>
                  取消
                </button>
              </div>
            ) : (
              <button className="btn btn-outline btn-sm" style={{ marginTop: '12px' }} onClick={() => setAddingCat(true)}>
                ＋ 添加自定义分类 Add Category
              </button>
            )}
          </div>

          {/* Save bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button className="btn" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? '保存中…' : '💾 保存计划 Save Plan'}
            </button>
            {saveMsg && <span style={{ color: 'var(--color-success, green)', fontWeight: 600 }}>{saveMsg}</span>}
            {!dirty && !saveMsg && dbPlan && (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9em' }}>
                最后更新 {new Date(dbPlan.updatedAt).toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}
