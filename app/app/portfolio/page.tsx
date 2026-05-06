"use client"
import { useState, useEffect } from "react"
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import PositionsFetcher from "@/components/PositionsFetcher"
import type { RealPosition } from "@/lib/positions"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts"
import { Wallet, TrendingUp, DollarSign, Calendar, Zap } from "lucide-react"

const COLORS = ["#00D4AA", "#4B8BFF", "#F5A623", "#EC4899", "#8B5CF6", "#06B6D4", "#F97316"]

// Token coin type → CoinGecko ID for live pricing
const TOKEN_META: Record<string, { name: string; geckoId: string; decimals: number }> = {
  "0x2::sui::SUI": { name: "SUI", geckoId: "sui", decimals: 9 },
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN": { name: "USDC", geckoId: "usd-coin", decimals: 6 },
  "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN": { name: "USDT", geckoId: "tether", decimals: 6 },
  "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX": { name: "NAVX", geckoId: "navi", decimals: 9 },
  "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS": { name: "CETUS", geckoId: "cetus-protocol", decimals: 9 },
  "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI": { name: "haSUI", geckoId: "sui", decimals: 9 },
  "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT": { name: "vSUI", geckoId: "sui", decimals: 9 },
}

interface WalletToken {
  symbol: string
  coinType: string
  balance: number
  valueUsd: number
}

