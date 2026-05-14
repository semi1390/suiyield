import { NextResponse } from "next/server"
import { Transaction } from "@mysten/sui/transactions"
import { SuiClient } from "@mysten/sui/client"

// Scallop mainnet contract addresses — immutable, never change
const SCALLOP_VERSION = "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7"
const SCALLOP_MARKET  = "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9"
const SCALLOP_PACKAGE = "0xa45b8ffca59e5b44ec7c04481a04cb620b0e07b2b183527bca4e5f32372c5f1a"
const CLOCK_ID        = "0x0000000000000000000000000000000000000000000000000000000000000006"

export async function POST(req: Request) {
  try {
    const { address, coinType, amountInBaseUnits } = await req.json()

    if (!address || !coinType || !amountInBaseUnits) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`[deposit/scallop] ${coinType} — amount: ${amountInBaseUnits}`)

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
        return NextResponse.json({ error: `No ${coinType.split("::").pop()} found in wallet` }, { status: 400 })
      }
      const primaryCoin = tx.object(coins[0].coinObjectId)
      if (coins.length > 1) {
        tx.mergeCoins(primaryCoin, coins.slice(1).map((c: any) => tx.object(c.coinObjectId)))
      }
      const [split] = tx.splitCoins(primaryCoin, [tx.pure.u64(amount)])
      coinArg = split
    }

    // Scallop deposit — mint sCoin in exchange for deposited asset
    const sCoin = tx.moveCall({
      target: `${SCALLOP_PACKAGE}::mint::mint`,
      typeArguments: [coinType],
      arguments: [
        tx.object(SCALLOP_VERSION),
        tx.object(SCALLOP_MARKET),
        coinArg,
        tx.object(CLOCK_ID),
      ],
    })

    // Return sCoin to user wallet
    tx.transferObjects([sCoin], address)

    const txBytes = await tx.build({ client: suiClient })
    const txBase64 = Buffer.from(txBytes).toString("base64")

    console.log(`[deposit/scallop] TX built successfully`)
    return NextResponse.json({ txBase64 })
  } catch (err: any) {
    console.error("[deposit/scallop]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}