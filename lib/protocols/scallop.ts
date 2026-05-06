import type { YieldEntry } from "@/types"
import { SEED_YIELDS } from "@/lib/seed-data"

/**
 * SCALLOP — Yield Fetcher
 *
 * TO SWITCH TO LIVE API:
 * 1. npm install @scallop-io/sui-scallop-sdk
 * 2. Uncomment the live block below
 * 3. Delete or comment out the mock return
 */

export async function getScallopYields(): Promise<YieldEntry[]> {
  // ─── LIVE API (uncomment when ready) ────────────────────────────────────
  // try {
  //   const { Scallop } = await import("@scallop-io/sui-scallop-sdk")
  //   const scallop = new Scallop({ networkType: "mainnet" })
  //   const query = await scallop.createScallopQuery()
  //   const markets = await query.getMarketPools()
  //
  //   return Object.entries(markets).map(([asset, pool]: [string, any]) => ({
  //     id: `scallop-${asset.toLowerCase()}`,
  //     protocol: "Scallop",
  //     asset: asset.toUpperCase(),
  //     type: "Lending",
  //     apy: parseFloat((pool.supplyApy * 100).toFixed(2)),
  //     tvl: pool.totalSupplyUsd,
  //     risk: "low",
  //     depositUrl: "https://app.scallop.io",
  //     color: "#E6F1FB",
  //     initials: "Sc"
  //   }))
  // } catch (err) {
  //   console.error("[Scallop] Live fetch failed, using seed data:", err)
  // }
  // ────────────────────────────────────────────────────────────────────────

  await new Promise(r => setTimeout(r, 90))
  return SEED_YIELDS.filter(y => y.id.startsWith("scallop"))
}
