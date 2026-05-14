/**
 * DeFiLlama Yields API — FREE, no API key needed
 */

import type { YieldEntry } from "@/types"

const LLAMA_URL = "https://yields.llama.fi/pools"

const PROTOCOL_META: Record<string, { name: string; color: string; initials: string; logo: string }> = {
  "navi-lending":      { name: "Navi Protocol",   color: "#1A4FE0", initials: "N",  logo: "https://icons.llama.fi/navi-lending.png" },
  "scallop-lend":      { name: "Scallop",         color: "#8B5CF6", initials: "Sc", logo: "https://icons.llama.fi/scallop.png" },
  "suilend":           { name: "Suilend",         color: "#EC4899", initials: "Sl", logo: "https://icons.llama.fi/suilend.png" },
  "current":           { name: "Current",         color: "#0EA5E9", initials: "Cu", logo: "https://icons.llama.fi/current-finance.png" },
  "kai-finance":       { name: "Kai Finance",     color: "#14B8A6", initials: "K",  logo: "https://icons.llama.fi/kai-finance.png" },
  "bucket-protocol":   { name: "Bucket",          color: "#F59E0B", initials: "Bu", logo: "https://icons.llama.fi/bucket-protocol.png" },
  "omnibtc":           { name: "OmniBTC",         color: "#F97316", initials: "Om", logo: "https://icons.llama.fi/omnibtc.png" },
  "alphafi":           { name: "AlphaFi",         color: "#10B981", initials: "Al", logo: "https://icons.llama.fi/alphafi.png" },
  "cetus-clmm":        { name: "Cetus LP",        color: "#06B6D4", initials: "C",  logo: "https://icons.llama.fi/cetus.png" },
  "turbos":            { name: "Turbos",          color: "#F97316", initials: "T",  logo: "https://icons.llama.fi/turbos-finance.png" },
  "bluefin-spot":      { name: "Bluefin",         color: "#2563EB", initials: "Bf", logo: "https://icons.llama.fi/bluefin.png" },
  "flowx-v3":          { name: "FlowX",           color: "#3B82F6", initials: "Fx", logo: "https://icons.llama.fi/flowx-finance.png" },
  "flowx-v2":          { name: "FlowX",           color: "#3B82F6", initials: "Fx", logo: "https://icons.llama.fi/flowx-finance.png" },
  "flowx-finance":     { name: "FlowX",           color: "#3B82F6", initials: "Fx", logo: "https://icons.llama.fi/flowx-finance.png" },
  "kriya-dex":         { name: "KriyaDEX",        color: "#7C3AED", initials: "Kr", logo: "https://icons.llama.fi/kriya.png" },
  "aftermath-finance": { name: "Aftermath DEX",   color: "#EF4444", initials: "Af", logo: "https://icons.llama.fi/aftermath-finance.png" },
  "steamm":            { name: "STEAMM",          color: "#06B6D4", initials: "St", logo: "https://icons.llama.fi/suilend.png" },
  "full-sail":         { name: "Full Sail",       color: "#8B5CF6", initials: "Fs", logo: "https://icons.llama.fi/full-sail.png" },
  "deepbook":          { name: "DeepBook",        color: "#4B8BFF", initials: "Db", logo: "https://icons.llama.fi/deepbook.png" },
  "volo":              { name: "Volo",            color: "#10B981", initials: "V",  logo: "https://icons.llama.fi/volo.png" },
  "aftermath":         { name: "Aftermath",       color: "#EF4444", initials: "Af", logo: "https://icons.llama.fi/aftermath-finance.png" },
  "spring-sui":        { name: "SpringSui",       color: "#06B6D4", initials: "Sp", logo: "https://icons.llama.fi/spring-sui.png" },
  "haedal-protocol":   { name: "Haedal",          color: "#3A9FF5", initials: "H",  logo: "https://icons.llama.fi/haedal-protocol.png" },
}

const PROTOCOL_CATEGORY: Record<string, "lending" | "dex" | "staking"> = {
  "navi-lending":      "lending",
  "scallop-lend":      "lending",
  "suilend":           "lending",
  "current":           "lending",
  "kai-finance":       "lending",
  "bucket-protocol":   "lending",
  "omnibtc":           "lending",
  "alphafi":           "lending",
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
  "volo":              "staking",
  "aftermath":         "staking",
  "spring-sui":        "staking",
  "springsui":         "staking",
  "sui-liquid-staking":"staking",
  "haedal-protocol":   "staking",
}

