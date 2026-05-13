import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fromCoin = searchParams.get("from")
  const toCoin = searchParams.get("to")
  const amountIn = searchParams.get("amount")

  if (!fromCoin || !toCoin || !amountIn) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  try {
    const { MetaAg, EProvider } = await import("@7kprotocol/sdk-ts")

    const metaAg = new MetaAg({
      slippageBps: 50,
      partner: process.env.FEE_RECEIVER_ADDRESS ?? "",
      partnerCommissionBps: 5,
      providers: {
        [EProvider.CETUS]: { disabled: false },
        [EProvider.BLUEFIN7K]: { disabled: true },
        [EProvider.FLOWX]: { disabled: true },
      }
    })

    const quotes = await metaAg.quote({
      amountIn,
      coinTypeIn: fromCoin,
      coinTypeOut: toCoin,
    })

    console.log("[swap-quote] quotes received:", quotes.length)
    if (quotes.length > 0) {
      console.log("[swap-quote] first quote:", JSON.stringify(quotes[0])?.slice(0, 300))
    }

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ error: "No routes found" }, { status: 404 })
    }

    const best = quotes.sort(
      (a, b) => Number(b.amountOut) - Number(a.amountOut)
    )[0]

    console.log(`[swap-quote] best: ${best.amountOut} from ${best.provider}`)

    return NextResponse.json({
      result: {
        amount_out: best.amountOut,
        provider: best.provider,
        quote: best,
      }
    })
  } catch (err: any) {
    console.error("[swap-quote]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}