import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get("wallet")
  if (!wallet) return NextResponse.json({ connected: false })

  try {
    const chatId = await redis.get<string>(`tg:${wallet}`)
    return NextResponse.json({ connected: !!chatId, chatId: chatId ?? null })
  } catch {
    return NextResponse.json({ connected: false })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const wallet = searchParams.get("wallet")
  if (!wallet) return NextResponse.json({ ok: false })

  try {
    const chatId = await redis.get<string>(`tg:${wallet}`)
    await redis.del(`tg:${wallet}`)
    if (chatId) await redis.del(`tg:reverse:${chatId}`)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}