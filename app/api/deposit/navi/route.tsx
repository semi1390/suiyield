import { NextResponse } from "next/server"
import { Transaction } from "@mysten/sui/transactions"
import { SuiClient } from "@mysten/sui/client"

// Cache config for 1 hour — it almost never changes
let configCache: { data: any; ts: number } | null = null
const CONFIG_TTL = 60 * 60 * 1000

async function getNaviConfig() {
  if (configCache && Date.now() - configCache.ts < CONFIG_TTL) {
    return configCache.data
  }
  const { getConfig } = await import("@naviprotocol/lending")
  const config = await getConfig()
  configCache = { data: config, ts: Date.now() }
  return config
}

// Cache pool data for 5 minutes
const poolCache = new Map<string, { data: any; ts: number }>()
const POOL_TTL = 5 * 60 * 1000

async function getNaviPool(coinType: string) {
  const cached = poolCache.get(coinType)
  if (cached && Date.now() - cached.ts < POOL_TTL) return cached.data
  const { getPool } = await import("@naviprotocol/lending")
  const pool = await getPool(coinType)
  if (pool) poolCache.set(coinType, { data: pool, ts: Date.now() })
  return pool
}

export async function POST(req: Request) {
  try {
    const { address, coinType, amountInBaseUnits } = await req.json()

    // Fetch config and pool dynamically
    const [config, pool] = await Promise.all([
      getNaviConfig(),
      getNaviPool(coinType),
    ])

    if (!pool) {
      return NextResponse.json({ error: `Pool not found for ${coinType}` }, { status: 400 })
    }
    if (pool.isDeprecated) {
      return NextResponse.json({ error: `This pool has been deprecated` }, { status: 400 })
    }
    if (pool.status === "inactive") {
      return NextResponse.json({ error: `This pool is currently inactive` }, { status: 400 })
    }

    const assetId = pool.id
    const poolId = pool.contract?.pool

    if (assetId === undefined || assetId === null) {
      return NextResponse.json({ error: `No asset ID found for ${coinType}` }, { status: 400 })
    }
    if (!poolId) {
      return NextResponse.json({ error: `No pool contract found for ${coinType}` }, { status: 400 })
    }

    console.log(`[deposit/navi] ${pool.token?.symbol} — assetId: ${assetId}, poolId: ${poolId}`)
    console.log(`[deposit/navi] package: ${config.package}`)

    const suiClient = new SuiClient({ url: "https://fullnode.mainnet.sui.io:443" })
    const tx = new Transaction()
    tx.setSender(address)

    const amount = BigInt(amountInBaseUnits)
    const isSui = coinType.toLowerCase().includes("::sui::sui")
    let coinArg: any

    if (isSui) {
      const [split] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
      coinArg = split
    } else {
      const coinsRes = await suiClient.getCoins({ owner: address, coinType })
      const coins = coinsRes?.data ?? []
      if (!coins.length) {
        return NextResponse.json({ error: `No ${pool.token?.symbol ?? coinType} found in wallet` }, { status: 400 })
      }
      const primaryCoin = tx.object(coins[0].coinObjectId)
      if (coins.length > 1) {
        tx.mergeCoins(primaryCoin, coins.slice(1).map((c: any) => tx.object(c.coinObjectId)))
      }
      const [split] = tx.splitCoins(primaryCoin, [tx.pure.u64(amount)])
      coinArg = split
    }

    // Use contract addresses from getConfig() — fully dynamic
    const clockId = "0x0000000000000000000000000000000000000000000000000000000000000006"

    tx.moveCall({
      target: `${config.package}::incentive_v3::entry_deposit`,
      typeArguments: [coinType],
      arguments: [
        tx.object(clockId),
        tx.object(config.storage),
        tx.object(poolId),
        tx.pure.u8(assetId),
        coinArg,
        tx.pure.u64(amount),
        tx.object(config.incentiveV2),
        tx.object(config.incentiveV3),
      ],
    })

    const txBytes = await tx.build({ client: suiClient })
    const txBase64 = Buffer.from(txBytes).toString("base64")
    return NextResponse.json({ txBase64 })
  } catch (err: any) {
    console.error("[deposit/navi]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}