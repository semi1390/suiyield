import { NextRequest, NextResponse } from "next/server"
import { SuiClient } from "@mysten/sui/client"

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" })

const CETUS_POSITION_TYPE = "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::position::Position"

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("wallet")
  if (!raw) return NextResponse.json({ error: "wallet required" }, { status: 400 })

  const wallet = raw.startsWith("0x") ? raw : `0x${raw}`

  try {
    // Step 1 — get all objects, filter manually (same as debug that worked)
    let allData: any[] = []
    let cursor: string | null | undefined = undefined

    do {
      const res: any = await client.getOwnedObjects({
        owner: wallet,
        options: { showType: true },
        cursor,
        limit: 50,
      })
      allData = [...allData, ...(res.data ?? [])]
      cursor = res.hasNextPage ? res.nextCursor : null
    } while (cursor)

    const cetusIds = allData
      .filter((obj: any) => obj.data?.type === CETUS_POSITION_TYPE)
      .map((obj: any) => obj.data?.objectId)
      .filter(Boolean)

    if (cetusIds.length === 0) {
      return NextResponse.json({ positions: [] })
    }

    // Step 2 — fetch full content for each position
    const fullObjects = await client.multiGetObjects({
      ids: cetusIds,
      options: { showContent: true },
    })

    const positions = fullObjects
      .map((obj: any) => {
        try {
          const content = obj.data?.content
          if (!content || content.dataType !== "moveObject") return null

          const fields = content.fields ?? {}

          // coin_type_a/b are nested: { type: "...", fields: { name: "xxx::usdc::USDC" } }
          const coinTypeA = fields.coin_type_a?.fields?.name ?? ""
          const coinTypeB = fields.coin_type_b?.fields?.name ?? ""
          const symbolA = coinTypeA.split("::").pop()?.toUpperCase() ?? "?"
          const symbolB = coinTypeB.split("::").pop()?.toUpperCase() ?? "?"

          const liquidity = fields.liquidity ?? "0"

          // tick indexes are nested: { fields: { bits: number } }
          const tickLower = Number(fields.tick_lower_index?.fields?.bits ?? 0)
          const tickUpper = Number(fields.tick_upper_index?.fields?.bits ?? 0)

          // No current_tick_index on position — use liquidity > 0 as proxy for in-range
          const inRange = Number(liquidity) > 0

          const decimalsA = symbolA.includes("BTC") ? 8 : 6
          const decimalsB = symbolB.includes("BTC") ? 8 : 6

          const feeOwedA = Number(fields.fee_owed_a ?? 0) / Math.pow(10, decimalsA)
          const feeOwedB = Number(fields.fee_owed_b ?? 0) / Math.pow(10, decimalsB)

          const name = fields.name ?? `${symbolA}-${symbolB}`

          return {
            id: obj.data?.objectId,
            protocol: "Cetus",
            type: "DEX LP",
            asset: `${symbolA}-${symbolB}`,
            name,
            symbolA,
            symbolB,
            amountA: 0,
            amountB: 0,
            liquidity,
            inRange,
            feeA: feeOwedA,
            feeB: feeOwedB,
            tickLower,
            tickUpper,
            poolAddress: fields.pool ?? "",
            color: "#06B6D4",
            initials: "C",
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)

    return NextResponse.json({ positions })
  } catch (err: any) {
    console.error("[Cetus positions]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}