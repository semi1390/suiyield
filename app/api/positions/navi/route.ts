import { NextResponse } from "next/server"
export const maxDuration = 30

const NAVI_META = {
  color: "#1A4FE0",
  initials: "N",
  depositUrl: "/app", // Points to our dashboard where user can deposit natively
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get("address")
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 })

  try {
    const { getLendingPositions } = await import("@naviprotocol/lending")

    const raw = await getLendingPositions(address)
    if (!raw || !Array.isArray(raw)) return NextResponse.json({ positions: [] })

    const positions = []

    for (const entry of raw as any[]) {
      const type = entry.type ?? ""
      if (!type.includes("supply")) continue

      const posData = entry[type] ?? null
      if (!posData) continue

      const pool = posData.pool ?? {}
      const symbol = (
        posData.token?.symbol ??
        pool.token?.symbol ??
        pool.coinType?.split("::")?.pop() ??
        "?"
      ).toUpperCase()

      const valueUsd = parseFloat(posData.valueUSD ?? 0)
      const amount = parseFloat(posData.amount ?? 0)

      if (valueUsd < 0.01) continue

      const supplyInfo = pool.supplyIncentiveApyInfo
      // Use full boosted APY (base + incentives) — matches what user sees on Navi
      const rawApy = Number(supplyInfo?.apy ?? supplyInfo?.vaultApr ?? 0)
// Navi SDK returns APY as basis points e.g. 228 = 2.28%
     const apy = rawApy > 100 ? rawApy / 100 : rawApy


      positions.push({
        protocol: "Navi Protocol",
        asset: symbol,
        supplyBalance: Math.round(amount * 100) / 100,
        valueUsd: Math.round(valueUsd * 100) / 100,
        apy: Math.round(apy * 100) / 100,
        ...NAVI_META,
      })
    }

    return NextResponse.json({ positions })
  } catch (err) {
    console.error("[navi-positions] error:", err)
    return NextResponse.json({ positions: [], error: String(err) })
  }
}