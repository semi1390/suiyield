import { NextRequest, NextResponse } from "next/server"
import { SuiClient } from "@mysten/sui/client"

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" })

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 })

  try {
    const balances = await client.getAllBalances({ owner: address })

    // Extract symbol from coin type
    const tokens = balances
      .map(b => {
        const parts = b.coinType.split("::")
        const symbol = parts[parts.length - 1]?.toUpperCase() ?? "?"
        const amount = Number(b.totalBalance)
        if (amount === 0) return null

        // Rough decimals by symbol
        const decimals = ["SUI","HASUI","VSUI","AFSUI"].includes(symbol) ? 9 : 6
        const humanAmount = amount / Math.pow(10, decimals)
        if (humanAmount < 0.01) return null

        return { symbol, balance: humanAmount, coinType: b.coinType }
      })
      .filter(Boolean)

    return NextResponse.json({ tokens })
  } catch (err: any) {
    return NextResponse.json({ tokens: [], error: err.message })
  }
}