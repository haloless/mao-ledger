import type { MonthlyTrendPoint } from '../data/useLedger';
import { parseMonthKey } from '../data/helpers';

interface Props {
  data: MonthlyTrendPoint[];
  height?: number;
}

const INCOME_COLOR = 'var(--color-success, #38a169)';
const EXPENSE_COLOR = 'var(--color-danger, #e53e3e)';
const BALANCE_COLOR = 'var(--color-primary)';
const MUTED_COLOR = 'var(--color-text-muted, #888)';

const PAD_LEFT = 48;
const PAD_RIGHT = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 36;

function shortMonth(month: string): string {
  const { year, month: m } = parseMonthKey(month);
  const y = String(year).slice(2);
  return `${y}/${String(m).padStart(2, '0')}`;
}

function formatVal(n: number): string {
  if (Math.abs(n) >= 1000) return `¥${(n / 1000).toFixed(1)}k`;
  return `¥${n.toFixed(0)}`;
}

export default function MonthlyBarChart({ data, height = 200 }: Props) {
  if (!data || data.length === 0) {
    return (
      <p style={{ color: MUTED_COLOR, textAlign: 'center', padding: '20px 0' }}>
        暂无数据 No data yet
      </p>
    );
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense, 1]));
  const chartW = 100; // percentage-based, scaled via viewBox
  const totalW = 600;
  const innerW = totalW - PAD_LEFT - PAD_RIGHT;
  const innerH = height - PAD_TOP - PAD_BOTTOM;
  const slotW = innerW / data.length;
  const barW = Math.min(slotW * 0.32, 28);
  const yScale = (v: number) => (v / maxVal) * innerH;

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PAD_TOP + innerH - t * innerH,
    label: formatVal(t * maxVal),
  }));

  return (
    <svg
      viewBox={`0 0 ${totalW} ${height}`}
      style={{ width: '100%', display: 'block', overflow: 'visible' }}
      aria-label="逐月收支柱状图"
      role="img"
    >
      {/* Y-axis gridlines + labels */}
      {ticks.map((tick) => (
        <g key={tick.y}>
          <line
            x1={PAD_LEFT}
            y1={tick.y}
            x2={totalW - PAD_RIGHT}
            y2={tick.y}
            stroke="var(--color-border, #e2e8f0)"
            strokeDasharray="4 4"
          />
          <text
            x={PAD_LEFT - 6}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={22}
            fill="var(--color-text-muted, #888)"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {/* Bars + labels for each month */}
      {data.map((d, i) => {
        const cx = PAD_LEFT + i * slotW + slotW / 2;
        const incomeH = Math.max(yScale(d.income), d.income > 0 ? 2 : 0);
        const expenseH = Math.max(yScale(d.expense), d.expense > 0 ? 2 : 0);
        const baseY = PAD_TOP + innerH;

        return (
          <g key={d.month}>
            {/* Income bar */}
            <rect
              x={cx - barW - 2}
              y={baseY - incomeH}
              width={barW}
              height={incomeH}
              fill={INCOME_COLOR}
              rx={3}
              opacity={0.85}
            />
            {/* Expense bar */}
            <rect
              x={cx + 2}
              y={baseY - expenseH}
              width={barW}
              height={expenseH}
              fill={EXPENSE_COLOR}
              rx={3}
              opacity={0.85}
            />
            {/* Month label */}
            <text
              x={cx}
              y={baseY + 20}
              textAnchor="middle"
              fontSize={22}
              fill="var(--color-text-muted, #888)"
            >
              {shortMonth(d.month)}
            </text>
          </g>
        );
      })}

      {/* Balance line */}
      {data.length > 1 && (() => {
        const points = data
          .map((d, i) => {
            const cx = PAD_LEFT + i * slotW + slotW / 2;
            const by = PAD_TOP + innerH - yScale(Math.max(d.balance, 0));
            return `${cx},${by}`;
          })
          .join(' ');
        return (
          <polyline
            points={points}
            fill="none"
            stroke={BALANCE_COLOR}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.9}
          />
        );
      })()}

      {/* Legend */}
      <g transform={`translate(${PAD_LEFT}, ${height - 8})`}>
        <rect x={0} y={-8} width={10} height={10} fill={INCOME_COLOR} rx={2} opacity={0.85} />
        <text x={14} y={2} fontSize={20} fill={MUTED_COLOR}>收入</text>
        <rect x={60} y={-8} width={10} height={10} fill={EXPENSE_COLOR} rx={2} opacity={0.85} />
        <text x={74} y={2} fontSize={20} fill={MUTED_COLOR}>支出</text>
        <line x1={130} y1={-3} x2={140} y2={-3} stroke={BALANCE_COLOR} strokeWidth={2.5} />
        <text x={144} y={2} fontSize={20} fill={MUTED_COLOR}>结余</text>
      </g>
    </svg>
  );
}
