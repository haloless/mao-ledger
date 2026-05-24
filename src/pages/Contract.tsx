import { useState } from 'react';
import BilingualHeading from '../components/BilingualHeading';
import { saveContractVersion } from '../data/mutations';
import type { Contract } from '../data/types';
import { useContracts } from '../data/useLedger';

const fmt = (n: number) => `¥${n.toFixed(0)}`;

interface FormState {
  monthlyAllowance: string;
  savingRatio: string;
  threshold: string;
  rules: string;
}

function contractToForm(c: Contract): FormState {
  return {
    monthlyAllowance: String(c.monthlyAllowance),
    savingRatio: String(Math.round(c.savingRatio * 100)),
    threshold: String(c.threshold),
    rules: c.rules,
  };
}

const EMPTY_FORM: FormState = { monthlyAllowance: '200', savingRatio: '20', threshold: '50', rules: '' };

export default function Contract() {
  const [refreshKey, setRefreshKey] = useState(0);
  const contracts = useContracts(refreshKey);
  const sorted = [...contracts].sort((a, b) => b.version - a.version);
  const latest = sorted[0] ?? null;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showHistory, setShowHistory] = useState(false);

  function startEdit() {
    setForm(latest ? contractToForm(latest) : EMPTY_FORM);
    setEditing(true);
  }

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveContractVersion({
        monthlyAllowance: Number(form.monthlyAllowance),
        savingRatio: Number(form.savingRatio) / 100,
        threshold: Number(form.threshold),
        rules: form.rules,
      });
      setEditing(false);
      setRefreshKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <BilingualHeading zh="共识契约" en="Contract" level={1} />
      <p className="page-description">
        和家长一起约定零花钱规则，花钱更有底气。
        <br />
        <small>Set your allowance rules together with your parents.</small>
      </p>

      {/* Current contract card */}
      {!editing && (
        <div className="content-card">
          {latest ? (
            <>
              <div className="contract-header">
                <div>
                  <h2 style={{ margin: 0 }}>
                    当前契约{' '}
                    <small style={{ fontWeight: 400, fontSize: '0.75em', color: 'var(--color-text-muted)' }}>
                      Current Contract
                    </small>
                  </h2>
                  <p style={{ fontSize: '0.85em', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                    第 {latest.version} 版 · 更新于{' '}
                    {new Date(latest.updatedAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <button className="btn" onClick={startEdit}>✏️ 修改契约</button>
              </div>

              <div className="contract-fields">
                <div className="contract-field">
                  <span className="field-label">每月零花钱<br /><small>Monthly Allowance</small></span>
                  <strong className="field-value">{fmt(latest.monthlyAllowance)}</strong>
                </div>
                <div className="contract-field">
                  <span className="field-label">推荐储蓄比例<br /><small>Saving Ratio</small></span>
                  <strong className="field-value">{Math.round(latest.savingRatio * 100)}%</strong>
                </div>
                <div className="contract-field">
                  <span className="field-label">需商量消费<br /><small>Discussion Threshold</small></span>
                  <strong className="field-value">{fmt(latest.threshold)}</strong>
                </div>
              </div>

              {latest.rules && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <span className="field-label">消费范围说明 <small>Spending Scope</small></span>
                  <p style={{ margin: '6px 0 0', fontSize: '0.95em', lineHeight: 1.6 }}>{latest.rules}</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>
                还没有契约哦，先和家长一起约定规则吧！<br />
                <small>No contract yet — set one up with your parents!</small>
              </p>
              <button className="btn" onClick={startEdit}>📝 创建第一份契约</button>
            </div>
          )}
        </div>
      )}

      {/* Edit / create form */}
      {editing && (
        <div className="content-card">
          <h2 style={{ margin: '0 0 4px' }}>
            {latest ? '修改契约' : '创建契约'}{' '}
            <small style={{ fontWeight: 400, fontSize: '0.75em', color: 'var(--color-text-muted)' }}>
              {latest ? 'Edit Contract' : 'Create Contract'}
            </small>
          </h2>
          {latest && (
            <p style={{ fontSize: '0.85em', color: 'var(--color-text-muted)', margin: '0 0 16px' }}>
              保存后会新增一个版本，旧版本保留。Saves as a new version.
            </p>
          )}
          <form onSubmit={handleSave} className="contract-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="monthlyAllowance">
                  每月零花钱 Monthly Allowance <span className="form-required">*</span>
                </label>
                <div className="input-affix-wrap">
                  <span className="input-prefix">¥</span>
                  <input
                    id="monthlyAllowance"
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.monthlyAllowance}
                    onChange={handleChange('monthlyAllowance')}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="savingRatio">
                  推荐储蓄比例 Saving Ratio <span className="form-required">*</span>
                </label>
                <div className="input-affix-wrap">
                  <input
                    id="savingRatio"
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={form.savingRatio}
                    onChange={handleChange('savingRatio')}
                    required
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="threshold">
                  需商量金额 Discuss if over
                </label>
                <div className="input-affix-wrap">
                  <span className="input-prefix">¥</span>
                  <input
                    id="threshold"
                    className="input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.threshold}
                    onChange={handleChange('threshold')}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="rules">消费范围说明 Spending Scope</label>
              <textarea
                id="rules"
                className="input textarea"
                rows={3}
                value={form.rules}
                onChange={handleChange('rules')}
                placeholder="例：零食、文具、小礼物可以自己决定；超过50元要先和爸妈商量。"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>
                取消 Cancel
              </button>
              <button type="submit" className="btn" disabled={saving}>
                {saving ? '保存中…' : '💾 保存新版本 Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Version history */}
      {sorted.length > 1 && (
        <div className="content-card">
          <button
            className="btn-text"
            onClick={() => setShowHistory((h) => !h)}
          >
            {showHistory ? '▲' : '▼'} 版本历史 Version History ({sorted.length} 个版本)
          </button>
          {showHistory && (
            <div className="history-list">
              {sorted.map((c) => (
                <div key={c.id} className="history-item">
                  <span className="history-badge">v{c.version}</span>
                  <div className="history-details">
                    <span>
                      {fmt(c.monthlyAllowance)} · 储蓄{Math.round(c.savingRatio * 100)}% · 阈值{fmt(c.threshold)}
                    </span>
                    <small style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(c.updatedAt).toLocaleDateString('zh-CN')}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
