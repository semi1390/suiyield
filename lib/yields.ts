import { getNaviYields } from "./protocols/navi"
import { getScallopYields } from "./protocols/scallop"
import { getSuilendYields, getCetusYields, getAftermathYields, getHaedalYields, getTurbosYields } from "./protocols/others"
import type { YieldEntry } from "@/types"

export async function getAllYields(): Promise<YieldEntry[]> {
  const results = await Promise.allSettled([
    getNaviYields(),
    getScallopYields(),
    getSuilendYields(),
    getCetusYields(),
    getAftermathYields(),
    getHaedalYields(),
    getTurbosYields()
  ])

  const yields: YieldEntry[] = []
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      yields.push(...result.value)
    } else {
      console.error(`Protocol ${i} failed:`, result.reason)
      // Failed protocols are silently skipped — app never crashes
    }
  })

  return yields.sort((a, b) => b.apy - a.apy)
}

export function getBestByAsset(yields: YieldEntry[]) {
  const stablecoins = ["USDC", "USDT", "USDC.e"]
  const bestUsdc = yields.filter(y => stablecoins.includes(y.asset)).sort((a, b) => b.apy - a.apy)[0]
  const bestSui = yields.filter(y => y.asset === "SUI").sort((a, b) => b.apy - a.apy)[0]
  return { bestUsdc, bestSui }
}
