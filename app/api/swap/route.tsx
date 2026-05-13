import { NextResponse } from "next/server"
import { Transaction } from "@mysten/sui/transactions"
import { SuiClient } from "@mysten/sui/client"

export async function POST(req: Request) {
  try {
    const { address, fromCoin, toCoin, amountIn, minAmountOut, quote } = await req.json()

    if (!quote) return NextResponse.json({ error: "Quote required" }, { status: 400 })

    const { MetaAg, EProvider } = await import("@7kprotocol/sdk-ts")
    const { coinWithBalance } = await import("@mysten/sui/transactions")

    const suiClient = new SuiClient({ url: "https://fullnode.mainnet.sui.io:443" })

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

    const tx = new Transaction()
    tx.setSender(address)

    // Re-fetch the quote server-side to get fresh package data
    // The quote from client may have stale package references
    const freshQuotes = await metaAg.quote({
      amountIn,
      coinTypeIn: fromCoin,
      coinTypeOut: toCoin,
    })

    if (!freshQuotes || freshQuotes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 400 })
    }

    const bestQuote = freshQuotes.sort(
      (a, b) => Number(b.amountOut) - Number(a.amountOut)
    )[0]

    console.log("[swap] using fresh quote from provider:", bestQuote.provider)

    const coinIn = coinWithBalance({
      balance: BigInt(amountIn),
      type: fromCoin,
    })

    const coinOut = await metaAg.swap(
      {
        quote: bestQuote,
        signer: address,
        coinIn,
        tx,
      },
      50
    )

    tx.transferObjects([coinOut], address)

    const txBytes = await tx.build({ client: suiClient })
    const txBase64 = Buffer.from(txBytes).toString("base64")
    return NextResponse.json({ txBase64 })
  } catch (err: any) {
    console.error("[swap]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}