function getCategory(pool: any): "lending" | "dex" | "staking" | "cex" {
  const project = (pool.project || "").toLowerCase()
  if (PROTOCOL_CATEGORY[project]) return PROTOCOL_CATEGORY[project]
  if ((pool.exposure || "").toLowerCase() === "multi") return "dex"
  const sym = pool.symbol || ""
  if (sym.includes("-") || sym.includes("/")) return "dex"
  const lstSymbols = ["afsui","hasui","vsui","ssui","msui","hsui","lsui","spring-sui"]
  if (lstSymbols.includes(sym.toLowerCase())) return "staking"
  return "lending"
}

function refineCategory(
  pool: any,
  base: "lending" | "dex" | "staking" | "cex"
): "lending" | "dex" | "staking" | "cex" {
  if ((pool.exposure || "").toLowerCase() === "multi") return "dex"
  const sym = (pool.symbol || "").toUpperCase()
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

let _cache: { yields: YieldEntry[]; ts: number } | null = null
const CACHE_TTL = 5 * 60 * 1000

export async function getLiveSuiYields(): Promise<YieldEntry[]> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    console.log("[DeFiLlama] Serving from memory cache")
    return _cache.yields
  }

  try {
    const res = await fetch(LLAMA_URL, {
      cache: "no-store",
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

    const EXCLUDED_SLUGS = new Set([
      "abyss",
      "ondo-yield-assets",
      "ember-protocol",
    ])

   const suiPools = (data.data || []).filter((p: any) => {
  if (p.chain === "Sui" && ["volo","aftermath","haedal","haedal-protocol","spring-sui"].includes((p.project || "").toLowerCase())) {
    console.log("[staking debug]", p.project, "->", p.url)
  }
  return p.chain === "Sui" && p.tvlUsd > 100000 && p.apy > 0 &&
    !EXCLUDED_SLUGS.has((p.project || "").toLowerCase())
})

    const entries: YieldEntry[] = suiPools.map((pool: any) => {
      const projectSlug = (pool.project || "").toLowerCase()
      const meta = PROTOCOL_META[projectSlug] || {
        name: pool.project || "Unknown",
        color: "#4B5563",
        initials: (pool.project || "?").charAt(0).toUpperCase(),
        logo: "",
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
        logo: meta.logo || "",
        depositUrl: getDepositUrl(projectSlug, pool), 
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

function getDepositUrl(slug: string, pool: any): string {
  // Always use our curated URLs first — never trust pool.url for staking/lending
const bySlug: Record<string, string> = {
  "navi-lending":      "https://app.naviprotocol.io",
  "scallop-lend":      "https://app.scallop.io",
  "suilend":           "https://app.suilend.fi",
  "current":           "https://app.current.finance",
  "kai-finance":       "https://kai.finance/vaults",
  "bucket-protocol":   "https://app.bucketprotocol.io",
  "omnibtc":           "https://app.omnibtc.finance",
  "alphafi":           "https://app.alphafi.xyz",
  "cetus-clmm":        "https://app.cetus.zone/pools",
  "turbos":            "https://app.turbos.finance/pools#/pools",
  "bluefin-spot":      "https://trade.bluefin.io/liquidity-pools",
  "flowx-v3":          "https://flowx.finance/position",
  "flowx-v2":          "https://flowx.finance/position",
  "flowx-finance":     "https://flowx.finance/position",
  "kriya-dex":         "https://www.kriya.finance/pools",
  "aftermath-finance": "https://aftermath.finance/pools",
  "steamm":            "https://app.suilend.fi/trade",
  "full-sail":         "https://app.fullsail.finance/liquidity",
  "deepbook":          "https://app.deepbook.tech",
  "volo":              "https://www.volosui.com/stake",
  "aftermath":         "https://aftermath.finance/staking",
  "spring-sui":        "https://springsui.com/SUI-sSUI",
  "haedal-protocol":   "https://www.haedal.xyz/stake",
}

  if (bySlug[slug]) return bySlug[slug]

  // Only use pool.url for DEX pools where it's reliable
  if (pool.url && pool.url.startsWith("http") && !pool.url.includes("defillama")) {
    return pool.url
  }

  if (pool.pool) return `https://defillama.com/yields/pool/${pool.pool}`
  return "https://defillama.com/yields?chain=Sui"
}