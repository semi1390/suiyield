import { NextResponse } from "next/server"
import { getRealPositions } from "@/lib/positions"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get("wallet")

    if (!wallet || !wallet.startsWith("0x")) {
      return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 })
    }

    const result = await getRealPositions(wallet)

    return NextResponse.json({
      wallet,
      positions: result.positions,
      summary: {
        totalValueUsd: result.totalValueUsd,
        dailyEarningsUsd: result.dailyEarningsUsd,
      },
      source: result.source,
      updatedAt: new Date().toISOString()
    })
  } catch (err) {
    console.error("[/api/positions]", err)
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 })
  }
}