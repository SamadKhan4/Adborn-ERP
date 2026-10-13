import { tw } from '../../lib/tailwind.js';
import { useState } from 'react';
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
import { revenue, currency } from '../../data/dashboardDemo.js';
export default function RevenueChart() {
  const [range, setRange] = useState('6');
  return (
    <SectionCard
      title="Revenue Trend"
      subtitle="Monthly revenue and expense overview"
      icon={ChartNoAxesColumnIncreasing}
      className={tw('revenue-card')}
      actions={
        <>
          <div className={tw('chart-legend')}>
            <span>
              <i />
              Revenue
            </span>
            <span>
              <i />
              Expenses
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
        aria-label="Demo monthly revenue and expenses grouped bar chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={revenue.slice(-Number(range))}
            margin={{ top: 12, right: 0, left: -20, bottom: 0 }}
            barGap={7}
          >
            <CartesianGrid stroke="#e8eef6" vertical={false} />
            <XAxis
              dataKey="month"
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
              name="Revenue"
              dataKey="revenue"
              fill="#006eb5"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
            <Bar
              name="Expenses"
              dataKey="expenses"
              fill="#a7d9fa"
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
