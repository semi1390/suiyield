import type { YieldEntry } from "@/types"
import { SEED_YIELDS } from "@/lib/seed-data"

// ─── SUILEND ────────────────────────────────────────────────────────────────
/**
 * TO SWITCH TO LIVE API:
 * Suilend has a public REST API — no SDK install needed.
 * Uncomment the live block below.
 */
export async function getSuilendYields(): Promise<YieldEntry[]> {
  // ─── LIVE API ────────────────────────────────────────────────────────────
  // try {
  //   const res = await fetch("https://api.suilend.fi/markets", { next: { revalidate: 60 } })
  //   const data = await res.json()
  //   return data.reserves.map((r: any) => ({
  //     id: `suilend-${r.symbol.toLowerCase()}`,
  //     protocol: "Suilend",
  //     asset: r.symbol,
  //     type: "Lending",
  //     apy: parseFloat((r.supplyApr * 100).toFixed(2)),
  //     tvl: r.totalSupplyUsd,
  //     risk: "low",
  //     depositUrl: "https://app.suilend.fi",
  //     color: "#EAF3DE",
  //     initials: "Sl"
  //   }))
  // } catch (err) {
  //   console.error("[Suilend] Live fetch failed, using seed data:", err)
  // }
  // ─────────────────────────────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 70))
  return SEED_YIELDS.filter(y => y.id.startsWith("suilend"))
}

// ─── CETUS ───────────────────────────────────────────────────────────────────
/**
 * TO SWITCH TO LIVE API:
 * 1. npm install @cetusprotocol/cetus-clmm-sui-sdk
 * 2. Uncomment the live block below.
 */
export async function getCetusYields(): Promise<YieldEntry[]> {
  // ─── LIVE API ────────────────────────────────────────────────────────────
  // try {
  //   const res = await fetch("https://api-sui.cetus.zone/v2/sui/pools_info?limit=10&order_by=-tvl_in_usd", { next: { revalidate: 60 } })
  //   const data = await res.json()
  //   return data.data.lp_list.slice(0, 3).map((pool: any) => ({
  //     id: `cetus-${pool.symbol.toLowerCase().replace("/", "-")}`,
  //     protocol: "Cetus LP",
  //     asset: pool.symbol,
  //     type: "Liquidity",
  //     apy: parseFloat(pool.apr_24h || 0),
  //     tvl: parseFloat(pool.tvl_in_usd || 0),
  //     risk: "medium",
  //     depositUrl: `https://app.cetus.zone/liquidity?poolAddress=${pool.pool_address}`,
  //     color: "#FAEEDA",
  //     initials: "C"
  //   }))
  // } catch (err) {
  //   console.error("[Cetus] Live fetch failed, using seed data:", err)
  // }
  // ─────────────────────────────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 100))
  return SEED_YIELDS.filter(y => y.id.startsWith("cetus"))
}

// ─── AFTERMATH ───────────────────────────────────────────────────────────────
/**
 * TO SWITCH TO LIVE API:
 * 1. npm install @aftermath-finance/sdk
 * 2. Uncomment the live block below.
 */
export async function getAftermathYields(): Promise<YieldEntry[]> {
  // ─── LIVE API ────────────────────────────────────────────────────────────
  // try {
  //   const { Aftermath } = await import("@aftermath-finance/sdk")
  //   const af = new Aftermath("MAINNET")
  //   const staking = af.Staking()
  //   const apy = await staking.getAfSuiApy()
  //   const stats = await staking.getStakedSuiVaultState()
  //   return [{
  //     id: "aftermath-afsui",
  //     protocol: "Aftermath",
  //     asset: "afSUI",
  //     type: "Liquid Staking",
  //     apy: parseFloat((apy * 100).toFixed(2)),
  //     tvl: stats.totalSuiAmount,
  //     risk: "low",
  //     depositUrl: "https://aftermath.finance/staking",
  //     color: "#FAECE7",
  //     initials: "Af"
  //   }]
  // } catch (err) {
  //   console.error("[Aftermath] Live fetch failed, using seed data:", err)
  // }
  // ─────────────────────────────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 85))
  return SEED_YIELDS.filter(y => y.id.startsWith("aftermath"))
}

// ─── HAEDAL ──────────────────────────────────────────────────────────────────
export async function getHaedalYields(): Promise<YieldEntry[]> {
  // ─── LIVE API ────────────────────────────────────────────────────────────
  // try {
  //   const res = await fetch("https://api.haedal.xyz/stat", { next: { revalidate: 60 } })
  //   const data = await res.json()
  //   return [{
  //     id: "haedal-hasui",
  //     protocol: "Haedal",
  //     asset: "haSUI",
  //     type: "Liquid Staking",
  //     apy: parseFloat((data.apy * 100).toFixed(2)),
  //     tvl: data.totalStakedUsd,
  //     risk: "low",
  //     depositUrl: "https://app.haedal.xyz",
  //     color: "#EEEDFE",
  //     initials: "H"
  //   }]
  // } catch (err) {
  //   console.error("[Haedal] Live fetch failed, using seed data:", err)
  // }
  // ─────────────────────────────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 75))
  return SEED_YIELDS.filter(y => y.id.startsWith("haedal"))
}

// ─── TURBOS ──────────────────────────────────────────────────────────────────
export async function getTurbosYields(): Promise<YieldEntry[]> {
  // ─── LIVE API ────────────────────────────────────────────────────────────
  // try {
  //   const res = await fetch("https://api.turbos.finance/pools?limit=5&sort=tvl", { next: { revalidate: 60 } })
  //   const data = await res.json()
  //   return data.pools.slice(0, 2).map((p: any) => ({
  //     id: `turbos-${p.token_a_symbol.toLowerCase()}-${p.token_b_symbol.toLowerCase()}`,
  //     protocol: "Turbos",
  //     asset: `${p.token_a_symbol}/${p.token_b_symbol}`,
  //     type: "Liquidity",
  //     apy: parseFloat(p.apr || 0),
  //     tvl: parseFloat(p.tvl_usd || 0),
  //     risk: "medium",
  //     depositUrl: `https://app.turbos.finance/pools/${p.pool_id}`,
  //     color: "#FBEAF0",
  //     initials: "T"
  //   }))
  // } catch (err) {
  //   console.error("[Turbos] Live fetch failed, using seed data:", err)
  // }
  // ─────────────────────────────────────────────────────────────────────────
  await new Promise(r => setTimeout(r, 65))
  return SEED_YIELDS.filter(y => y.id.startsWith("turbos"))
}
