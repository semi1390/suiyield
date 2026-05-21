import { NextRequest, NextResponse } from "next/server"
import { SuiClient } from "@mysten/sui/client"
export const maxDuration = 30

const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" })

const CETUS_POSITION_TYPE = "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb::position::Position"

function getDecimals(symbol: string): number {
  const DECIMALS: Record<string, number> = {
    "BTC": 8, "WBTC": 8, "XBTC": 8, "LBTC": 8, "ENZOBTC": 8,
    "SUI": 9, "HASUI": 9, "VSUI": 9, "AFSUI": 9,
    "USDC": 6, "USDT": 6, "WETH": 6, "DEEP": 6, "WAL": 6,
    "CETUS": 6, "NAVX": 6,
  }
  return DECIMALS[symbol.toUpperCase()] ?? 6
}

function tickToSqrtPriceX64(tick: number): bigint {
  try {
    const price = Math.pow(1.0001, tick)
    const sqrtPrice = Math.sqrt(price)
    const Q64 = Math.pow(2, 64)
    return BigInt(Math.floor(sqrtPrice * Q64))
  } catch {
    return BigInt(0)
  }
}

function getTokenAmounts(
  liquidity: bigint,
  sqrtPriceX64: bigint,
  tickLower: number,
  tickUpper: number,
  decimalsA: number,
  decimalsB: number
): { amountA: number; amountB: number } {
  try {
    const Q64 = BigInt("18446744073709551616") // 2^64
    const sqrtPriceLower = tickToSqrtPriceX64(tickLower)
    const sqrtPriceUpper = tickToSqrtPriceX64(tickUpper)
    const sqrtPrice = sqrtPriceX64

    let amountA = BigInt(0)
    let amountB = BigInt(0)

    if (sqrtPrice <= sqrtPriceLower) {
      amountA = (liquidity * Q64 * (sqrtPriceUpper - sqrtPriceLower)) / (sqrtPriceLower * sqrtPriceUpper)
    } else if (sqrtPrice >= sqrtPriceUpper) {
      amountB = (liquidity * (sqrtPriceUpper - sqrtPriceLower)) / Q64
    } else {
      amountA = (liquidity * Q64 * (sqrtPriceUpper - sqrtPrice)) / (sqrtPrice * sqrtPriceUpper)
      amountB = (liquidity * (sqrtPrice - sqrtPriceLower)) / Q64
    }

    return {
      amountA: Number(amountA) / Math.pow(10, decimalsA),
      amountB: Number(amountB) / Math.pow(10, decimalsB),
    }
  } catch {
    return { amountA: 0, amountB: 0 }
  }
}

async function getTokenPriceUsd(symbol: string): Promise<number> {
  try {
    const knownPrices: Record<string, string> = {
      "USDC":  "coingecko:usd-coin",
      "USDT":  "coingecko:tether",
      "SUI":   "coingecko:sui",
      "WETH":  "coingecko:weth",
      "WBTC":  "coingecko:wrapped-bitcoin",
      "DEEP":  "coingecko:deep-book",
      "WAL":   "coingecko:walrus-2",
      "CETUS": "coingecko:cetus-protocol",
      "NAVX":  "coingecko:navx",
      "HASUI": "coingecko:sui",
      "VSUI":  "coingecko:sui",
      "AFSUI": "coingecko:sui",
    }
    const id = knownPrices[symbol.toUpperCase()]
    if (!id) return 0
    const res = await fetch(`https://coins.llama.fi/prices/current/${id}`)
    const data = await res.json()
    return data.coins?.[id]?.price ?? 0
  } catch {
    return 0
  }
}

let _llamaCache: any[] | null = null
let _llamaCacheTs = 0

async function getCetusLlamaPools(): Promise<any[]> {
  if (_llamaCache && Date.now() - _llamaCacheTs < 5 * 60 * 1000) return _llamaCache
  try {
    const res = await fetch("https://yields.llama.fi/pools", { headers: { "Accept": "application/json" } })
    const data = await res.json()
    _llamaCache = (data.data || []).filter((p: any) => p.chain === "Sui" && p.project === "cetus-clmm")
    _llamaCacheTs = Date.now()
    return _llamaCache!
  } catch {
    return []
  }
}

