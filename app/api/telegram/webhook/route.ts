import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = (message.text ?? "").trim()
    const firstName = message.chat.first_name ?? "there"

    if (text.startsWith("/start")) {
      const parts = text.split(" ")
      const walletAddress = parts[1] ?? null

      if (walletAddress && walletAddress.startsWith("0x")) {
        // Save wallet → chatId mapping
        await redis.set(`tg:${walletAddress}`, chatId.toString(), { ex: 60 * 60 * 24 * 365 })
        await redis.set(`tg:reverse:${chatId}`, walletAddress, { ex: 60 * 60 * 24 * 365 })

        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            parse_mode: "HTML",
            text: `✅ <b>Connected to SuiYield!</b>\n\nHey ${firstName}! Your wallet is now linked.\n\n<code>${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}</code>\n\nGo back to SuiYield to create your first alert 🚀`,
          }),
        })
      } else {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            parse_mode: "HTML",
            text: `👋 <b>Welcome to SuiYield Alerts!</b>\n\nTo connect your wallet, go to <a href="https://suiyield-umzj.vercel.app/app/alerts">SuiYield Alerts</a> and click <b>Connect Telegram</b>.`,
          }),
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[webhook] error:", err)
    return NextResponse.json({ ok: true })
  }
}