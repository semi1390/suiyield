import { NextResponse } from "next/server"
export const maxDuration = 30


const SCALLOP_META = { color: "#8B5CF6", initials: "Sc", depositUrl: "https://app.scallop.io" }

const SCALLOP_DECIMALS: Record<string, number> = {
  usdc: 6, sbusdt: 6, wusdc: 6, wusdt: 6, fdusd: 6, musd: 6, usdy: 6, usdsui: 6,
  sbeth: 8, weth: 8, sbwbtc: 8, wbtc: 8, zwbtc: 8, xbtc: 8,
  sui: 9, afsui: 9, hasui: 9, vsui: 9, haedal: 9, hawal: 9, wal: 9, wwal: 9,
  cetus: 9, sca: 9, deep: 6, ns: 6, blub: 9, fud: 9,
}

async function getPrices(): Promise<Record<string, number>> {
  try {
    const ids = "coingecko:sui,coingecko:usd-coin,coingecko:tether,coingecko:weth,coingecko:wrapped-bitcoin"
    const res = await fetch(`https://coins.llama.fi/prices/current/${ids}`, { next: { revalidate: 300 } })
    const data = await res.json()
    const c = data?.coins || {}
    return {
      sui:    c["coingecko:sui"]?.price ?? 3.5,
      afsui:  c["coingecko:sui"]?.price ?? 3.5,
      hasui:  c["coingecko:sui"]?.price ?? 3.5,
      vsui:   c["coingecko:sui"]?.price ?? 3.5,
      usdc:   c["coingecko:usd-coin"]?.price ?? 1,
      wusdc:  c["coingecko:usd-coin"]?.price ?? 1,
      sbusdt: c["coingecko:tether"]?.price ?? 1,
      wusdt:  c["coingecko:tether"]?.price ?? 1,
      weth:   c["coingecko:weth"]?.price ?? 3000,
      sbeth:  c["coingecko:weth"]?.price ?? 3000,
      sbwbtc: c["coingecko:wrapped-bitcoin"]?.price ?? 95000,
      wbtc:   c["coingecko:wrapped-bitcoin"]?.price ?? 95000,
      haedal: 0.12, wal: 0.25, hawal: 0.25, wwal: 0.25,
      cetus: 0.12, sca: 0.5, deep: 0.05, ns: 0.08,
      fdusd: 1, musd: 1, usdy: 1, usdsui: 1,
    }
  } catch {
    return { sui: 3.5, usdc: 1, sbusdt: 1 }
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 })

  try {
    const { Scallop } = await import("@scallop-io/sui-scallop-sdk")
    const scallop = new Scallop({ networkType: "mainnet" })
    const scallopQuery = await scallop.createScallopQuery()

    // Log available methods to find the right one
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(scallopQuery))
    console.log("[scallop-positions] available methods:", methods.filter(m => m.toLowerCase().includes("user") || m.toLowerCase().includes("lend") || m.toLowerCase().includes("portfolio") || m.toLowerCase().includes("position")))

    // Try different method names
    let portfolio: any = null
    for (const method of ["getUserLending", "getUserLendings", "getUserPortfolio", "getLendingPortfolio", "getPortfolio", "getUserSupply", "getUserSupplies", "getUserMarket"]) {
      if (typeof (scallopQuery as any)[method] === "function") {
        console.log(`[scallop-positions] trying ${method}()`)
        try {
          portfolio = await (scallopQuery as any)[method](address)
          console.log(`[scallop-positions] ${method} result:`, JSON.stringify(portfolio)?.slice(0, 500))
          break
        } catch (e) {
          console.log(`[scallop-positions] ${method} failed:`, e)
        }
      }
    }

    if (!portfolio) {
      console.log("[scallop-positions] no method worked, returning empty")
      return NextResponse.json({ positions: [] })
    }

    const prices = await getPrices()
    const positions = []
    const entries = Array.isArray(portfolio) ? portfolio : Object.entries(portfolio)

    for (const entry of entries as any[]) {
      const coinName = Array.isArray(entry) ? entry[0] : (entry.coinName ?? entry.coin ?? "")
      const data = Array.isArray(entry) ? entry[1] : entry
      if (!data || !coinName) continue

      const key = coinName.toLowerCase()
      const decimals = SCALLOP_DECIMALS[key] ?? 9
      const price = prices[key] ?? 1

      const supplyRaw = Number(data.supplyAmount ?? data.supply ?? data.balance ?? data.amount ?? 0)
      const supplyAmount = supplyRaw / Math.pow(10, decimals)
      const valueUsd = supplyAmount * price
      if (valueUsd < 0.01) continue

      const apy = Number(data.supplyApy ?? data.apy ?? 0) * 100

      positions.push({
        protocol: "Scallop",
        asset: coinName.toUpperCase(),
        supplyBalance: supplyAmount,
        valueUsd,
        apy,
        ...SCALLOP_META,
      })
    }

    console.log("[scallop-positions] parsed:", positions.length)
    return NextResponse.json({ positions })
  } catch (err) {
    console.error("[scallop-positions] error:", err)
    return NextResponse.json({ positions: [], error: String(err) })
  }
}