import { NextResponse } from "next/server"

// Debug endpoint — shows raw DeFiLlama slugs for Sui
// Visit /api/debug to see what project slugs are coming in
// Use these slugs to update PROTOCOL_CATEGORY in lib/defillama.ts
export async function GET() {
  const res = await fetch("https://yields.llama.fi/pools")
  const data = await res.json()
  const suiPools = (data.data || []).filter((p: any) => p.chain === "Sui" && p.tvlUsd > 10000)

  const summary = suiPools.map((p: any) => ({
    slug: p.project,
    symbol: p.symbol,
    apy: p.apy?.toFixed(2),
    tvl: Math.round(p.tvlUsd),
    exposure: p.exposure,
  }))

  // Group by slug
  const bySlug: Record<string, any[]> = {}
  summary.forEach((p: any) => {
    if (!bySlug[p.slug]) bySlug[p.slug] = []
    bySlug[p.slug].push(p)
  })

  return NextResponse.json({ totalPools: suiPools.length, bySlug })
}