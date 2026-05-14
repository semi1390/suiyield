import { NextRequest, NextResponse } from "next/server"
import { initCetusSDK } from "@cetusprotocol/sui-clmm-sdk"
import { SuiClient } from "@mysten/sui/client"

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" })

const cetusSDK = initCetusSDK({
  network: "mainnet",
  fullNodeUrl: "https://fullnode.mainnet.sui.io",
  simulationAccount: "0x0000000000000000000000000000000000000000000000000000000000000000",
})

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet")
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 })

  try {
    // Get all Cetus LP positions for this wallet
    const positions = await cetusSDK.Position.getPositionList(wallet, [], false)

    if (!positions || positions.length === 0) {
      return NextResponse.json({ positions: [] })
    }

    // For each position, get the pool to calculate token amounts
    const results = await Promise.allSettled(
      positions.map(async (pos: any) => {
        try {
          const pool = await cetusSDK.Pool.getPool(pos.pool)

          // Extract token symbols from coin types
          const symbolA = pool.coinTypeA.split("::").pop() ?? "?"
          const symbolB = pool.coinTypeB.split("::").pop() ?? "?"

          const liquidity = BigInt(pos.liquidity ?? 0)
          const inRange = pos.current_tick_index !== undefined
            ? pos.tick_lower_index <= pos.current_tick_index && pos.current_tick_index <= pos.tick_upper_index
            : true

          // Estimate token amounts from liquidity (simplified)
          const amountA = Number(pos.coin_amount_a ?? 0)
          const amountB = Number(pos.coin_amount_b ?? 0)

          // Get decimals — default to 6 for most Sui tokens, 8 for BTC
          const decimalsA = symbolA.includes("BTC") ? 8 : 6
          const decimalsB = symbolB.includes("BTC") ? 8 : 6

          const amountAHuman = amountA / Math.pow(10, decimalsA)
          const amountBHuman = amountB / Math.pow(10, decimalsB)

          // Uncollected fees
          const feeA = Number(pos.fee_amount_a ?? 0) / Math.pow(10, decimalsA)
          const feeB = Number(pos.fee_amount_b ?? 0) / Math.pow(10, decimalsB)

          return {
            id: pos.pos_object_id,
            protocol: "Cetus",
            type: "DEX LP",
            asset: `${symbolA}-${symbolB}`,
            symbolA,
            symbolB,
            amountA: amountAHuman,
            amountB: amountBHuman,
            liquidity: liquidity.toString(),
            inRange,
            feeA,
            feeB,
            tickLower: pos.tick_lower_index,
            tickUpper: pos.tick_upper_index,
            poolAddress: pos.pool,
            color: "#06B6D4",
            initials: "C",
          }
        } catch {
          return null
        }
      })
    )

    const cleaned = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
      .map(r => r.value)

    return NextResponse.json({ positions: cleaned })
  } catch (err: any) {
    console.error("[Cetus positions]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}