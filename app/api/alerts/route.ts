import { NextResponse } from "next/server"
import { SEED_ALERTS } from "@/lib/seed-data"

// In-memory store for demo (replace with Supabase in production)
const alertStore: Map<string, any[]> = new Map()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wallet = searchParams.get("wallet")
    if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 })

    return NextResponse.json({ alerts: SEED_ALERTS })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wallet, asset, threshold, direction } = body

    if (!wallet || !asset || !threshold || !direction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const alert = {
      id: `alert-${Date.now()}`,
      wallet,
      asset,
      threshold: parseFloat(threshold),
      direction,
      active: true,
      createdAt: new Date().toISOString()
    }

    const existing = alertStore.get(wallet) || []
    alertStore.set(wallet, [...existing, alert])

    return NextResponse.json({ success: true, alert })
  } catch (err) {
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 })
  }
}
