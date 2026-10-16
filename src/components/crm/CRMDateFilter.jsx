import { useState } from 'react';
import { input } from './CRMShared.jsx';
export function dateRange(preset, now = new Date()) {
  const shifted = new Date(now.getTime() + 330 * 60000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const day = shifted.getUTCDate();
  let from = new Date(Date.UTC(year, month, day) - 330 * 60000);
  let to = new Date(from.getTime() + 86400000 - 1);
  if (preset === 'week')
    from = new Date(
      from.getTime() - ((shifted.getUTCDay() + 6) % 7) * 86400000,
    );
  if (preset === 'month')
    from = new Date(Date.UTC(year, month, 1) - 330 * 60000);
  if (preset === 'lastMonth') {
    from = new Date(Date.UTC(year, month - 1, 1) - 330 * 60000);
    to = new Date(Date.UTC(year, month, 1) - 330 * 60000 - 1);
  }
  if (preset === 'quarter')
    from = new Date(Date.UTC(year, Math.floor(month / 3) * 3, 1) - 330 * 60000);
  if (preset === 'financialYear')
    from = new Date(Date.UTC(month < 3 ? year - 1 : year, 3, 1) - 330 * 60000);
  return { from: from.toISOString(), to: to.toISOString() };
}
export default function CRMDateFilter({ onChange }) {
  const [preset, setPreset] = useState('month');
  const [custom, setCustom] = useState({});
  const changeCustom = (key, value) => {
    const next = { ...custom, [key]: value };
    setCustom(next);
    if (next.from && next.to && next.to >= next.from)
      onChange({
        from: `${next.from}T00:00:00+05:30`,
        to: `${next.to}T23:59:59.999+05:30`,
      });
  };
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <label>
        Date range
        <select
          className={input}
          value={preset}
          onChange={(event) => {
            const value = event.target.value;
            setPreset(value);
            if (value !== 'custom') onChange(dateRange(value));
          }}
        >
          {[
            ['today', 'Today'],
            ['week', 'This Week'],
            ['month', 'This Month'],
            ['lastMonth', 'Last Month'],
            ['quarter', 'Quarter'],
            ['financialYear', 'Financial Year'],
            ['custom', 'Custom Range'],
          ].map(([value, title]) => (
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </select>
      </label>
      {preset === 'custom' && (
        <>
          <label>
            From
            <input
              className={input}
              type="date"
              value={custom.from || ''}
              onChange={(event) => changeCustom('from', event.target.value)}
            />
          </label>
          <label>
            Until
            <input
              className={input}
              type="date"
              min={custom.from}
              value={custom.to || ''}
              onChange={(event) => changeCustom('to', event.target.value)}
            />
          </label>
          {custom.to && custom.from > custom.to && (
            <p role="alert">End date must follow start date.</p>
          )}
        </>
      )}
    </div>
  );
}
