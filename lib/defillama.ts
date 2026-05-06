/**
 * DeFiLlama Yields API — FREE, no API key needed
 * Docs: https://yields.llama.fi/docs
 * 
 * Returns live APY + TVL for every pool on every chain.
 * We filter by chain === "Sui" to get all Sui protocol pools.
 */

import type { YieldEntry } from "@/types"

const LLAMA_URL = "https://yields.llama.fi/pools"

// Protocol display metadata — keyed by real DeFiLlama slugs
const PROTOCOL_META: Record<string, { name: string; color: string; initials: string }> = {
  // Lending
  "navi-lending":      { name: "Navi Protocol",   color: "#1A4FE0", initials: "N"   },
  "scallop-lend":      { name: "Scallop",         color: "#8B5CF6", initials: "Sc"  },
  "suilend":           { name: "Suilend",         color: "#EC4899", initials: "Sl"  },
  "current":           { name: "Current",         color: "#0EA5E9", initials: "Cu"  },
  "kai-finance":       { name: "Kai Finance",     color: "#14B8A6", initials: "K"   },
  "ondo-yield-assets": { name: "Ondo",            color: "#1D4ED8", initials: "O"   },
  "bucket-protocol":   { name: "Bucket",          color: "#F59E0B", initials: "Bu"  },
  "omnibtc":           { name: "OmniBTC",         color: "#F97316", initials: "Om"  },
  "alphafi":           { name: "AlphaFi",         color: "#10B981", initials: "Al"  },
  // DEX
  "cetus-clmm":        { name: "Cetus LP",        color: "#06B6D4", initials: "C"   },
  "turbos":            { name: "Turbos",          color: "#F97316", initials: "T"   },
  "bluefin-spot":      { name: "Bluefin",         color: "#2563EB", initials: "Bf"  },
  "flowx-v3":          { name: "FlowX",           color: "#3B82F6", initials: "Fx"  },
  "flowx-v2":          { name: "FlowX",           color: "#3B82F6", initials: "Fx"  },
  "flowx-finance":     { name: "FlowX",           color: "#3B82F6", initials: "Fx"  },
  "kriya-dex":         { name: "KriyaDEX",        color: "#7C3AED", initials: "Kr"  },
  "aftermath-finance": { name: "Aftermath DEX",   color: "#EF4444", initials: "Af"  },
  "steamm":            { name: "STEAMM",          color: "#06B6D4", initials: "St"  },
  "full-sail":         { name: "Full Sail",       color: "#8B5CF6", initials: "Fs"  },
  "deepbook":          { name: "DeepBook",        color: "#4B8BFF", initials: "Db"  },
  // Staking
  "volo":              { name: "Volo",            color: "#10B981", initials: "V"   },
  "aftermath":         { name: "Aftermath",       color: "#EF4444", initials: "Af"  },
  "spring-sui":        { name: "SpringSui",       color: "#06B6D4", initials: "Sp"  },
}

// Category mapping — built from real DeFiLlama slugs verified via /api/debug
const PROTOCOL_CATEGORY: Record<string, "lending" | "dex" | "staking"> = {
  // ── Lending ──────────────────────────────────────────────
  "navi-lending":      "lending",
  "scallop-lend":      "lending",
  "suilend":           "lending",
  "current":           "lending",
  "kai-finance":       "lending",
  "ondo-yield-assets": "lending",
  "bucket-protocol":   "lending",
  "omnibtc":           "lending",
  "alphafi":           "lending",

  // ── DEX / Liquidity ──────────────────────────────────────
  "cetus-clmm":        "dex",
  "turbos":            "dex",
  "bluefin-spot":      "dex",
  "flowx-v3":          "dex",
  "flowx-v2":          "dex",
  "flowx-finance":     "dex",
  "kriya-dex":         "dex",
  "kriya":             "dex",
  "aftermath-finance": "dex",
  "steamm":            "dex",
  "full-sail":         "dex",
  "deepbook":          "dex",

  // ── Liquid Staking ───────────────────────────────────────
  "volo":              "staking",
  "aftermath":         "staking",
  "spring-sui":        "staking",
  "springsui":         "staking",
  "sui-liquid-staking":"staking",
  // Haedal not currently in DeFiLlama yield data — add when listed
}

function getCategory(pool: any): "lending" | "dex" | "staking" | "cex" {
  const project = (pool.project || "").toLowerCase()

  // Explicit mapping is most reliable
  if (PROTOCOL_CATEGORY[project]) return PROTOCOL_CATEGORY[project]

  // DeFiLlama exposure field
  if ((pool.exposure || "").toLowerCase() === "multi") return "dex"

  // Symbol pair separator = DEX
  const sym = pool.symbol || ""
  if (sym.includes("-") || sym.includes("/")) return "dex"

  // Known LST symbols — always staking regardless of protocol slug
  const lstSymbols = ["afsui","hasui","vsui","ssui","msui","hsui","lsui","spring-sui"]
  if (lstSymbols.includes(sym.toLowerCase())) return "staking"

  // Default single-asset = lending
  return "lending"
}

function refineCategory(
  pool: any,
  base: "lending" | "dex" | "staking" | "cex"
): "lending" | "dex" | "staking" | "cex" {
  // Since PROTOCOL_CATEGORY is now built from real slugs,
  // this function just handles edge cases not covered by the map

  const sym = (pool.symbol || "").toUpperCase()

  // Any pool with multi-asset exposure is always DEX regardless of protocol
  if ((pool.exposure || "").toLowerCase() === "multi") return "dex"

  // Symbols with pair separators are always DEX
  if (sym.includes("-") || sym.includes("/")) return "dex"

  return base
}

