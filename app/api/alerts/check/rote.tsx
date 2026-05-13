import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const COOLDOWN_MS = 60 * 60 * 1000 // 1 hour between alerts for same condition

interface Alert {
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

export async function GET() {
  try {
    // 1. Fetch all live rates
    const ratesRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://suiyield-umzj.vercel.app"}/api/live-rates`)
    const ratesData = await ratesRes.json()
    const rates = ratesData.data ?? []

    // Build rate lookup: "navi:USDC" -> totalApy
    const rateMap = new Map<string, number>()
    for (const r of rates) {
      const key = `${r.protocol}:${r.symbol?.toUpperCase()}`
      rateMap.set(key, (r.apyBase ?? 0) + (r.apyReward ?? 0))
      rateMap.set(`any:${r.symbol?.toUpperCase()}`, Math.max(
        rateMap.get(`any:${r.symbol?.toUpperCase()}`) ?? 0,
        (r.apyBase ?? 0) + (r.apyReward ?? 0)
      ))
    }

    // 2. Get all alert keys
    const keys = await redis.keys("alert:*")
    if (!keys.length) return NextResponse.json({ checked: 0, triggered: 0 })

    const alerts = await Promise.all(keys.map(k => redis.get<Alert>(k)))
    const activeAlerts = alerts.filter((a): a is Alert => !!a && a.active)

    let triggered = 0

    for (const alert of activeAlerts) {
      // Cooldown check
      if (alert.lastTriggered && Date.now() - alert.lastTriggered < COOLDOWN_MS) continue

      // Find current APY for this asset+protocol
      const protocolKey = alert.protocol === "Any protocol"
        ? `any:${alert.asset.toUpperCase()}`
        : `${alert.protocol.toLowerCase().includes("navi") ? "navi" : "scallop"}:${alert.asset.toUpperCase()}`

      const currentApy = rateMap.get(protocolKey)
      if (currentApy === undefined) continue

      const shouldTrigger =
        (alert.direction === "above" && currentApy >= alert.threshold) ||
        (alert.direction === "below" && currentApy <= alert.threshold)

      if (!shouldTrigger) continue

      // Send Telegram message
      const protocolDisplay = alert.protocol === "Any protocol" ? "Sui protocols" : alert.protocol
      const message = `🔔 <b>SuiYield Alert</b>\n\n` +
        `<b>${alert.asset}</b> on ${protocolDisplay} is now at <b>${currentApy.toFixed(2)}%</b> APY\n` +
        `Your threshold: ${alert.direction} ${alert.threshold}%\n\n` +
        `<a href="https://suiyield-umzj.vercel.app/app">View opportunities →</a>`

      try {
        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: alert.chatId, text: message, parse_mode: "HTML" }),
        })

        // Update lastTriggered
        alert.lastTriggered = Date.now()
        await redis.set(`alert:${alert.walletAddress}:${alert.id}`, alert, { ex: 60 * 60 * 24 * 90 })
        triggered++
        console.log(`[alerts/check] Triggered alert for ${alert.asset} at ${currentApy.toFixed(2)}%`)
      } catch (e) {
        console.error("[alerts/check] Telegram send failed:", e)
      }
    }

    return NextResponse.json({ checked: activeAlerts.length, triggered })
  } catch (err: any) {
    console.error("[alerts/check]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}