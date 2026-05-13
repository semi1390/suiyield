import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface Alert {
  id: string
  walletAddress: string
  chatId: string
  asset: string
  protocol: string
  direction: "above" | "below"
  threshold: number
  active: boolean
  createdAt: number
  lastTriggered?: number
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get("wallet")
  if (!wallet) return NextResponse.json({ alerts: [] })

  try {
    const keys = await redis.keys(`alert:${wallet}:*`)
    if (!keys.length) return NextResponse.json({ alerts: [] })
    const alerts = await Promise.all(keys.map(k => redis.get<Alert>(k)))
    return NextResponse.json({ alerts: alerts.filter(Boolean) })
  } catch (err: any) {
    return NextResponse.json({ alerts: [] })
  }
}

export async function POST(req: Request) {
  try {
    const { walletAddress, asset, protocol, direction, threshold } = await req.json()

    if (!walletAddress || !asset || !threshold) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get chatId from Redis — set by Telegram bot
    const chatId = await redis.get<string>(`tg:${walletAddress}`)
    if (!chatId) {
      return NextResponse.json({ error: "Telegram not connected. Connect Telegram first." }, { status: 400 })
    }

    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      walletAddress,
      chatId,
      asset,
      protocol: protocol || "Any protocol",
      direction,
      threshold: parseFloat(threshold),
      active: true,
      createdAt: Date.now(),
    }

    await redis.set(`alert:${walletAddress}:${alert.id}`, alert, { ex: 60 * 60 * 24 * 90 })
    return NextResponse.json({ alert })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get("wallet")
    const id = searchParams.get("id")
    if (!wallet || !id) return NextResponse.json({ error: "Missing params" }, { status: 400 })
    await redis.del(`alert:${wallet}:${id}`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { wallet, id, active } = await req.json()
    if (!wallet || !id) return NextResponse.json({ error: "Missing params" }, { status: 400 })
    const key = `alert:${wallet}:${id}`
    const alert = await redis.get<Alert>(key)
    if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 })
    alert.active = active
    await redis.set(key, alert, { ex: 60 * 60 * 24 * 90 })
    return NextResponse.json({ alert })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}