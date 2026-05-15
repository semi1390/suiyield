import { NextRequest, NextResponse } from "next/server"
import { SuiClient } from "@mysten/sui/client"

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" })

export async function GET(req: NextRequest) {
  try {
    // Fetch one known position + its pool
    const pos = await client.getObject({
      id: "0x742e80b3998fa9740b1d7b170ced29b49f5987f93c23c8668905fe2fdba6ef7e",
      options: { showContent: true },
    })

    const poolAddress = pos.data?.content?.fields?.pool
    const pool = await client.getObject({
      id: poolAddress,
      options: { showContent: true },
    })

    const posFields = pos.data?.content?.fields
    const poolFields = pool.data?.content?.fields

    return NextResponse.json({
      position: {
        liquidity: posFields?.liquidity,
        tick_lower_bits: posFields?.tick_lower_index?.fields?.bits,
        tick_upper_bits: posFields?.tick_upper_index?.fields?.bits,
        coin_type_a: posFields?.coin_type_a?.fields?.name,
        coin_type_b: posFields?.coin_type_b?.fields?.name,
      },
      pool: {
        current_sqrt_price: poolFields?.current_sqrt_price,
        current_tick_index: poolFields?.current_tick_index,
        fee_rate: poolFields?.fee_rate,
        liquidity: poolFields?.liquidity,
        coin_amount_a: poolFields?.coin_amount_a,
        coin_amount_b: poolFields?.coin_amount_b,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}