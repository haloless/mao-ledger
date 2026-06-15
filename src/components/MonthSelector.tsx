import { formatMonthLabel, nextMonthKey, prevMonthKey, toMonthKey } from '../data/helpers';

interface MonthSelectorProps {
  month: string;
  onChange: (month: string) => void;
  /** Defaults to current month — user cannot navigate beyond this. */
  maxMonth?: string;
}

export default function MonthSelector({ month, onChange, maxMonth }: MonthSelectorProps) {
  const ceiling = maxMonth ?? toMonthKey();
  return (
    <div className="month-selector">
      <button
        className="btn btn-outline btn-sm"
        onClick={() => onChange(prevMonthKey(month))}
        aria-label="上个月 Previous month"
      >
        ‹
      </button>
      <span className="month-label">{formatMonthLabel(month)}</span>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => onChange(nextMonthKey(month))}
        disabled={month >= ceiling}
        aria-label="下个月 Next month"
      >
        ›
      </button>
    </div>
  );
}
