"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { RATE_HISTORY } from "@/lib/seed-data"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm text-[12px]">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toFixed(1)}%</p>
      ))}
    </div>
  )
}

export default function RateHistoryChart() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-[13px] font-medium text-gray-900 mb-4">7-day rate history</div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={RATE_HISTORY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="navi" stroke="#1D9E75" strokeWidth={2} dot={false} name="Navi" />
          <Line type="monotone" dataKey="scallop" stroke="#378ADD" strokeWidth={2} dot={false} name="Scallop" />
          <Line type="monotone" dataKey="suilend" stroke="#97C459" strokeWidth={2} dot={false} name="Suilend" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
