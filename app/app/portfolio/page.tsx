"use client"
import { useState, useEffect } from "react"
import { useCurrentAccount, useSuiClient } from "@mysten/dapp-kit"
import Navbar from "@/components/Navbar"
import PositionsFetcher from "@/components/PositionsFetcher"
import type { RealPosition } from "@/lib/positions"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts"
import { Wallet, TrendingUp, DollarSign, Calendar, Zap } from "lucide-react"

const COLORS = ["#00D4AA", "#4B8BFF", "#F5A623", "#EC4899", "#8B5CF6", "#06B6D4", "#F97316"]

const TOKEN_META: Record<string, { name: string; geckoId: string; decimals: number }> = {
  "0x2::sui::SUI": { name: "SUI", geckoId: "sui", decimals: 9 },
  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC": { name: "USDC", geckoId: "usd-coin", decimals: 6 },
  "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN": { name: "wUSDC", geckoId: "usd-coin", decimals: 6 },
  "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN": { name: "wUSDT", geckoId: "tether", decimals: 6 },
  "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT": { name: "USDT", geckoId: "tether", decimals: 6 },
  "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN": { name: "WETH", geckoId: "weth", decimals: 8 },
  "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX": { name: "NAVX", geckoId: "navi", decimals: 9 },
  "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS": { name: "CETUS", geckoId: "cetus-protocol", decimals: 9 },
  "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI": { name: "haSUI", geckoId: "sui", decimals: 9 },
  "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT": { name: "vSUI", geckoId: "sui", decimals: 9 },
  "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP": { name: "DEEP", geckoId: "deep-book", decimals: 6 },
  "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL": { name: "WAL", geckoId: "walrus-2", decimals: 9 },
  "0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA": { name: "SCA", geckoId: "scallop-2", decimals: 9 },
}

interface WalletToken { symbol: string; coinType: string; balance: number; valueUsd: number }

