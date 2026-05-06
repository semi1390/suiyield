import type { YieldEntry, Position } from "@/types"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

interface Props {
  yields: YieldEntry[]
  positions: Position[]
  dailyEarnings: number
}

function fmt(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`
  return `$${n.toLocaleString()}`
}

export default function StatCards({ yields, positions, dailyEarnings }: Props) {
  const stables = yields.filter(y => ["USDC", "USDT"].includes(y.asset))
  const bestUsdc = stables.sort((a, b) => b.apy - a.apy)[0]
  const suiYields = yields.filter(y => y.asset === "SUI")
  const bestSui = suiYields.sort((a, b) => b.apy - a.apy)[0]
  const totalDeposited = positions.reduce((s, p) => s + p.valueUsd, 0)

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Best USDC yield</span>
          <TrendingUp size={14} className="text-brand-600" />
        </div>
        <div className="text-[26px] font-medium text-gray-900">{bestUsdc?.apy.toFixed(1)}%</div>
        <div className="text-[12px] text-brand-600 mt-1">{bestUsdc?.protocol}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">My deposited value</span>
          <Wallet size={14} className="text-gray-400" />
        </div>
        <div className="text-[26px] font-medium text-gray-900">
          {totalDeposited > 0 ? fmt(totalDeposited) : "—"}
        </div>
        {dailyEarnings > 0 && (
          <div className="text-[12px] text-brand-600 mt-1">+${dailyEarnings.toFixed(2)} today</div>
        )}
        {totalDeposited === 0 && (
          <div className="text-[12px] text-gray-400 mt-1">Connect wallet to see</div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Best SUI yield</span>
          {bestSui?.change24h && bestSui.change24h >= 0
            ? <TrendingUp size={14} className="text-brand-600" />
            : <TrendingDown size={14} className="text-red-500" />
          }
        </div>
        <div className="text-[26px] font-medium text-gray-900">{bestSui?.apy.toFixed(1)}%</div>
        {bestSui?.change24h !== undefined && (
          <div className={`text-[12px] mt-1 ${bestSui.change24h >= 0 ? "text-brand-600" : "text-red-500"}`}>
            {bestSui.change24h >= 0 ? "▲" : "▼"} {Math.abs(bestSui.change24h).toFixed(1)}% since yesterday
          </div>
        )}
      </div>
    </div>
  )
}
