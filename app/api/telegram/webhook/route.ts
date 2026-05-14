import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

async function sendMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const message = body?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = (message.text ?? "").trim()
    const firstName = message.chat.first_name ?? "there"

    // /start — connect wallet
    if (text.startsWith("/start")) {
      const parts = text.split(" ")
      const rawParam = parts[1] ?? null
      const walletAddress = rawParam?.startsWith("sui")
        ? "0x" + rawParam.slice(3)
        : rawParam

      if (walletAddress && walletAddress.startsWith("0x")) {
        await redis.set(`tg:${walletAddress}`, chatId.toString(), { ex: 60 * 60 * 24 * 365 })
        await redis.set(`tg:reverse:${chatId}`, walletAddress, { ex: 60 * 60 * 24 * 365 })

        await sendMessage(chatId, 
          `✅ <b>Connected to SuiYield!</b>\n\n` +
          `Hey ${firstName}! Your wallet is now linked.\n\n` +
          `<code>${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}</code>\n\n` +
          `You'll receive yield alerts here when your thresholds are hit.\n\n` +
          `🚀 <a href="https://suiyield-umzj.vercel.app/app/alerts">Go to SuiYield</a> to create your first alert.`
        )
      } else {
        await sendMessage(chatId,
          `👋 <b>Welcome to SuiYield Alerts!</b>\n\n` +
          `SuiYield tracks the best DeFi yields on Sui — Navi, Scallop, and more.\n\n` +
          `To connect your wallet:\n` +
          `1. Go to <a href="https://suiyield-umzj.vercel.app/app/alerts">SuiYield Alerts</a>\n` +
          `2. Click <b>Connect Telegram</b>\n` +
          `3. Press START or copy the command shown\n\n` +
          `Use /help for more info.`
        )
      }

    // /help
    } else if (text === "/help") {
      await sendMessage(chatId,
        `📚 <b>SuiYield Help</b>\n\n` +
        `<b>What is SuiYield?</b>\n` +
        `SuiYield tracks the best DeFi yield rates across all Sui protocols — Navi, Scallop, Suilend, and more.\n\n` +
        `<b>Commands:</b>\n` +
        `/start — Connect your wallet\n` +
        `/status — Check your connection\n` +
        `/stop — Disconnect your wallet\n` +
        `/help — Show this message\n\n` +
        `<b>Alerts:</b>\n` +
        `Set yield thresholds and get notified instantly when rates hit your target.\n\n` +
        `🌐 <a href="https://suiyield-umzj.vercel.app">Open SuiYield</a>`
      )

    // /status
    } else if (text === "/status") {
      const walletAddress = await redis.get<string>(`tg:reverse:${chatId}`)
      if (walletAddress) {
        // Count active alerts
        const keys = await redis.keys(`alert:${walletAddress}:*`)
        await sendMessage(chatId,
          `✅ <b>Connected</b>\n\n` +
          `Wallet: <code>${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}</code>\n` +
          `Active alerts: <b>${keys.length}</b>\n\n` +
          `<a href="https://suiyield-umzj.vercel.app/app/alerts">Manage alerts →</a>`
        )
      } else {
        await sendMessage(chatId,
          `❌ <b>Not connected</b>\n\n` +
          `Go to <a href="https://suiyield-umzj.vercel.app/app/alerts">SuiYield Alerts</a> to connect your wallet.`
        )
      }

    // /stop — disconnect
    } else if (text === "/stop") {
      const walletAddress = await redis.get<string>(`tg:reverse:${chatId}`)
      if (walletAddress) {
        await redis.del(`tg:${walletAddress}`)
        await redis.del(`tg:reverse:${chatId}`)
        await sendMessage(chatId,
          `👋 <b>Disconnected</b>\n\n` +
          `Your wallet has been unlinked. You won't receive any more alerts.\n\n` +
          `Come back anytime at <a href="https://suiyield-umzj.vercel.app/app/alerts">SuiYield Alerts</a>.`
        )
      } else {
        await sendMessage(chatId,
          `You're not connected. Nothing to disconnect.`
        )
      }

    // Unknown command
    } else if (text.startsWith("/")) {
      await sendMessage(chatId,
        `🤔 Unknown command. Try /help to see what I can do.`
      )

    // Any other message
    } else {
      await sendMessage(chatId,
        `👋 Hey ${firstName}! I'm the SuiYield alerts bot.\n\n` +
        `Use /help to see available commands or visit <a href="https://suiyield-umzj.vercel.app">SuiYield</a>.`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[webhook] error:", err)
    return NextResponse.json({ ok: true })
  }
}