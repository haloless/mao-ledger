import { useRef, useState } from 'react';
import BilingualHeading from '../components/BilingualHeading';
import ThemeSwitcher from '../components/ThemeSwitcher';
import {
  downloadExport,
  exportData,
  ImportValidationError,
  mergeImport,
  overwriteImport,
  validatePayload,
} from '../data/importExport';
import type { ImportResult } from '../data/types';

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const payload = await exportData();
      downloadExport(payload);
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportResult(null);
    setImporting(true);
    try {
      const text = await file.text();
      const raw = JSON.parse(text) as unknown;
      const payload = validatePayload(raw);
      if (importMode === 'overwrite') {
        await overwriteImport(payload);
        setImportResult({ added: 0, skipped: 0, overwritten: -1, conflicts: [] });
      } else {
        const result = await mergeImport(payload);
        setImportResult(result);
      }
    } catch (err) {
      if (err instanceof ImportValidationError) {
        setImportError(`文件验证失败：${err.message}`);
      } else {
        setImportError('导入失败，请检查文件格式。');
      }
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <section className="page-stack">
      <BilingualHeading zh="设置" en="Settings" level={1} />
      <p className="page-description">把主题、数据和 AI 工具整理好，使用会更顺手。</p>
      <div className="content-card settings-grid">
        <section>
          <h2>主题切换 <small style={{ fontWeight: 400, fontSize: '0.8em' }}>Theme</small></h2>
          <p>挑一个你喜欢的界面风格吧。</p>
          <ThemeSwitcher />
        </section>

        <section>
          <h2>数据导入导出 <small style={{ fontWeight: 400, fontSize: '0.8em' }}>Import / Export</small></h2>
          <p style={{ marginBottom: '0.75rem' }}>导出 JSON 备份，或把数据重新导入。</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <button className="btn" onClick={handleExport} disabled={exporting}>
              {exporting ? '导出中…' : '📤 导出备份 Export'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.9em' }}>
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                style={{ marginRight: '4px' }}
              />
              合并导入 Merge
            </label>
            <label style={{ fontSize: '0.9em' }}>
              <input
                type="radio"
                name="importMode"
                value="overwrite"
                checked={importMode === 'overwrite'}
                onChange={() => setImportMode('overwrite')}
                style={{ marginRight: '4px' }}
              />
              覆盖导入 Overwrite
            </label>
          </div>
          <label className="btn" style={{ cursor: 'pointer', display: 'inline-block' }}>
            {importing ? '导入中…' : '📥 选择文件导入 Import'}
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImport}
              disabled={importing}
            />
          </label>
          {importError && (
            <p style={{ color: 'var(--color-danger, red)', marginTop: '0.5rem', fontSize: '0.9em' }}>
              ⚠️ {importError}
            </p>
          )}
          {importResult && importResult.overwritten === -1 && (
            <p style={{ color: 'var(--color-success, green)', marginTop: '0.5rem', fontSize: '0.9em' }}>
              ✅ 覆盖导入完成！Overwrite import done.
            </p>
          )}
          {importResult && importResult.overwritten !== -1 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9em' }}>
              <p style={{ color: 'var(--color-success, green)' }}>
                ✅ 新增 {importResult.added} 条，跳过 {importResult.skipped} 条，更新 {importResult.overwritten} 条
              </p>
              {importResult.conflicts.length > 0 && (
                <p style={{ color: 'var(--color-danger, red)' }}>
                  ⚠️ {importResult.conflicts.length} 条记录缺少时间戳，需手动处理。
                </p>
              )}
            </div>
          )}
        </section>

        <section>
          <h2>AI Key</h2>
          <p>这里会放本地保存、删除和开关 AI 功能的入口（M3 实现）。</p>
        </section>
      </div>
    </section>
  );
}
