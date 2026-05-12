import { NextResponse } from "next/server"

const NAVI_META = { color: "#1A4FE0", initials: "N", depositUrl: "https://app.naviprotocol.io" }

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
      if (!type.includes("supply")) continue // skip borrow positions

      const posData = entry[type] ?? null
      if (!posData) continue

      const pool = posData.pool ?? {}
      const symbol = (posData.token?.symbol ?? pool.token?.symbol ?? pool.coinType?.split("::")?.pop() ?? "?").toUpperCase()

      // Use valueUSD directly from SDK — most accurate
      const valueUsd = parseFloat(posData.valueUSD ?? 0)
      const amount = parseFloat(posData.amount ?? 0)

      if (valueUsd < 0.01) continue

      // APY from pool's supplyIncentiveApyInfo
      const supplyInfo = pool.supplyIncentiveApyInfo
      const apy = Number(supplyInfo?.apy ?? supplyInfo?.vaultApr ?? 0)

      positions.push({
        protocol: "Navi Protocol",
        asset: symbol,
        supplyBalance: Math.round(amount * 100) / 100,       // 2 decimals
        valueUsd: Math.round(valueUsd * 100) / 100,          // 2 decimals
        apy: Math.round(apy * 100) / 100,                    // 2 decimals
        ...NAVI_META,
      })
    }

    return NextResponse.json({ positions })
  } catch (err) {
    console.error("[navi-positions] error:", err)
    return NextResponse.json({ positions: [], error: String(err) })
  }
}