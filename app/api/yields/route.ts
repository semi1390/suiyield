import { NextResponse } from "next/server"
import { getLiveSuiYields } from "@/lib/defillama"
import type { Category } from "@/types"

export const revalidate = 300 // 5 min cache

const _rateLimits = new Map<string, { count: number; ts: number }>()
function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = _rateLimits.get(ip)
  if (!entry || now - entry.ts > 60000) { _rateLimits.set(ip, { count: 1, ts: now }); return false }
  if (entry.count >= 30) return true  // yields is heavier, allow 30/min
  entry.count++
  return false
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  if (isRateLimited(ip)) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })

  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") as Category | null
    const asset = searchParams.get("asset") || "all"

    let yields = await getLiveSuiYields()

    // Category filter
    if (category) yields = yields.filter(y => y.category === category)

    // Asset filter
    const STABLES = ["USDC", "USDT", "USDC.E", "WUSDC"]
    const LSTS = ["AFSUI", "HASUI", "VSUI", "SSUI"]
    const BTC = ["WBTC", "XBTC", "BTCB", "BTC"]

    if (asset === "stablecoins") yields = yields.filter(y => STABLES.includes(y.asset.toUpperCase()))
    else if (asset === "sui") yields = yields.filter(y => y.asset.toUpperCase() === "SUI")
    else if (asset === "lsts") yields = yields.filter(y => LSTS.some(l => y.asset.toUpperCase().includes(l.replace("SUI",""))))
    else if (asset === "btc") yields = yields.filter(y => BTC.some(b => y.asset.toUpperCase().includes(b)))

    // Group by category for the frontend
    const grouped = {
      lending: yields.filter(y => y.category === "lending"),
      dex:     yields.filter(y => y.category === "dex"),
      staking: yields.filter(y => y.category === "staking"),
      cex:     yields.filter(y => y.category === "cex"),
    }

    // Stats
    const stables = yields.filter(y => STABLES.includes(y.asset.toUpperCase()))
    const suiOnly = yields.filter(y => y.asset.toUpperCase() === "SUI")
    const bestUsdc = stables.sort((a, b) => b.apy - a.apy)[0]
    const bestSui = suiOnly.sort((a, b) => b.apy - a.apy)[0]

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      source: "DeFiLlama",
      total: yields.length,
      yields,
      grouped,
      stats: { bestUsdc, bestSui }
    })
  } catch (err) {
    console.error("[/api/yields]", err)
    return NextResponse.json({ error: "Failed to fetch yields" }, { status: 500 })
  }
}