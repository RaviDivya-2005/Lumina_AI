import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Card from './Card';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#f43f5e', '#ec4899', '#d946ef'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl px-3 py-2 text-sm shadow-xl">
        <p className="text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="font-medium text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function LineChartCard({ title, data, lines, className = '' }) {
  return (
    <Card className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--chart-tick)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--chart-axis)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--chart-tick)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--chart-axis)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (
              <span className="text-gray-600 dark:text-gray-400 font-medium">{value}</span>
            )}
          />
          {(lines || [{ dataKey: 'value', color: '#6366f1', name: 'Value' }]).map(
            (line, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color || COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={{ fill: line.color || COLORS[idx % COLORS.length], strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name={line.name || line.dataKey}
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function BarChartCard({ title, data, bars, className = '' }) {
  return (
    <Card className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--chart-tick)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--chart-axis)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--chart-tick)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--chart-axis)' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (
              <span className="text-gray-600 dark:text-gray-400 font-medium">{value}</span>
            )}
          />
          {(bars || [{ dataKey: 'value', color: '#6366f1', name: 'Value' }]).map(
            (bar, idx) => (
              <Bar
                key={idx}
                dataKey={bar.dataKey}
                fill={bar.color || COLORS[idx % COLORS.length]}
                radius={[4, 4, 0, 0]}
                name={bar.name || bar.dataKey}
              />
            )
          )}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function PieChartCard({ title, data, className = '' }) {
  return (
    <Card className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {(data || []).map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={PIE_COLORS[idx % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (
              <span className="text-gray-600 dark:text-gray-400 font-medium">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
