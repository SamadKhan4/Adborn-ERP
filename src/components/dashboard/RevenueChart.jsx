import { tw } from '../../lib/tailwind.js';
import { useId, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartNoAxesColumnIncreasing } from 'lucide-react';
import SectionCard from '../common/SectionCard.jsx';
import { currency } from '../../lib/dashboardFormat.js';
export default function RevenueChart({ revenue = [] }) {
  const chartId = useId().replaceAll(':', '');
  const [range, setRange] = useState('6');
  return (
    <SectionCard
      title="Invoice Trend"
      subtitle="INR totals by invoice month; paid is current invoice status"
      icon={ChartNoAxesColumnIncreasing}
      className={tw('revenue-card')}
      actions={
        <>
          <div className={tw('chart-legend')}>
            <span>
              <i />
              Billed
            </span>
            <span>
              <i />
              Paid
            </span>
          </div>
          <select
            aria-label="Revenue chart range"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="6">Last 6 Months</option>
            <option value="3">Last 3 Months</option>
          </select>
        </>
      }
    >
      <div
        className={tw('revenue-chart')}
        role="img"
        aria-label="Monthly billed and paid invoices grouped bar chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={revenue.slice(-Number(range))}
            margin={{ top: 12, right: 0, left: -20, bottom: 0 }}
            barGap={7}
          >
            <defs>
              <linearGradient
                id={`${chartId}-billed`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#0051a7" />
                <stop offset="100%" stopColor="#008cd8" />
              </linearGradient>
              <linearGradient
                id={`${chartId}-paid`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#9bd6ff" />
                <stop offset="100%" stopColor="#d1ecff" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#e8eef6" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={(month) =>
                new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'UTC',
                })
              }
              tickLine={false}
              axisLine={{ stroke: '#e8eef6' }}
              tick={{ fill: '#66738f', fontSize: 11 }}
              dy={10}
            />
            <YAxis
              tickFormatter={(value) => `${value / 1000}K`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#66738f', fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => currency(value)}
              contentStyle={{
                borderRadius: 12,
                borderColor: '#e7edf5',
                fontSize: 12,
              }}
              cursor={{ fill: '#f0f7fc' }}
            />
            <Bar
              name="Billed"
              dataKey="billed"
              fill={`url(#${chartId}-billed)`}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
            <Bar
              name="Paid"
              dataKey="paid"
              fill={`url(#${chartId}-paid)`}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