function getRisk(pool: any): "low" | "medium" | "high" {
  const apy = pool.apy || 0
  const tvl = pool.tvlUsd || 0
  const il = pool.ilRisk || "no"
  if (il === "yes" || apy > 50) return "high"
  if (apy > 20 || tvl < 1000000) return "medium"
  return "low"
}

// In-memory cache to avoid fetching 18MB on every request
let _cache: { yields: YieldEntry[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getLiveSuiYields(): Promise<YieldEntry[]> {
  // Return cached data if fresh
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    console.log("[DeFiLlama] Serving from memory cache")
    return _cache.yields
  }

  try {
    const res = await fetch(LLAMA_URL, {
      cache: "no-store", // don't use Next.js cache — 18MB is too big
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; SuiYield/1.0; +https://suiyield.xyz)",
        "Accept-Encoding": "gzip, deflate, br",
        "Origin": "https://defillama.com",
        "Referer": "https://defillama.com/yields"
      }
    })

    console.log(`[DeFiLlama] Response status: ${res.status}`)
    if (!res.ok) throw new Error(`DeFiLlama API error: ${res.status}`)

    const data = await res.json()
    const EXCLUDED_SLUGS = new Set(["abyss"])

    const suiPools = (data.data || []).filter((p: any) =>
      p.chain === "Sui" && p.tvlUsd > 100000 && p.apy > 0 &&
      !EXCLUDED_SLUGS.has((p.project || "").toLowerCase())
    )

    const entries: YieldEntry[] = suiPools.map((pool: any) => {
      const projectSlug = (pool.project || "").toLowerCase()
      const meta = PROTOCOL_META[projectSlug] || {
        name: pool.project || "Unknown",
        color: "#4B5563",
        initials: (pool.project || "?").charAt(0).toUpperCase()
      }

      const symbol = (pool.symbol || "").toUpperCase()
      const category = refineCategory(pool, getCategory(pool))

      return {
        id: pool.pool || `${projectSlug}-${symbol}`,
        protocol: meta.name,
        asset: symbol,
        type: category === "lending" ? "Lending" : category === "dex" ? "DEX Pool" : category === "staking" ? "Liquid Staking" : "CEX",
        apy: parseFloat((pool.apy || 0).toFixed(2)),
        apyBase: parseFloat((pool.apyBase || 0).toFixed(2)),
        apyReward: parseFloat((pool.apyReward || 0).toFixed(2)),
        tvl: Math.round(pool.tvlUsd || 0),
        risk: getRisk(pool),
        depositUrl: getDepositUrl(meta.name, pool),
        color: meta.color,
        initials: meta.initials,
        change24h: parseFloat((pool.apyPct1D || 0).toFixed(2)),
        change7d: parseFloat((pool.apyPct7D || 0).toFixed(2)),
        category,
        poolId: pool.pool,
        underlyingTokens: pool.underlyingTokens || [],
        rewardTokens: pool.rewardTokens || [],
      } as YieldEntry
    })

    const sorted = entries.sort((a, b) => b.apy - a.apy)
    _cache = { yields: sorted, ts: Date.now() }
    console.log(`[DeFiLlama] Cached ${sorted.length} Sui pools`)
    return sorted
  } catch (err) {
    console.error("[DeFiLlama] Failed to fetch live yields — falling back to SEED DATA:", err)
    console.warn("[DeFiLlama] ⚠️ Rates shown are NOT real. Check headers/network.")
    const { SEED_YIELDS } = await import("./seed-data")
    return SEED_YIELDS
  }
}

function getDepositUrl(protocolName: string, pool: any): string {
  // DeFiLlama provides a url field on most pools — use it when available
  if (pool.url && pool.url.startsWith("http") && !pool.url.includes("defillama")) {
    return pool.url
  }

  // Fallback: hardcoded by slug (more reliable than display name)
  const slug = (pool.project || "").toLowerCase()
  const bySlug: Record<string, string> = {
    "navi-lending":      "https://app.naviprotocol.io",
    "scallop-lend":      "https://app.scallop.io",
    "suilend":           "https://app.suilend.fi",
    "current":           "https://app.current.finance",
    "kai-finance":       "https://kai.finance/vaults",
    "ondo-yield-assets": "https://ondo.finance/usdy",
    "bucket-protocol":   "https://app.bucketprotocol.io",
    "omnibtc":           "https://app.omnibtc.finance",
    "alphafi":           "https://app.alphafi.xyz",
    "cetus-clmm":        "https://app.cetus.zone/liquidity",
    "turbos":            "https://app.turbos.finance/pools",
    "bluefin-spot":      "https://app.bluefin.io/pools",
    "flowx-v3":          "https://flowx.finance/liquidity",
    "flowx-v2":          "https://flowx.finance/liquidity",
    "flowx-finance":     "https://flowx.finance/liquidity",
    "kriya-dex":         "https://www.kriya.finance/pools",
    "aftermath-finance": "https://aftermath.finance/pools",
    "steamm":            "https://app.suilend.fi/trade",
    "full-sail":         "https://fullsail.finance/pools",
    "deepbook":          "https://app.deepbook.tech",
    "volo":              "https://app.naviprotocol.io/staking",
    "aftermath":         "https://aftermath.finance/staking",
    "spring-sui":        "https://app.suilend.fi/spring-sui",
  }

  if (bySlug[slug] && bySlug[slug].length > 0) return bySlug[slug]

  // Last resort: use DeFiLlama pool page so user at least sees the pool
  if (pool.pool) return `https://defillama.com/yields/pool/${pool.pool}`

  return "https://defillama.com/yields?chain=Sui"
}