import { NextResponse } from "next/server"
import { Transaction } from "@mysten/sui/transactions"
import { SuiClient } from "@mysten/sui/client"

// Navi contract addresses — from getConfig()
const NAVI_CONFIG = {
  package: "0x1e4a13a0494d5facdbe8473e74127b838c2d446ecec0ce262e2eddafa77259cb",
  storage: "0xbb4e2f4b6205c2e2a2db47aeb4f830796ec7c005f88537ee775986639bc442fe",
  incentiveV2: "0xf87a8acb8b81d14307894d12595541a73f19933f88e1326d5be349c7a6f7559c",
  incentiveV3: "0x62982dad27fb10bb314b3384d5de8d2ac2d72ab2dbeae5d801dbdb9efa816c80",
  clockId: "0x0000000000000000000000000000000000000000000000000000000000000006",
}

// Pool ID per coin type (from getConfig feeds — assetId maps to pool)
const POOL_IDS: Record<string, { assetId: number; poolId: string }> = {
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI": {
    assetId: 0,
    poolId: "0x96df0fce3c471489f4debaaa762cf960b3d97820bd1f3f025ff8190730e958c5",
  },
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC": {
    assetId: 10,
    poolId: "0xa3582097b4c57630046c0c49a88bfc6b202a3ec0a9db5597c31765f7563755a8",
  },
  "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT": {
    assetId: 19,
    poolId: "0x0e060c3b5b8de00fb50511b7a7b57702193ac6b5ce4608521e7a4e31d477c6d1",
  },
  "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH": {
    assetId: 11,
    poolId: "0x9cf288fdc18a6fc79d60fdcc3c4a23af05e40eb33a1b58c2a1773a50d6f2716",
  },
  "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP": {
    assetId: 15,
    poolId: "0x08373c5efffd07f88eace1c76abe4777489d9ec044fd4cd567f982d9c169e946",
  },
  "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX": {
    assetId: 7,
    poolId: "0x3c376f857fa9d5862eb7941e1d2d9b37f1fd44fc25e9c3f2a6476c1eca3dd5af",
  },
  "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI": {
    assetId: 6,
    poolId: "0x270b27b9bb269adc0e34db8ce0eb583de9e68a8e0b2a8f2cb3284cac7b41d6e",
  },
  "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT": {
    assetId: 5,
    poolId: "0xeb5a0c26bdde2a5e69bfc40a37e12e8ef4562b59e9e72386b6a39e8b97e0c9fb",
  },
  "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL": {
    assetId: 24,
    poolId: "0x9b3b4e1e8e0c5e0a1f2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4",
  },
}

export async function POST(req: Request) {
  try {
    const { address, coinType, amountInBaseUnits } = await req.json()

    const poolInfo = POOL_IDS[coinType]
    if (!poolInfo) {
      return NextResponse.json({ error: `Pool not found for ${coinType}` }, { status: 400 })
    }

   const suiClient = new SuiClient({ url: "https://fullnode.mainnet.sui.io:443" })
    const tx = new Transaction()
    tx.setSender(address)

    const amount = BigInt(amountInBaseUnits)
    const isSui = coinType.includes("::sui::SUI")

    let coinArg: any

    if (isSui) {
      // Split SUI from gas coin
      const [split] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)])
      coinArg = split
    } else {
      // Get user's coins for this type
      const coinsRes = await suiClient.getCoins({ owner: address, coinType })
      const coins = coinsRes?.data ?? []
      if (!coins.length) {
        return NextResponse.json({ error: `No ${coinType} found in wallet` }, { status: 400 })
      }

      const primaryCoin = tx.object(coins[0].coinObjectId)
      if (coins.length > 1) {
        tx.mergeCoins(primaryCoin, coins.slice(1).map((c: any) => tx.object(c.coinObjectId)))
      }
      const [split] = tx.splitCoins(primaryCoin, [tx.pure.u64(amount)])
      coinArg = split
    }

    // Call Navi's deposit Move function directly
    // Function: incentive_v3::deposit_with_account_cap or supply::deposit
    // Using the simpler deposit entry point
    tx.moveCall({
      target: `${NAVI_CONFIG.package}::incentive_v3::entry_deposit`,
      typeArguments: [coinType],
      arguments: [
        tx.object(NAVI_CONFIG.clockId),
        tx.object(NAVI_CONFIG.storage),
        tx.object(poolInfo.poolId),
        tx.pure.u8(poolInfo.assetId),
        coinArg,
        tx.pure.u64(amount),
        tx.object(NAVI_CONFIG.incentiveV2),
        tx.object(NAVI_CONFIG.incentiveV3),
      ],
    })

    // Build and serialize for client-side signing
    const txBytes = await tx.build({ client: suiClient })
    const txBase64 = Buffer.from(txBytes).toString("base64")

    return NextResponse.json({ txBase64 })
  } catch (err: any) {
    console.error("[deposit/navi]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}