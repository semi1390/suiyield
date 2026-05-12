"use client"
import { useState, useEffect } from "react"
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import PositionsFetcher from "@/components/PositionsFetcher"
import type { RealPosition } from "@/lib/positions"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts"
import { Wallet, TrendingUp, DollarSign, Calendar, Zap } from "lucide-react"

const COLORS = ["#00D4AA", "#4B8BFF", "#F5A623", "#EC4899", "#8B5CF6", "#06B6D4", "#F97316"]

// All known Sui token coin types with correct addresses
const TOKEN_META: Record<string, { name: string; geckoId: string; decimals: number }> = {
  // SUI native
  "0x2::sui::SUI": { name: "SUI", geckoId: "sui", decimals: 9 },

  // Native USDC (Sui native, issued by Circle)
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC": { name: "USDC", geckoId: "usd-coin", decimals: 6 },

  // Wormhole USDC
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN": { name: "wUSDC", geckoId: "usd-coin", decimals: 6 },

  // Wormhole USDT
  "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN": { name: "wUSDT", geckoId: "tether", decimals: 6 },

  // Native USDT
  "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT": { name: "USDT", geckoId: "tether", decimals: 6 },

  // WETH
  "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN": { name: "WETH", geckoId: "weth", decimals: 8 },

  // NAVX
  "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX": { name: "NAVX", geckoId: "navi", decimals: 9 },

  // CETUS
  "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS": { name: "CETUS", geckoId: "cetus-protocol", decimals: 9 },

  // haSUI
  "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI": { name: "haSUI", geckoId: "sui", decimals: 9 },

  // vSUI
  "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT": { name: "vSUI", geckoId: "sui", decimals: 9 },

  // DEEP
  "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP": { name: "DEEP", geckoId: "deep-book", decimals: 6 },

  // WAL
  "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL": { name: "WAL", geckoId: "walrus-2", decimals: 9 },

  // SCA
  "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA": { name: "SCA", geckoId: "scallop-2", decimals: 9 },
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
  const [historyData, setHistoryData] = useState<{ date: string; value: number }[]>([])

  // Fetch wallet balances via Sui RPC + DeFiLlama prices
  useEffect(() => {
    if (!account?.address) { setWalletTokens([]); return }
    setTokensLoading(true)

async function fetchBalances() {
  try {
    // 1. Get ALL balances from Sui RPC — every coin type
    const balances = await client.getAllBalances({ owner: account?.address || "" })
    console.log("[Portfolio] Total coin types found:", balances.length)

    // 2. Fetch metadata for ALL coin types in one batch
    const metadataResults = await Promise.allSettled(
      balances.map(b => client.getCoinMetadata({ coinType: b.coinType }))
    )

    // 3. Build symbol+decimals map from metadata
    const coinInfo: Record<string, { symbol: string; decimals: number }> = {}
    balances.forEach((b, i) => {
      const result = metadataResults[i]
      if (result.status === "fulfilled" && result.value) {
        coinInfo[b.coinType] = {
          symbol: result.value.symbol || b.coinType.split("::").pop() || "?",
          decimals: result.value.decimals ?? 9,
        }
      } else {
        coinInfo[b.coinType] = {
          symbol: b.coinType.split("::").pop()?.toUpperCase() || "?",
          decimals: 9,
        }
      }
    })

    // 4. Get prices for known tokens from DeFiLlama
    const knownIds = Object.entries(TOKEN_META).map(([_, meta]) => `coingecko:${meta.geckoId}`)
    const uniqueIds = Array.from(new Set(knownIds))
    let livePrices: Record<string, number> = {}
    try {
      const priceRes = await fetch(`https://coins.llama.fi/prices/current/${uniqueIds.join(",")}`)
      const priceData = await priceRes.json()
      for (const [id, info] of Object.entries(priceData.coins || {})) {
        livePrices[id.replace("coingecko:", "")] = (info as any).price || 0
      }
    } catch (e) {
      console.error("[Portfolio] Price fetch failed:", e)
    }

    // 5. Build token list with dust filtering
    const tokens: WalletToken[] = []

    for (const b of balances) {
      const info = coinInfo[b.coinType]
      if (!info) continue

      const knownMeta = TOKEN_META[b.coinType]
      const decimals = knownMeta?.decimals ?? info.decimals
      const balance = Number(BigInt(b.totalBalance)) / Math.pow(10, decimals)

      if (balance < 0.000001) continue

      // Dust filter: unknown tokens need at least 1 whole token to show
      // This kills airdrop spam and useless meme dust
      if (!knownMeta && balance < 1) continue

      const symbol = knownMeta ? knownMeta.name : info.symbol
      const valueUsd = knownMeta ? balance * (livePrices[knownMeta.geckoId] || 0) : 0

      // Known tokens always show. Unknown tokens only show if balance >= 1
      tokens.push({ symbol, coinType: b.coinType, balance, valueUsd })
    }

    // Sort: by USD value descending, unknowns (valueUsd=0) go to bottom
    tokens.sort((a, b) => b.valueUsd - a.valueUsd)
    setWalletTokens(tokens)
    console.log("[Portfolio] Tokens found:", tokens.map(t => `${t.symbol}: $${t.valueUsd.toFixed(2)}`))
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

  const defiTotal = positions.reduce((s, p) => s + p.valueUsd, 0)
  const walletTotal = walletTokens.reduce((s, t) => s + t.valueUsd, 0)
  const totalPortfolio = defiTotal + walletTotal
  const dailyEarnings = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
  const weeklyEarnings = dailyEarnings * 7
  const monthlyEarnings = dailyEarnings * 30
  const yearlyEarnings = dailyEarnings * 365
  const avgApy = positions.length > 0 ? positions.reduce((s, p) => s + p.apy, 0) / positions.length : 0

  const pieData = [
    ...positions.map(p => ({ name: `${p.protocol} ${p.asset}`, value: p.valueUsd, type: "defi" })),
    ...walletTokens.map(t => ({ name: `${t.symbol} (wallet)`, value: t.valueUsd, type: "wallet" })),
  ].filter(d => d.value > 0)

  // Build 30-day history from SUI price + tx history
  useEffect(() => {
    if (!account?.address || walletTokens.length === 0) return

    async function buildHistory() {
      try {
        const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000)
        const priceRes = await fetch(`https://coins.llama.fi/chart/coingecko:sui?start=${thirtyDaysAgo}&span=30&period=1d`)
        const priceData = await priceRes.json()
        const suiPrices: { timestamp: number; price: number }[] = priceData?.coins?.["coingecko:sui"]?.prices || []
        if (suiPrices.length === 0) return

        const txRes = await client.queryTransactionBlocks({
          filter: { FromAddress: account?.address || "" },
          options: { showBalanceChanges: true },
          limit: 100,
          order: "descending"
        })

        const SUI_TYPE = "0x2::sui::SUI"
        const balanceEvents: { timestampMs: number; delta: number }[] = []
        for (const tx of txRes.data || []) {
          const ts = parseInt(tx.timestampMs || "0")
          if (!ts) continue
          for (const change of (tx.balanceChanges || []) as any[]) {
            if (change.coinType === SUI_TYPE && change.owner?.AddressOwner === account?.address) {
              balanceEvents.push({ timestampMs: ts, delta: parseInt(change.amount) / 1e9 })
            }
          }
        }
        balanceEvents.sort((a, b) => a.timestampMs - b.timestampMs)

        const currentSui = walletTokens.find(t => t.symbol === "SUI")?.balance || 0
        const stableValue = walletTokens.filter(t => t.symbol !== "SUI").reduce((s, t) => s + t.valueUsd, 0)
        const now = Date.now()

        const chartData = suiPrices.slice(-30).map(p => {
          const dayTs = p.timestamp * 1000
          const txsAfterDay = balanceEvents.filter(e => e.timestampMs >= dayTs && e.timestampMs <= now)
          const suiAtDay = Math.max(0, currentSui - txsAfterDay.reduce((s, e) => s + e.delta, 0))
          const value = parseFloat(((suiAtDay * p.price) + stableValue + defiTotal).toFixed(2))
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

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
                { icon: DollarSign, label: "Total portfolio", value: `$${fmt(totalPortfolio)}`, sub: "wallet + DeFi", color: "var(--text-primary)" },
                { icon: TrendingUp, label: "In DeFi", value: `$${fmt(defiTotal)}`, sub: positions.length > 0 ? `${positions.length} positions` : "No positions", color: "#4B8BFF" },
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
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Chart */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Portfolio value — last 30 days</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>Reconstructed from your transaction history + SUI price data</div>
                  {historyData.length === 0 ? (
                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading history...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={historyData}>
                        <defs>
                          <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#4B5470" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#4B5470" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} domain={["auto", "auto"]} />
                        <Tooltip formatter={(v: any) => [`$${fmt(Number(v))}`, "Value"]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" stroke="#00D4AA" strokeWidth={2.5} fill="url(#earningsGradient)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Wallet tokens */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Wallet tokens</span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>${fmt(walletTotal)} total</span>
                  </div>
                  {tokensLoading ? (
                    <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>Loading balances...</div>
                  ) : walletTokens.length === 0 ? (
                    <div style={{ padding: 20, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>No tracked tokens in wallet</div>
                  ) : (
                    walletTokens.map((t, i) => (
                      <div key={i}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--border)" }}
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
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
  {t.valueUsd > 0 ? `$${fmt(t.valueUsd)}` : "—"}
</div>
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
                      <div key={i}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid var(--border)" }}
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
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>${fmt(p.valueUsd)}</div>
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
                        <Tooltip formatter={(v: any) => [`$${fmt(Number(v))}`, ""]} contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
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
                    { label: "Today",        value: dailyEarnings > 0   ? `+$${dailyEarnings.toFixed(4)}`   : "—" },
                    { label: "This week",    value: weeklyEarnings > 0  ? `+$${weeklyEarnings.toFixed(3)}`  : "—" },
                    { label: "This month",   value: monthlyEarnings > 0 ? `+$${monthlyEarnings.toFixed(2)}` : "—" },
                    { label: "Yearly (est.)",value: yearlyEarnings > 0  ? `+$${yearlyEarnings.toFixed(0)}`  : "—" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: r.value !== "—" ? "var(--green)" : "var(--text-muted)" }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Tip */}
                <div style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(75,139,255,0.08))", border: "1px solid var(--green-border)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>💡 Tip</div>
                  <div style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 12, lineHeight: 1.6 }}>
                    {avgApy > 0
                      ? `Your positions earn ${avgApy.toFixed(1)}% avg APY. Check the Explore tab for better rates.`
                      : "Deposit to Navi or Scallop to start earning yield on your tokens."}
                  </div>
                  <a href="/app/explore" style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", textDecoration: "none" }}>View opportunities →</a>
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