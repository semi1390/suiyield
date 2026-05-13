import { NextResponse } from "next/server"

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function POST(req: Request) {
  try {
    const { chatId, message } = await req.json()
    if (!chatId || !message) return NextResponse.json({ error: "Missing params" }, { status: 400 })

    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    const data = await res.json()
    if (!data.ok) throw new Error(data.description ?? "Telegram send failed")
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[alerts/send]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}