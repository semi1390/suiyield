/**
 * Positions fetcher — uses Navi's public REST API
 * Avoids server-side Sui RPC calls which timeout on most machines
 * 
 * Navi has a public portfolio API that returns supply/borrow positions
 * for any wallet address without needing RPC access
 */

export interface RealPosition {
  protocol: string
  asset: string
  supplyBalance: number
  valueUsd: number
  apy: number
  color: string
  initials: string
  depositUrl: string
}

// ── TOKEN PRICES ──────────────────────────────────────────────────────────────
async function getTokenPrices(): Promise<Record<string, number>> {
  try {
    const ids = "coingecko:sui,coingecko:usd-coin,coingecko:tether,coingecko:weth,coingecko:wrapped-bitcoin,coingecko:navi,coingecko:cetus-protocol"
    const res = await fetch(`https://coins.llama.fi/prices/current/${ids}`, {
      cache: "no-store"
    })
    const data = await res.json()
    return {
      "SUI":   data.coins?.["coingecko:sui"]?.price || 3.5,
      "USDC":  data.coins?.["coingecko:usd-coin"]?.price || 1,
      "USDT":  data.coins?.["coingecko:tether"]?.price || 1,
      "WETH":  data.coins?.["coingecko:weth"]?.price || 3000,
      "WBTC":  data.coins?.["coingecko:wrapped-bitcoin"]?.price || 95000,
      "NAVX":  data.coins?.["coingecko:navi"]?.price || 0.15,
      "CETUS": data.coins?.["coingecko:cetus-protocol"]?.price || 0.12,
      "HASUI": data.coins?.["coingecko:sui"]?.price || 3.5,
      "VSUI":  data.coins?.["coingecko:sui"]?.price || 3.5,
      "AFSUI": data.coins?.["coingecko:sui"]?.price || 3.5,
      "DEEP":  0.05,
      "NS":    0.08,
      "WAL":   0.25,
      "HAEDAL":0.12,
      "LBTC":  data.coins?.["coingecko:wrapped-bitcoin"]?.price || 95000,
      "XBTC":  data.coins?.["coingecko:wrapped-bitcoin"]?.price || 95000,
    }
  } catch {
    return { SUI: 3.5, USDC: 1, USDT: 1, WETH: 3000, WBTC: 95000 }
  }
}

// ── NAVI REST API ─────────────────────────────────────────────────────────────
// Navi provides a public portfolio endpoint — no RPC needed
async function getNaviPositions(walletAddress: string): Promise<RealPosition[]> {
  try {
    const res = await fetch(
      `https://open-api.naviprotocol.io/api/user?address=${walletAddress}`,
      { cache: "no-store" }
    )

    if (!res.ok) {
      console.log(`[Navi API] Status ${res.status}`)
      return []
    }

    const data = await res.json()
    console.log("[Navi API] Response:", JSON.stringify(data).slice(0, 300))

    const prices = await getTokenPrices()
    const positions: RealPosition[] = []

    // Navi API returns supplies array
    const supplies = data?.data?.supplies || data?.supplies || []

    for (const item of supplies) {
      const sym = (item.symbol || item.coin || "").toUpperCase()
      const amount = parseFloat(item.supplyBalance || item.amount || item.supply || 0)
      if (amount <= 0) continue

      const price = prices[sym] || 1

      positions.push({
        protocol: "Navi Protocol",
        asset: sym,
        supplyBalance: amount,
        valueUsd: amount * price,
        apy: parseFloat(item.supplyRate || item.apy || 0) * 100,
        color: "#1A4FE0",
        initials: "N",
        depositUrl: "https://app.naviprotocol.io"
      })
    }

    return positions
  } catch (err) {
    console.error("[Navi API] Failed:", err)
    return []
  }
}

// ── SCALLOP REST API ──────────────────────────────────────────────────────────
// Scallop has a public portfolio endpoint too
async function getScallopPositions(walletAddress: string): Promise<RealPosition[]> {
  try {
    const res = await fetch(
      `https://api.scallop.io/user/portfolio?address=${walletAddress}`,
      { cache: "no-store" }
    )

    if (!res.ok) {
      console.log(`[Scallop API] Status ${res.status}`)
      return []
    }

    const data = await res.json()
    console.log("[Scallop API] Response:", JSON.stringify(data).slice(0, 300))

    const prices = await getTokenPrices()
    const positions: RealPosition[] = []

    const lendings = data?.data?.lendings || data?.lendings || []

    for (const item of lendings) {
      const sym = (item.symbol || item.coin || "").toUpperCase()
      const amount = parseFloat(item.supplyAmount || item.amount || 0)
      if (amount <= 0) continue

      const price = prices[sym] || 1

      positions.push({
        protocol: "Scallop",
        asset: sym,
        supplyBalance: amount,
        valueUsd: amount * price,
        apy: parseFloat(item.supplyApy || 0) * 100,
        color: "#8B5CF6",
        initials: "Sc",
        depositUrl: "https://app.scallop.io"
      })
    }

    return positions
  } catch (err) {
    console.error("[Scallop API] Failed:", err)
    return []
  }
}

// ── COMBINED ──────────────────────────────────────────────────────────────────
export async function getRealPositions(walletAddress: string): Promise<{
  positions: RealPosition[]
  totalValueUsd: number
  dailyEarningsUsd: number
  source: "live" | "empty"
}> {
  const [naviResult, scallopResult] = await Promise.allSettled([
    getNaviPositions(walletAddress),
    getScallopPositions(walletAddress),
  ])

  const positions: RealPosition[] = [
    ...(naviResult.status === "fulfilled" ? naviResult.value : []),
    ...(scallopResult.status === "fulfilled" ? scallopResult.value : []),
  ].filter(p => p.valueUsd > 0.001)

  const totalValueUsd = positions.reduce((s, p) => s + p.valueUsd, 0)
  const dailyEarningsUsd = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)

  return {
    positions,
    totalValueUsd,
    dailyEarningsUsd,
    source: positions.length > 0 ? "live" : "empty"
  }
}