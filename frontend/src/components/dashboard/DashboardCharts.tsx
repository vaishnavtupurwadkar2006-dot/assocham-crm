'use client'

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import type { DashboardChartData } from '@/types'

const COLORS = ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#14b8a6', '#f97316']

interface DashboardChartsProps {
  data: DashboardChartData
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 shadow-sm text-xs transition-colors">
        {label && <p className="font-semibold text-zinc-500 dark:text-zinc-400 mb-1">{label}</p>}
        {payload.map((item: any, index: number) => (
          <p key={index} className="text-zinc-900 dark:text-zinc-100 font-medium">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: item.color || item.payload?.fill }} />
            {item.name}: <span className="font-bold">{item.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sector Distribution - Pie */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm transition-colors">
        <h3 className="text-zinc-850 dark:text-white font-semibold text-sm mb-4">Sector Distribution</h3>
        {data.by_sector.length === 0
          ? <EmptyState />
          : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.by_sector}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.by_sector.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )
        }
        <Legend items={data.by_sector.slice(0, 5)} />
      </div>

      {/* State Distribution - Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm transition-colors">
        <h3 className="text-zinc-850 dark:text-white font-semibold text-sm mb-4">Contacts by State</h3>
        {data.by_state.length === 0
          ? <EmptyState />
          : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.by_state.slice(0, 8)} layout="vertical" margin={{ left: -10, right: 10 }}>
                <XAxis type="number" stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" tick={{ fontSize: 10 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Growth trend - Line */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm transition-colors">
        <h3 className="text-zinc-850 dark:text-white font-semibold text-sm mb-4">Contact Growth (6 months)</h3>
        {data.growth_by_month.every(d => d.value === 0)
          ? <EmptyState />
          : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.growth_by_month} margin={{ left: -20, right: 10 }}>
                <XAxis dataKey="name" stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" tick={{ fontSize: 10 }} />
                <YAxis stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Source Distribution - Pie */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-sm transition-colors">
        <h3 className="text-zinc-850 dark:text-white font-semibold text-sm mb-4">Contact Sources</h3>
        {data.by_source_type.length === 0
          ? <EmptyState />
          : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data.by_source_type}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`}
                  labelLine={false}
                  className="text-[10px] font-semibold text-zinc-500 fill-zinc-600 dark:fill-zinc-400"
                >
                  {data.by_source_type.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )
        }
      </div>
    </div>
  )
}

function Legend({ items }: { items: { name: string; value: number }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
      {items.map((item, i) => (
        <div key={item.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
          <span className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">{item.name} ({item.value})</span>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return <div className="h-40 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-sm font-medium">No data yet</div>
}
