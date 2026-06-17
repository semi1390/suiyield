"use client"
import { useState, useEffect, useCallback } from "react"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import Navbar from "@/components/Navbar"
import { ArrowDownUp, Settings, Loader2, CheckCircle, AlertCircle, ExternalLink, Zap, ChevronDown, Search, TrendingUp, Shield, BarChart3 } from "lucide-react"

const FALLBACK_TOKENS = [
  { symbol: "SUI",   name: "Sui",         coinType: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",  decimals: 9 },
  { symbol: "USDC",  name: "USD Coin",    coinType: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", decimals: 6 },
  { symbol: "USDT",  name: "Tether",      coinType: "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT", decimals: 6 },
  { symbol: "DEEP",  name: "DeepBook",    coinType: "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP", decimals: 6 },
  { symbol: "WETH",  name: "Wrapped ETH", coinType: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN", decimals: 8 },
  { symbol: "CETUS", name: "Cetus",       coinType: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS", decimals: 9 },
  { symbol: "WAL",   name: "Walrus",      coinType: "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",   decimals: 9 },
  { symbol: "NAVX",  name: "Navi",        coinType: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX", decimals: 9 },
  { symbol: "HASUI", name: "Haedal SUI",  coinType: "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI", decimals: 9 },
  { symbol: "VSUI",  name: "Volo SUI",    coinType: "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT", decimals: 9 },
]

interface Token { symbol: string; name: string; coinType: string; decimals: number }
interface Route { amountOut: number; priceImpact: number; routes: string[] }
interface BestYield { apy: number; protocol: string }
type Status = "idle" | "fetching" | "building" | "signing" | "success" | "error"

function TokenSelector({ selected, tokens, onSelect, label }: {
  selected: Token; tokens: Token[]; onSelect: (t: Token) => void; label: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const filtered = tokens.filter(t =>
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => { setOpen(o => !o); setSearch("") }}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 14px", cursor: "pointer", minWidth: 120, transition: "border-color 0.15s" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,212,170,0.4)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#00D4AA", flexShrink: 0 }}>
          {selected.symbol.slice(0, 2)}
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{selected.symbol}</span>
        <ChevronDown size={12} color="rgba(255,255,255,0.4)" />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />
          <div style={{ position: "absolute", top: "110%", right: 0, zIndex: 9999, background: "#131820", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, width: 260, maxHeight: 380, boxShadow: "0 16px 48px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px 8px", fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{label}</div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px" }}>
                <Search size={12} color="rgba(255,255,255,0.3)" />
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search token..."
                  onClick={e => e.stopPropagation()}
                  style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "#fff", width: "100%" }} />
              </div>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.length === 0
                ? <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>No tokens found</div>
                : filtered.map(t => (
                  <button key={t.coinType} onClick={() => { onSelect(t); setOpen(false); setSearch("") }}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: t.coinType === selected.coinType ? "rgba(0,212,170,0.08)" : "transparent", border: "none", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => { if (t.coinType !== selected.coinType) e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
                    onMouseLeave={e => { if (t.coinType !== selected.coinType) e.currentTarget.style.background = "transparent" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                      {t.symbol.slice(0, 2)}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.coinType === selected.coinType ? "#00D4AA" : "#fff" }}>{t.symbol}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{t.name}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function SwapPage() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [tokens, setTokens] = useState<Token[]>(FALLBACK_TOKENS)
  const [fromToken, setFromToken] = useState(FALLBACK_TOKENS[0])
  const [toToken, setToToken]     = useState(FALLBACK_TOKENS[1])
  const [amountIn, setAmountIn]   = useState("")
  const [route, setRoute]         = useState<Route | null>(null)
  const [bestQuote, setBestQuote] = useState<any>(null)
  const [slippage, setSlippage]   = useState(0.5)
  const [status, setStatus]       = useState<Status>("idle")
  const [txHash, setTxHash]       = useState("")
  const [errorMsg, setErrorMsg]   = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [fromBalance, setFromBalance] = useState(0)
  const [routeError, setRouteError] = useState("")
  const [liveYields, setLiveYields] = useState<Record<string, BestYield>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const amountNum = parseFloat(amountIn) || 0
  const amountInBase = BigInt(Math.floor(amountNum * Math.pow(10, fromToken.decimals)))

  useEffect(() => {
    fetch("/api/tokens").then(r => r.json()).then(data => {
      if (data.tokens?.length > 0) {
        const normalized: Token[] = data.tokens
          .map((t: any) => ({ symbol: (t.symbol ?? t.ticker ?? "").toUpperCase(), name: t.name ?? t.symbol ?? "", coinType: t.coinType ?? t.coin_type ?? t.address ?? "", decimals: Number(t.decimals ?? 9) }))
          .filter((t: Token) => t.symbol && t.coinType)
        const merged = [...FALLBACK_TOKENS]
        for (const t of normalized) { if (!merged.find(f => f.coinType === t.coinType)) merged.push(t) }
        setTokens(merged)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch("/api/live-rates").then(r => r.json()).then(data => {
      if (!data.data?.length) return
      const best: Record<string, BestYield> = {}
      for (const rate of data.data) {
        const sym = rate.symbol?.toUpperCase()
        if (!sym) continue
        const totalApy = (rate.apyBase ?? 0) + (rate.apyReward ?? 0)
        if (!best[sym] || totalApy > best[sym].apy) {
          best[sym] = { apy: totalApy, protocol: rate.protocol === "navi" ? "Navi" : rate.protocol === "scallop" ? "Scallop" : rate.protocol }
        }
      }
      setLiveYields(best)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!account?.address) { setFromBalance(0); return }
    client.getBalance({ owner: account.address, coinType: fromToken.coinType })
      .then(bal => setFromBalance(Number(BigInt(bal.totalBalance)) / Math.pow(10, fromToken.decimals)))
      .catch(() => setFromBalance(0))
  }, [account?.address, fromToken.coinType, client])

  const fetchRoute = useCallback(async () => {
    if (amountNum <= 0 || fromToken.coinType === toToken.coinType) { setRoute(null); setBestQuote(null); return }
    setStatus("fetching"); setRoute(null); setBestQuote(null); setRouteError("")
    try {
      const res = await fetch(`/api/swap-quote?from=${encodeURIComponent(fromToken.coinType)}&to=${encodeURIComponent(toToken.coinType)}&amount=${amountInBase.toString()}`)
      const data = await res.json()
      if (!res.ok || data.error) { setRouteError(data.error ?? "Route fetch failed"); setStatus("idle"); return }
      const result = data.result
      if (!result) { setRouteError("No route found for this pair"); setStatus("idle"); return }
      const amountOut = Number(result.amount_out ?? 0) / Math.pow(10, toToken.decimals)
      const priceImpact = parseFloat(result.quote?.quote?.deviationRatio ?? "0") * 100
      const routePaths: string[] = []
      for (const p of result.quote?.quote?.paths ?? []) {
        const provider = p.provider ?? ""
        if (provider && !routePaths.includes(provider)) routePaths.push(provider)
      }
      if (routePaths.length === 0) routePaths.push("Cetus")
      setBestQuote(result.quote); setRoute({ amountOut, priceImpact, routes: routePaths }); setStatus("idle")
    } catch (err: any) { setRouteError(err?.message?.slice(0, 120) ?? "Route fetch failed"); setStatus("idle") }
  }, [amountNum, fromToken.coinType, toToken.coinType, amountInBase])

  useEffect(() => { const t = setTimeout(fetchRoute, 700); return () => clearTimeout(t) }, [fetchRoute])

  function flipTokens() { setFromToken(toToken); setToToken(fromToken); setAmountIn(""); setRoute(null); setBestQuote(null); setRouteError("") }

  async function handleSwap() {
    if (!account?.address || !route || amountNum <= 0) return
    setStatus("building"); setErrorMsg("")
    try {
      const minAmountOut = BigInt(Math.floor(route.amountOut * Math.pow(10, toToken.decimals) * (1 - slippage / 100)))
      const res = await fetch("/api/swap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: account.address, fromCoin: fromToken.coinType, toCoin: toToken.coinType, amountIn: amountInBase.toString(), minAmountOut: minAmountOut.toString(), quote: bestQuote }) })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to build swap")
      setStatus("signing")
      const txBytes = Uint8Array.from(Buffer.from(data.txBase64, "base64"))
      const result = await signAndExecute({ transaction: Transaction.from(txBytes) as any })
      setTxHash(result.digest); setStatus("success")
    } catch (err: any) { setErrorMsg(err?.message?.slice(0, 200) ?? "Swap failed"); setStatus("error") }
  }

  const bestYield = liveYields[toToken.symbol] ?? null
  const fmt = (n: number, d = 4) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: d })
  const insufficientBalance = amountNum > fromBalance && fromBalance > 0 && account !== null

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8 }}>Swap</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Best rates across Sui — powered by Cetus aggregator</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 440px 1fr", gap: 24, alignItems: "start" }} className="swap-grid">

          {/* Left panel — why swap here */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: mounted ? 1 : 0, transform: mounted ? "translateX(0)" : "translateX(-20px)", transition: "all 0.6s ease 0.1s" }} className="swap-left">
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Why swap here</div>
              {[
                { icon: TrendingUp, title: "Best route", desc: "Cetus aggregator finds the optimal path across all Sui DEXes automatically." },
                { icon: Shield,     title: "Non-custodial", desc: "Your transaction goes directly on-chain. We never hold your tokens." },
                { icon: Zap,        title: "Instant settlement", desc: "Sui's parallel execution means sub-second finality on every swap." },
                { icon: BarChart3,  title: "Then earn", desc: "After swapping, deposit to Navi or Scallop to put your tokens to work." },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 3 ? 16 : 0, paddingBottom: i < 3 ? 16 : 0, borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <f.icon size={14} style={{ color: "#00D4AA" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center — swap card */}
         <div className="swap-center" style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease 0.2s" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 24, backdropFilter: "blur(20px)" }}>

              {/* Settings */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button onClick={() => setShowSettings(s => !s)}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: showSettings ? "rgba(0,212,170,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${showSettings ? "rgba(0,212,170,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: showSettings ? "#00D4AA" : "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <Settings size={11} />
                  {slippage}% slippage
                </button>
              </div>

              {showSettings && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, marginBottom: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 10, fontWeight: 600 }}>Slippage tolerance</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[0.1, 0.5, 1.0, 2.0].map(s => (
                      <button key={s} onClick={() => setSlippage(s)}
                        style={{ flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${slippage === s ? "#00D4AA" : "rgba(255,255,255,0.08)"}`, background: slippage === s ? "rgba(0,212,170,0.1)" : "transparent", color: slippage === s ? "#00D4AA" : "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                        {s}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* FROM */}
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "16px 18px", marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>You pay</span>
                  {account && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                        Balance: <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{fmt(fromBalance, 4)} {fromToken.symbol}</span>
                      </span>
                      <button onClick={() => setAmountIn(fromBalance.toFixed(Math.min(fromToken.decimals, 6)))}
                        style={{ fontSize: 10, color: "#00D4AA", background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 4, padding: "2px 7px", cursor: "pointer", fontWeight: 700 }}>
                        MAX
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input type="number" value={amountIn}
                    onChange={e => { setAmountIn(e.target.value); setRoute(null); setBestQuote(null) }}
                    placeholder="0.00"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 32, fontWeight: 700, color: insufficientBalance ? "#EF4444" : "#fff", minWidth: 0 }} />
                  <TokenSelector selected={fromToken} tokens={tokens.filter(t => t.coinType !== toToken.coinType)} onSelect={t => { setFromToken(t); setRoute(null); setBestQuote(null); setRouteError("") }} label="Sell" />
                </div>
                {insufficientBalance && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 8 }}>Insufficient balance</div>}
              </div>

              {/* Flip */}
              <div style={{ display: "flex", justifyContent: "center", margin: "4px 0", position: "relative", zIndex: 1 }}>
                <button onClick={flipTokens}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#00D4AA"; e.currentTarget.style.background = "rgba(0,212,170,0.08)" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}>
                  <ArrowDownUp size={14} color="rgba(255,255,255,0.5)" />
                </button>
              </div>

              {/* TO */}
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "16px 18px", marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>You receive (est.)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, fontSize: 32, fontWeight: 700, color: status === "fetching" ? "rgba(255,255,255,0.3)" : route ? "#00D4AA" : "rgba(255,255,255,0.3)" }}>
                    {status === "fetching"
                      ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "rgba(255,255,255,0.3)" }} /><span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Finding best rate...</span></div>
                      : route ? fmt(route.amountOut) : "0.00"}
                  </div>
                  <TokenSelector selected={toToken} tokens={tokens.filter(t => t.coinType !== fromToken.coinType)} onSelect={t => { setToToken(t); setRoute(null); setBestQuote(null); setRouteError("") }} label="Buy" />
                </div>
              </div>

              {/* Route details */}
              {route && status !== "fetching" && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, border: "1px solid rgba(255,255,255,0.05)", animation: "fadeIn 0.3s ease" }}>
                  {[
                    ["Rate", `1 ${fromToken.symbol} ≈ ${amountNum > 0 ? (route.amountOut / amountNum).toFixed(4) : "0"} ${toToken.symbol}`],
                    ["Price impact", null],
                    ["Min received", `${fmt(route.amountOut * (1 - slippage / 100))} ${toToken.symbol}`],
                    ["Route", null],
                  ].map(([label], i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < 3 ? 10 : 0 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{label}</span>
                      {i === 0 && <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>1 {fromToken.symbol} ≈ {amountNum > 0 ? (route.amountOut / amountNum).toFixed(4) : "0"} {toToken.symbol}</span>}
                      {i === 1 && <span style={{ fontSize: 12, fontWeight: 600, color: route.priceImpact > 2 ? "#EF4444" : route.priceImpact > 0.5 ? "#F5A623" : "#00D4AA" }}>{route.priceImpact.toFixed(2)}%</span>}
                      {i === 2 && <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>{fmt(route.amountOut * (1 - slippage / 100))} {toToken.symbol}</span>}
                      {i === 3 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, background: "rgba(6,182,212,0.12)", color: "#06B6D4", borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>Cetus</span>
                          {route.routes.slice(0, 2).map((r, j) => (
                            <span key={j} style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>· {r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {routeError && amountNum > 0 && (
                <div style={{ fontSize: 12, color: "#F5A623", marginBottom: 14, textAlign: "center", padding: "10px 14px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 10 }}>⚠ {routeError}</div>
              )}

              {status === "error" && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                  <AlertCircle size={14} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12, color: "#EF4444" }}>{errorMsg}</span>
                </div>
              )}

              {status === "success" ? (
                <div style={{ textAlign: "center", padding: "12px 0", animation: "fadeIn 0.4s ease" }}>
                  <CheckCircle size={48} style={{ color: "#00D4AA", margin: "0 auto 14px", display: "block" }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Swap successful!</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{fmt(amountNum)} {fromToken.symbol} → {fmt(route?.amountOut ?? 0)} {toToken.symbol}</div>
                  {txHash && (
                    <a href={`https://suiscan.xyz/mainnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#00D4AA", textDecoration: "none", marginBottom: 18 }}>
                      View on Suiscan <ExternalLink size={11} />
                    </a>
                  )}
                  <button onClick={() => { setStatus("idle"); setAmountIn(""); setRoute(null); setBestQuote(null); setTxHash("") }}
                    style={{ width: "100%", padding: 14, borderRadius: 12, background: "#00D4AA", color: "#000", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
                    Swap again
                  </button>
                </div>
              ) : !account ? (
                <div style={{ textAlign: "center", padding: 16, fontSize: 13, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                  Connect wallet to swap
                </div>
              ) : (
                <button onClick={handleSwap}
                  disabled={!route || amountNum <= 0 || insufficientBalance || status === "building" || status === "signing" || status === "fetching"}
                  style={{ width: "100%", padding: 15, borderRadius: 12, background: route && amountNum > 0 && !insufficientBalance ? "#00D4AA" : "rgba(255,255,255,0.05)", color: route && amountNum > 0 && !insufficientBalance ? "#000" : "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 700, border: "none", cursor: route && amountNum > 0 && !insufficientBalance ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
                  {(status === "building" || status === "signing") && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                  {insufficientBalance ? `Insufficient ${fromToken.symbol}` :
                   status === "fetching" ? "Getting best route..." :
                   status === "building" ? "Building transaction..." :
                   status === "signing" ? "Check your wallet..." :
                   !route && amountNum > 0 ? "No route found" :
                   amountNum <= 0 ? "Enter an amount" :
                   `Swap ${fromToken.symbol} → ${toToken.symbol}`}
                </button>
              )}
            </div>
          </div>

          {/* Right panel — earn after swap */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: mounted ? 1 : 0, transform: mounted ? "translateX(0)" : "translateX(20px)", transition: "all 0.6s ease 0.3s" }} className="swap-right">
            {bestYield && route && amountNum > 0 && (
              <div style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.06), rgba(75,139,255,0.04))", border: "1px solid rgba(0,212,170,0.15)", borderRadius: 16, padding: 20, animation: "fadeIn 0.4s ease" }}>
                <div style={{ fontSize: 11, color: "#00D4AA", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>After this swap</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Earn {bestYield.apy.toFixed(2)}% APY</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 16 }}>
                  Deposit your {toToken.symbol} to {bestYield.protocol} — the best rate on Sui right now.
                </div>
                <a href="/app" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#00D4AA", textDecoration: "none" }}>
                  View yield opportunities <ExternalLink size={11} />
                </a>
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Top lending rates</div>
              {[
                { asset: "DEEP", apy: "18.26%", protocol: "Kai Finance" },
                { asset: "EEARN", apy: "17.52%", protocol: "Current" },
                { asset: "NS", apy: "16.22%", protocol: "Navi" },
                { asset: "DEEP", apy: "14.43%", protocol: "Navi" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{r.asset}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{r.protocol}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#00D4AA" }}>{r.apy}</div>
                </div>
              ))}
              <a href="/app/explore" style={{ display: "block", textAlign: "center", marginTop: 14, fontSize: 12, fontWeight: 600, color: "#00D4AA", textDecoration: "none", padding: "8px", background: "rgba(0,212,170,0.06)", borderRadius: 8, border: "1px solid rgba(0,212,170,0.12)" }}>
                See all pools →
              </a>
            </div>
          </div>
        </div>
      </div>

<style suppressHydrationWarning>{`
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 900px) {
    .swap-grid {
      grid-template-columns: 1fr !important;
    }
    .swap-left {
      display: none !important;
    }
    .swap-right {
      display: none !important;
    }
    .swap-center {
      max-width: 480px;
      margin: 0 auto;
      width: 100%;
    }
  }
`}</style>
    </div>
  )
}