export default function PortfolioPage() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const [positions, setPositions] = useState<RealPosition[]>([])
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)
  const [historyData, setHistoryData] = useState<{ date: string; value: number }[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!account?.address) { setWalletTokens([]); return }
    setTokensLoading(true)
    async function fetchBalances() {
      try {
        const balances = await client.getAllBalances({ owner: account?.address || "" })
        const metadataResults = await Promise.allSettled(
          balances.map(b => client.getCoinMetadata({ coinType: b.coinType }))
        )
        const coinInfo: Record<string, { symbol: string; decimals: number }> = {}
        balances.forEach((b, i) => {
          const result = metadataResults[i]
          if (result.status === "fulfilled" && result.value) {
            coinInfo[b.coinType] = { symbol: result.value.symbol || b.coinType.split("::").pop() || "?", decimals: result.value.decimals ?? 9 }
          } else {
            coinInfo[b.coinType] = { symbol: b.coinType.split("::").pop()?.toUpperCase() || "?", decimals: 9 }
          }
        })
        const knownIds = Object.entries(TOKEN_META).map(([_, meta]) => `coingecko:${meta.geckoId}`)
        let livePrices: Record<string, number> = {}
        try {
          const priceRes = await fetch(`https://coins.llama.fi/prices/current/${Array.from(new Set(knownIds)).join(",")}`)
          const priceData = await priceRes.json()
          for (const [id, info] of Object.entries(priceData.coins || {})) {
            livePrices[id.replace("coingecko:", "")] = (info as any).price || 0
          }
        } catch {}
        const tokens: WalletToken[] = []
        for (const b of balances) {
          const info = coinInfo[b.coinType]
          if (!info) continue
          const knownMeta = TOKEN_META[b.coinType]
          const decimals = knownMeta?.decimals ?? info.decimals
          const balance = Number(BigInt(b.totalBalance)) / Math.pow(10, decimals)
          if (balance < 0.000001) continue
          if (!knownMeta && balance < 1) continue
          const symbol = knownMeta ? knownMeta.name : info.symbol
          const valueUsd = knownMeta ? balance * (livePrices[knownMeta.geckoId] || 0) : 0
          tokens.push({ symbol, coinType: b.coinType, balance, valueUsd })
        }
        tokens.sort((a, b) => b.valueUsd - a.valueUsd)
        setWalletTokens(tokens)
      } catch {} finally { setTokensLoading(false) }
    }
    fetchBalances()
  }, [account?.address, client])

  const handlePositions = (p: RealPosition[], loading: boolean) => { if (!loading) setPositions(p) }

  const defiTotal = positions.reduce((s, p) => s + p.valueUsd, 0)
  const walletTotal = walletTokens.reduce((s, t) => s + t.valueUsd, 0)
  const totalPortfolio = defiTotal + walletTotal
  const dailyEarnings = positions.reduce((s, p) => s + (p.valueUsd * p.apy) / 100 / 365, 0)
  const avgApy = positions.length > 0 ? positions.reduce((s, p) => s + p.apy, 0) / positions.length : 0

  const pieData = [
    ...positions.map(p => ({ name: `${p.protocol} ${p.asset}`, value: p.valueUsd })),
    ...walletTokens.map(t => ({ name: `${t.symbol} (wallet)`, value: t.valueUsd })),
  ].filter(d => d.value > 0)

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
          limit: 100, order: "descending"
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
          return {
            date: new Date(dayTs).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: parseFloat(((suiAtDay * p.price) + stableValue + defiTotal).toFixed(2))
          }
        })
        setHistoryData(chartData)
      } catch {}
    }
    buildHistory()
  }, [account?.address, walletTokens, defiTotal])

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 } as const

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A" }}>
      <Navbar />
      {account?.address && <PositionsFetcher walletAddress={account.address} onPositions={handlePositions} />}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 6 }}>Portfolio</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Your complete Sui DeFi portfolio — wallet balances and active positions</p>
        </div>

        {!account ? (
          <div style={{ ...card, padding: "80px 24px", textAlign: "center" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Wallet size={26} style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10 }}>Connect your wallet</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
              Connect to see your token balances, DeFi positions and projected earnings.
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }} className="portfolio-stats">
              {[
                { icon: DollarSign, label: "Total portfolio", value: `$${fmt(totalPortfolio)}`, sub: "wallet + DeFi" },
                { icon: TrendingUp, label: "In DeFi",         value: `$${fmt(defiTotal)}`,      sub: positions.length > 0 ? `${positions.length} positions` : "No positions" },
                { icon: Zap,        label: "Avg APY",         value: avgApy > 0 ? `${avgApy.toFixed(2)}%` : "—", sub: "on DeFi positions" },
                { icon: Calendar,   label: "Daily earnings",  value: dailyEarnings > 0 ? `+$${dailyEarnings.toFixed(4)}` : "—", sub: "at current rates" },
              ].map((s, i) => (
                <div key={i} style={{ ...card, padding: 16, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)", transition: `all 0.5s ease ${i * 0.08}s` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <s.icon size={12} style={{ color: "#00D4AA" }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: "-0.02em" }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} className="portfolio-grid">

              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Chart */}
                <div style={{ ...card, padding: 24 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Portfolio value — last 30 days</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Reconstructed from transaction history + SUI price data</div>
                  {historyData.length === 0 ? (
                    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading history...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={historyData}>
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.25)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} domain={["auto","auto"]} />
                        <Tooltip formatter={(v: any) => [`$${fmt(Number(v))}`, "Value"]} contentStyle={{ background: "#131820", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                        <Area type="monotone" dataKey="value" stroke="#00D4AA" strokeWidth={2.5} fill="url(#chartGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Wallet tokens */}
                <div style={{ ...card, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Wallet tokens</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>${fmt(walletTotal)} total</span>
                  </div>
                  {tokensLoading ? (
                    <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Loading balances...</div>
                  ) : walletTokens.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No tracked tokens in wallet</div>
                  ) : walletTokens.map((t, i) => (
                    <div key={i}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                          {t.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.symbol}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.balance.toLocaleString("en-US", { maximumFractionDigits: 4 })} tokens</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.valueUsd > 0 ? `$${fmt(t.valueUsd)}` : "—"}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{totalPortfolio > 0 ? ((t.valueUsd / totalPortfolio) * 100).toFixed(1) : 0}%</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DeFi positions */}
                {positions.length > 0 && (
                  <div style={{ ...card, overflow: "hidden" }}>
                    <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>DeFi positions</span>
                      <span style={{ fontSize: 12, color: "#00D4AA" }}>+${dailyEarnings.toFixed(4)}/day</span>
                    </div>
                    {positions.map((p, i) => (
                      <div key={i}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: p.color + "20", border: `1px solid ${p.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: p.color }}>
                            {p.initials}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{p.protocol}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{p.asset} · {p.apy.toFixed(2)}% APY</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>${fmt(p.valueUsd)}</div>
                          <div style={{ fontSize: 11, color: "#00D4AA" }}>+${((p.valueUsd * p.apy) / 100 / 365).toFixed(4)}/day</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="portfolio-right">

                {/* Allocation pie */}
                {pieData.length > 0 && (
                  <div style={{ ...card, padding: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 20 }}>Allocation</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => [`$${fmt(Number(v))}`, ""]} contentStyle={{ background: "#131820", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                      {pieData.slice(0, 6).map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                          </div>
                          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
                            {totalPortfolio > 0 ? ((d.value / totalPortfolio) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Earnings */}
                <div style={{ ...card, padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Earnings summary</div>
                  {[
                    { label: "Today",         value: dailyEarnings > 0             ? `+$${dailyEarnings.toFixed(4)}`         : "—" },
                    { label: "This week",     value: dailyEarnings * 7 > 0         ? `+$${(dailyEarnings * 7).toFixed(3)}`   : "—" },
                    { label: "This month",    value: dailyEarnings * 30 > 0        ? `+$${(dailyEarnings * 30).toFixed(2)}`  : "—" },
                    { label: "Yearly (est.)", value: dailyEarnings * 365 > 0       ? `+$${(dailyEarnings * 365).toFixed(0)}` : "—" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{r.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: r.value !== "—" ? "#00D4AA" : "rgba(255,255,255,0.3)" }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Tip */}
                <div style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 16, padding: 20 }}>
                  <div style={{ fontSize: 11, color: "#00D4AA", fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>💡 Tip</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 14, lineHeight: 1.6 }}>
                    {avgApy > 0
                      ? `Your positions earn ${avgApy.toFixed(1)}% avg APY. Check the Explore tab for better rates.`
                      : "Deposit to Navi or Scallop to start earning yield on your tokens."}
                  </div>
                  <a href="/app/explore" style={{ fontSize: 13, fontWeight: 700, color: "#00D4AA", textDecoration: "none" }}>View opportunities →</a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style suppressHydrationWarning>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) {
          .portfolio-stats { grid-template-columns: repeat(4, 1fr) !important; }
          .portfolio-grid { grid-template-columns: 1fr 340px !important; }
          .portfolio-right { grid-column: 2; grid-row: 1; }
        }
      `}</style>
    </div>
  )
}