import type { YieldEntry } from "@/types"
import { SEED_YIELDS } from "@/lib/seed-data"

/**
 * NAVI PROTOCOL — Yield Fetcher
 *
 * TO SWITCH TO LIVE API:
 * 1. npm install @naviprotocol/navi-sdk
 * 2. Uncomment the live block below
 * 3. Delete or comment out the mock return
 */

export async function getNaviYields(): Promise<YieldEntry[]> {
  // ─── LIVE API (uncomment when ready) ────────────────────────────────────
  // try {
  //   const { NAVISDKClient, CoinInfo } = await import("@naviprotocol/navi-sdk")
  //   const client = new NAVISDKClient({ networkType: "mainnet" })
  //
  //   const [usdcPool, suiPool] = await Promise.all([
  //     client.getPoolInfo(CoinInfo.USDC),
  //     client.getPoolInfo(CoinInfo.SUI)
  //   ])
  //
  //   return [
  //     {
  //       id: "navi-usdc",
  //       protocol: "Navi Protocol",
  //       asset: "USDC",
  //       type: "Lending",
  //       apy: parseFloat((usdcPool.supplyRate * 100).toFixed(2)),
  //       tvl: usdcPool.totalSupply,
  //       risk: "low",
  //       depositUrl: "https://app.naviprotocol.io",
  //       color: "#E1F5EE",
  //       initials: "N"
  //     },
  //     {
  //       id: "navi-sui",
  //       protocol: "Navi Protocol",
  //       asset: "SUI",
  //       type: "Lending",
  //       apy: parseFloat((suiPool.supplyRate * 100).toFixed(2)),
  //       tvl: suiPool.totalSupply,
  //       risk: "low",
  //       depositUrl: "https://app.naviprotocol.io",
  //       color: "#E1F5EE",
  //       initials: "N"
  //     }
  //   ]
  // } catch (err) {
  //   console.error("[Navi] Live fetch failed, using seed data:", err)
  // }
  // ────────────────────────────────────────────────────────────────────────

  // MOCK — returns seed data shaped exactly like live API response
  await new Promise(r => setTimeout(r, 80)) // simulate network
  return SEED_YIELDS.filter(y => y.id.startsWith("navi"))
}