export default function PortfolioPage() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const [positions, setPositions] = useState<RealPosition[]>([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)

  // Fetch wallet balances via Noodles API (Sui-native, accurate prices)
  useEffect(() => {
    if (!account?.address) { setWalletTokens([]); return }
    setTokensLoading(true)

    async function fetchBalances() {
      try {
        // Call our own API route — cached server-side for 5 mins, safe from rate limits
        const res = await fetch(`/api/portfolio?address=${account?.address}`)
        console.log("[Portfolio API] Status:", res.status)

        if (res.ok) {
          const result = await res.json()
          const raw = result?.data?.data || result?.data || {}
          console.log("[Portfolio API] Response:", JSON.stringify(raw).slice(0, 400))

          const holdings = raw?.data || raw?.holdings || raw?.coins || []
          if (holdings.length > 0) {
            const tokens: WalletToken[] = holdings
              .filter((h: any) => parseFloat(h.usd_value || h.valueUsd || h.value_usd || 0) >= 0.001)
              .map((h: any) => ({
                symbol: h.symbol || h.coin_symbol || "?",
                coinType: h.coin_type || h.coinType || "",
                balance: parseFloat(h.balance || h.amount || 0),
                valueUsd: parseFloat(h.usd_value || h.valueUsd || h.value_usd || 0)
              }))
              .sort((a: WalletToken, b: WalletToken) => b.valueUsd - a.valueUsd)

            setWalletTokens(tokens)
            setTokensLoading(false)
            return
          }
        }

        // Fallback: Sui RPC + DeFiLlama prices
        const geckoIds = Array.from(new Set(Object.values(TOKEN_META).map(m => `coingecko:${m.geckoId}`)))
        let livePrices: Record<string, number> = {}
        try {
          const res = await fetch(`https://coins.llama.fi/prices/current/${geckoIds.join(",")}`)
          const data = await res.json()
          for (const [id, info] of Object.entries(data.coins || {})) {
            const geckoId = id.replace("coingecko:", "")
            livePrices[geckoId] = (info as any).price || 0
          }
        } catch {}

        const balances = await client.getAllBalances({ owner: account?.address || "" })
        const tokens: WalletToken[] = []
        for (const b of balances) {
          const meta = TOKEN_META[b.coinType]
          if (!meta) continue
          const balance = parseInt(b.totalBalance) / Math.pow(10, meta.decimals)
          const price = livePrices[meta.geckoId] || 0
          const valueUsd = balance * price
          if (valueUsd < 0.001) continue
          tokens.push({ symbol: meta.name, coinType: b.coinType, balance, valueUsd })
        }
        setWalletTokens(tokens.sort((a, b) => b.valueUsd - a.valueUsd))
      } catch (e) {
        console.error("[Portfolio] Balance fetch failed:", e)
      } finally {
        setTokensLoading(false)
      }
    }

    fetchBalances()
  }, [account?.address, client])

  const handlePositions = (p: RealPosition[], loading: boolean) => {
    setPositionsLoading(loading)
    if (!loading) setPositions(p)
  }

  // Combined portfolio = DeFi positions + wallet tokens
  const defiTotal = positions.reduce((s, p) => s + p.valueUsd, 0)
  const walletTotal = walletTokens.reduce((s, t) => s + t.valueUsd, 0)
  const totalPortfolio = defiTotal + walletTotal

  const dailyEarnings = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
  const weeklyEarnings = dailyEarnings * 7
  const monthlyEarnings = dailyEarnings * 30
  const yearlyEarnings = dailyEarnings * 365

  // Pie chart data — combine positions and wallet tokens
  const pieData = [
    ...positions.map(p => ({ name: `${p.protocol} ${p.asset}`, value: p.valueUsd, type: "defi" })),
    ...walletTokens.map(t => ({ name: `${t.symbol} (wallet)`, value: t.valueUsd, type: "wallet" })),
  ].filter(d => d.value > 0)

  // Real historical portfolio value
  const [historyData, setHistoryData] = useState<{date: string; value: number}[]>([])

  useEffect(() => {
    if (!account?.address) return

    async function buildHistory() {
      try {
        const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)

        // 1. Get SUI price history — 30 daily data points
        const priceRes = await fetch(
          `https://coins.llama.fi/chart/coingecko:sui?start=${thirtyDaysAgo}&span=30&period=1d`
        )
        const priceData = await priceRes.json()
        const suiPrices: { timestamp: number; price: number }[] =
          priceData?.coins?.["coingecko:sui"]?.prices || []

        if (suiPrices.length === 0) return

        // 2. Get all wallet transactions with balance changes
        const txRes = await client.queryTransactionBlocks({
          filter: { FromAddress: account?.address || "" },
          options: { showBalanceChanges: true },
          limit: 100,
          order: "descending"
        })

        // Also get received transactions
        const txRes2 = await client.queryTransactionBlocks({
          filter: { ToAddress: account?.address || "" },
          options: { showBalanceChanges: true },
          limit: 100,
          order: "descending"
        })

        // 3. Build a timeline of SUI balance changes
        // Each entry: { timestampMs, suiDelta }
        const allTxs = [
          ...(txRes.data || []),
          ...(txRes2.data || [])
        ]

        // Deduplicate by digest
        const seen = new Set<string>()
        const uniqueTxs = allTxs.filter(tx => {
          if (seen.has(tx.digest)) return false
          seen.add(tx.digest)
          return true
        })

        // Parse balance changes for SUI
        const SUI_TYPE = "0x2::sui::SUI"
        const balanceEvents: { timestampMs: number; delta: number }[] = []

        for (const tx of uniqueTxs) {
          const ts = parseInt(tx.timestampMs || "0")
          if (!ts) continue
          const changes = (tx.balanceChanges || []) as any[]
          for (const change of changes) {
            if (change.coinType === SUI_TYPE &&
                (change.owner?.AddressOwner === account?.address)) {
              balanceEvents.push({
                timestampMs: ts,
                delta: parseInt(change.amount) / 1e9
              })
            }
          }
        }

        // Sort oldest first
        balanceEvents.sort((a, b) => a.timestampMs - b.timestampMs)

        // 4. Walk backwards from current balance to reconstruct history
        const currentSui = walletTokens.find(t => t.symbol === "SUI")?.balance || 0
        const stableValue = walletTokens.filter(t => t.symbol !== "SUI")
          .reduce((s, t) => s + t.valueUsd, 0)

        // Build daily SUI balance map
        // Start from current and subtract deltas going back in time
        let suiBalance = currentSui
        const dailyBalances = new Map<number, number>() // day timestamp → SUI balance

        const now = Date.now()
        // Walk through each day
        for (let i = 29; i >= 0; i--) {
          const dayStart = now - i * 24 * 60 * 60 * 1000
          const dayEnd = dayStart + 24 * 60 * 60 * 1000

          // Find transactions that happened AFTER this day (going backwards)
          const txsAfterDay = balanceEvents.filter(e =>
            e.timestampMs >= dayEnd && e.timestampMs <= now
          )

          // Reconstruct balance at start of this day
          const suiAtDay = currentSui - txsAfterDay.reduce((s, e) => s + e.delta, 0)
          dailyBalances.set(dayStart, Math.max(0, suiAtDay))
        }

        // 5. Combine with price history
        const chartData = suiPrices.slice(-30).map(p => {
          const dayTs = p.timestamp * 1000
          // Find closest balance
          let closestBalance = currentSui
          let closestDiff = Infinity
          dailyBalances.forEach((bal, ts) => {
            const diff = Math.abs(ts - dayTs)
            if (diff < closestDiff) {
              closestDiff = diff
              closestBalance = bal
            }
          })

          const value = parseFloat(((closestBalance * p.price) + stableValue + defiTotal).toFixed(2))
          const date = new Date(dayTs).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          return { date, value }
        })

        setHistoryData(chartData)
      } catch (e) {
        console.log("[Portfolio] History build failed:", e)
      }
    }

    buildHistory()
  }, [account?.address, walletTokens, defiTotal])

  const growthData = historyData.length > 0 ? historyData : []

  const avgApy = positions.length > 0
    ? positions.reduce((s, p) => s + p.apy, 0) / positions.length
    : 0

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      {account?.address && <PositionsFetcher walletAddress={account.address} onPositions={handlePositions} />}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Portfolio</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Your complete Sui DeFi portfolio — wallet balances and active positions</p>
        </div>

        {!account ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Wallet size={24} style={{ color: "var(--text-muted)" }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Connect your wallet</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Connect to see your token balances, DeFi positions and projected earnings.</div>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="stats-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { icon: DollarSign, label: "Total portfolio", value: `$${totalPortfolio.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "wallet + DeFi", color: "var(--text-primary)" },
                { icon: TrendingUp, label: "In DeFi", value: `$${defiTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: positions.length > 0 ? `${positions.length} positions` : "No positions", color: "#4B8BFF" },
                { icon: Zap, label: "Avg APY", value: avgApy > 0 ? `${avgApy.toFixed(2)}%` : "—", sub: "on DeFi positions", color: "var(--green)" },
                { icon: Calendar, label: "Daily earnings", value: dailyEarnings > 0 ? `+$${dailyEarnings.toFixed(4)}` : "—", sub: "at current rates", color: "var(--green)" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <s.icon size={14} style={{ color: "var(--green)" }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="portfolio-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Projected growth chart */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Portfolio value — last 30 days</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Reconstructed from your transaction history + SUI price data</div>
                    {growthData.length === 0 ? (
                      <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading history...</div>
                    ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={growthData}>
                        <defs>
                          <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#4B5470" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#4B5470" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`} domain={['auto', 'auto']} />
                        <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Value"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" stroke="#00D4AA" strokeWidth={2.5} fill="url(#earningsGradient)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                    )}
                  </div>

                {/* Wallet tokens */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Wallet tokens</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>${walletTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total</span>
                  </div>
                  {tokensLoading ? (
                    <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>Loading balances...</div>
                  ) : walletTokens.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>No tracked tokens in wallet</div>
                  ) : (
                    walletTokens.map((t, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)" }}>
                            {t.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{t.symbol}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.balance.toLocaleString("en-US", { maximumFractionDigits: 4 })} tokens</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>${t.valueUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{totalPortfolio > 0 ? ((t.valueUsd / totalPortfolio) * 100).toFixed(1) : 0}%</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* DeFi positions */}
                {positions.length > 0 && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>DeFi positions</span>
                      <span style={{ fontSize: 12, color: "var(--green)" }}>+${dailyEarnings.toFixed(4)}/day</span>
                    </div>
                    {positions.map((p, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--border)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: p.color + "22", border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: p.color }}>
                            {p.initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.protocol}</div>
                            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.asset} · {p.apy.toFixed(2)}% APY</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>${p.valueUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div style={{ fontSize: 11, color: "var(--green)" }}>+${((p.valueUsd * p.apy) / 100 / 365).toFixed(4)}/day</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Allocation pie */}
                {pieData.length > 0 && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>Allocation</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString("en-US", { maximumFractionDigits: 2 })}`, ""]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                      {pieData.slice(0, 6).map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 500 }}>
                            {totalPortfolio > 0 ? ((d.value / totalPortfolio) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Earnings summary */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>Earnings summary</div>
                  {[
                    { label: "Today", value: dailyEarnings > 0 ? `+$${dailyEarnings.toFixed(4)}` : "—" },
                    { label: "This week", value: weeklyEarnings > 0 ? `+$${weeklyEarnings.toFixed(3)}` : "—" },
                    { label: "This month", value: monthlyEarnings > 0 ? `+$${monthlyEarnings.toFixed(2)}` : "—" },
                    { label: "Yearly (est.)", value: yearlyEarnings > 0 ? `+$${yearlyEarnings.toFixed(0)}` : "—" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: r.value !== "—" ? "var(--green)" : "var(--text-muted)" }}>{r.value}</span>
                    </div>
                  ))}
                  {positions.length === 0 && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>Earnings shown once DeFi positions are loaded</p>
                  )}
                </div>

                {/* Best opportunity */}
                <div style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(75,139,255,0.08))", border: "1px solid var(--green-border)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>💡 Tip</div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 12, lineHeight: 1.6 }}>
                    {avgApy > 0
                      ? `Your positions earn ${avgApy.toFixed(1)}% avg APY. Check the Explore tab for better rates.`
                      : "Deposit to Navi or Scallop to start earning yield on your tokens."}
                  </div>
                  <a href="/app/explore" style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", textDecoration: "none" }}>
                    View opportunities →
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}