async function getPoolApr(feeRate: number, symbolA: string, symbolB: string): Promise<number> {
  try {
    const pools = await getCetusLlamaPools()
    const symA = symbolA.toUpperCase()
    const symB = symbolB.toUpperCase()
    const match = pools.find((p: any) => {
      const sym = (p.symbol ?? "").toUpperCase()
      return sym.includes(symA) && sym.includes(symB)
    })
    if (match?.apy && match.apy > 0) return parseFloat(match.apy.toFixed(2))
    return parseFloat((feeRate * 100).toFixed(2))
  } catch {
    return parseFloat((feeRate * 100).toFixed(2))
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("wallet")
  if (!raw) return NextResponse.json({ error: "wallet required" }, { status: 400 })

  const wallet = raw.startsWith("0x") ? raw : `0x${raw}`

  try {
    // Step 1 — get all objects
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

    if (cetusIds.length === 0) return NextResponse.json({ positions: [] })

    // Step 2 — fetch position content
    const fullObjects: any[] = await client.multiGetObjects({ ids: cetusIds, options: { showContent: true } })

    // Step 3 — collect pool addresses
    const poolAddresses = Array.from(new Set(
      fullObjects.map((obj: any) => (obj.data?.content as any)?.fields?.pool).filter(Boolean)
    )) as string[]

    // Step 4 — fetch pool data
    const poolObjects: any[] = await client.multiGetObjects({ ids: poolAddresses, options: { showContent: true } })
    const poolMap: Record<string, any> = {}
    for (const pool of poolObjects) {
      const id = pool.data?.objectId
      const fields = (pool.data?.content as any)?.fields ?? {}
      if (id) poolMap[id] = fields
    }

    // Step 5 — extract symbols
    const symbolsNeeded = new Set<string>()
    const rawPositions = fullObjects.map((obj: any) => {
      const fields = (obj.data?.content as any)?.fields ?? {}
      const symbolA = fields.coin_type_a?.fields?.name?.split("::")?.pop()?.toUpperCase() ?? "?"
      const symbolB = fields.coin_type_b?.fields?.name?.split("::")?.pop()?.toUpperCase() ?? "?"
      symbolsNeeded.add(symbolA)
      symbolsNeeded.add(symbolB)
      return { obj, fields, symbolA, symbolB }
    })

    // Step 6 — fetch prices + warm APY cache
    const priceMap: Record<string, number> = {}
    await Promise.all([
      ...Array.from(symbolsNeeded).map(async (sym: string) => { priceMap[sym] = await getTokenPriceUsd(sym) }),
      getCetusLlamaPools(),
    ])

    // Step 7 — build positions
    const positions = await Promise.all(
      rawPositions.map(async ({ obj, fields, symbolA, symbolB }: any) => {
        try {
          const liquidity = BigInt(fields.liquidity ?? 0)
          const tickLower = Number(fields.tick_lower_index?.fields?.bits ?? 0)
          const tickUpper = Number(fields.tick_upper_index?.fields?.bits ?? 0)
          const poolAddress = fields.pool ?? ""
          const pool = poolMap[poolAddress] ?? {}
          const sqrtPriceX64 = BigInt(pool.current_sqrt_price ?? 0)
          const inRange = Number(liquidity) > 0

          const decimalsA = getDecimals(symbolA)
          const decimalsB = getDecimals(symbolB)

          const { amountA, amountB } = getTokenAmounts(liquidity, sqrtPriceX64, tickLower, tickUpper, decimalsA, decimalsB)

          const priceA = priceMap[symbolA] ?? 0
          const priceB = priceMap[symbolB] ?? 0
          const valueUsd = amountA * priceA + amountB * priceB

          const feeOwedA = Number(fields.fee_owed_a ?? 0) / Math.pow(10, decimalsA)
          const feeOwedB = Number(fields.fee_owed_b ?? 0) / Math.pow(10, decimalsB)
          const feeRate = Number(pool.fee_rate ?? 0) / 1_000_000
          const apy = await getPoolApr(feeRate, symbolA, symbolB)

          return {
            id: obj.data?.objectId,
            protocol: "Cetus",
            type: "DEX LP",
            asset: `${symbolA}-${symbolB}`,
            name: (obj.data?.content as any)?.fields?.name ?? `${symbolA}-${symbolB}`,
            symbolA,
            symbolB,
            amountA,
            amountB,
            valueUsd,
            apy,
            liquidity: liquidity.toString(),
            inRange,
            feeA: feeOwedA,
            feeB: feeOwedB,
            priceA,
            priceB,
            tickLower,
            tickUpper,
            poolAddress,
            color: "#06B6D4",
            initials: "C",
          }
        } catch {
          return null
        }
      })
    )

    return NextResponse.json({ positions: positions.filter(Boolean) })
  } catch (err: any) {
    console.error("[Cetus positions]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}