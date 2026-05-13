"use client"
import { useState, useEffect, useCallback } from "react"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import Navbar from "@/components/Navbar"
import { ArrowDownUp, Settings, Loader2, CheckCircle, AlertCircle, ExternalLink, Zap, ChevronDown, Search } from "lucide-react"

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
        style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", minWidth: 120 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--green-bg)", border: "1px solid var(--green-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "var(--green)", flexShrink: 0 }}>
          {selected.symbol.slice(0, 2)}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{selected.symbol}</span>
        <ChevronDown size={12} color="var(--text-muted)" />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9998 }} />
          <div style={{ position: "absolute", top: "110%", right: 0, zIndex: 9999, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, width: 240, maxHeight: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 12px 8px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>
              {label}
            </div>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-elevated)", borderRadius: 8, padding: "6px 10px" }}>
                <Search size={12} color="var(--text-muted)" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search token..."
                  onClick={e => e.stopPropagation()}
                  style={{ background: "none", border: "none", outline: "none", fontSize: 12, color: "var(--text-primary)", width: "100%" }}
                />
              </div>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>No tokens found</div>
              ) : (
                filtered.map(t => (
                  <button key={t.coinType} onClick={() => { onSelect(t); setOpen(false); setSearch("") }}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: t.coinType === selected.coinType ? "var(--green-bg)" : "transparent", border: "none", cursor: "pointer" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0 }}>
                      {t.symbol.slice(0, 2)}
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: t.coinType === selected.coinType ? "var(--green)" : "var(--text-primary)" }}>{t.symbol}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.name}</div>
                    </div>
                  </button>
                ))
              )}
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

  const amountNum = parseFloat(amountIn) || 0
  const amountInBase = BigInt(Math.floor(amountNum * Math.pow(10, fromToken.decimals)))

  // Load dynamic token list
  useEffect(() => {
    fetch("/api/tokens")
      .then(r => r.json())
      .then(data => {
        if (data.tokens?.length > 0) {
          const normalized: Token[] = data.tokens
            .map((t: any) => ({
              symbol: (t.symbol ?? t.ticker ?? "").toUpperCase(),
              name: t.name ?? t.symbol ?? "",
              coinType: t.coinType ?? t.coin_type ?? t.address ?? "",
              decimals: Number(t.decimals ?? 9),
            }))
            .filter((t: Token) => t.symbol && t.coinType)
          const merged = [...FALLBACK_TOKENS]
          for (const t of normalized) {
            if (!merged.find(f => f.coinType === t.coinType)) merged.push(t)
          }
          setTokens(merged)
        }
      })
      .catch(() => {})
  }, [])

  // Load live yields for post-swap suggestion
  useEffect(() => {
    fetch("/api/live-rates")
      .then(r => r.json())
      .then(data => {
        if (!data.data?.length) return
        const best: Record<string, BestYield> = {}
        for (const rate of data.data) {
          const sym = rate.symbol?.toUpperCase()
          if (!sym) continue
          const totalApy = (rate.apyBase ?? 0) + (rate.apyReward ?? 0)
          if (!best[sym] || totalApy > best[sym].apy) {
            best[sym] = {
              apy: totalApy,
              protocol: rate.protocol === "navi" ? "Navi" : rate.protocol === "scallop" ? "Scallop" : rate.protocol,
            }
          }
        }
        setLiveYields(best)
      })
      .catch(() => {})
  }, [])

  // Fetch wallet balance
  useEffect(() => {
    if (!account?.address) { setFromBalance(0); return }
    client.getBalance({ owner: account.address, coinType: fromToken.coinType })
      .then(bal => setFromBalance(Number(BigInt(bal.totalBalance)) / Math.pow(10, fromToken.decimals)))
      .catch(() => setFromBalance(0))
  }, [account?.address, fromToken.coinType, client])

  // Fetch route quote with debounce
  const fetchRoute = useCallback(async () => {
    if (amountNum <= 0 || fromToken.coinType === toToken.coinType) {
      setRoute(null)
      setBestQuote(null)
      return
    }
    setStatus("fetching")
    setRoute(null)
    setBestQuote(null)
    setRouteError("")
    try {
      const res = await fetch(
        `/api/swap-quote?from=${encodeURIComponent(fromToken.coinType)}&to=${encodeURIComponent(toToken.coinType)}&amount=${amountInBase.toString()}`
      )
      const data = await res.json()

      if (!res.ok || data.error) {
        setRouteError(data.error ?? "Route fetch failed")
        setStatus("idle")
        return
      }

      const result = data.result
      if (!result) { setRouteError("No route found for this pair"); setStatus("idle"); return }

      // Parse Cetus MetaAg response
      const amountOut = Number(result.amount_out ?? 0) / Math.pow(10, toToken.decimals)
      const deviationRatio = result.quote?.quote?.deviationRatio ?? "0"
      const priceImpact = parseFloat(deviationRatio) * 100

      // Extract route providers from paths
      const routePaths: string[] = []
      const paths = result.quote?.quote?.paths ?? []
      for (const p of paths) {
        const provider = p.provider ?? ""
        if (provider && !routePaths.includes(provider)) routePaths.push(provider)
      }
      if (routePaths.length === 0) routePaths.push("Cetus")

      setBestQuote(result.quote)
      setRoute({ amountOut, priceImpact, routes: routePaths })
      setStatus("idle")
    } catch (err: any) {
      console.error("[swap] route error:", err)
      setRouteError(err?.message?.slice(0, 120) ?? "Route fetch failed")
      setStatus("idle")
    }
  }, [amountNum, fromToken.coinType, toToken.coinType, amountInBase])

  useEffect(() => {
    const timer = setTimeout(fetchRoute, 700)
    return () => clearTimeout(timer)
  }, [fetchRoute])

  function flipTokens() {
    setFromToken(toToken)
    setToToken(fromToken)
    setAmountIn("")
    setRoute(null)
    setBestQuote(null)
    setRouteError("")
  }

  async function handleSwap() {
    if (!account?.address || !route || amountNum <= 0) return
    setStatus("building")
    setErrorMsg("")
    try {
      const minAmountOut = BigInt(Math.floor(
        route.amountOut * Math.pow(10, toToken.decimals) * (1 - slippage / 100)
      ))
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: account.address,
          fromCoin: fromToken.coinType,
          toCoin: toToken.coinType,
          amountIn: amountInBase.toString(),
          minAmountOut: minAmountOut.toString(),
          quote: bestQuote,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed to build swap")
      setStatus("signing")
      const txBytes = Uint8Array.from(Buffer.from(data.txBase64, "base64"))
      const result = await signAndExecute({ transaction: Transaction.from(txBytes) as any })
      setTxHash(result.digest)
      setStatus("success")
    } catch (err: any) {
      console.error("[swap] error:", err)
      setErrorMsg(err?.message?.slice(0, 200) ?? "Swap failed")
      setStatus("error")
    }
  }

  const bestYield = liveYields[toToken.symbol] ?? null
  const fmt = (n: number, d = 4) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: d })
  const insufficientBalance = amountNum > fromBalance && fromBalance > 0 && account !== null

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 16px" }}>

        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Swap</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Best rates across Sui — powered by Cetus</p>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>

          {/* Settings */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button onClick={() => setShowSettings(s => !s)}
              style={{ display: "flex", alignItems: "center", gap: 5, background: showSettings ? "var(--green-bg)" : "var(--bg-elevated)", border: `1px solid ${showSettings ? "var(--green-border)" : "var(--border)"}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, color: showSettings ? "var(--green)" : "var(--text-muted)", cursor: "pointer" }}>
              <Settings size={11} />
              {slippage}% slippage
            </button>
          </div>

          {showSettings && (
            <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, fontWeight: 600 }}>Slippage tolerance</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0.1, 0.5, 1.0, 2.0].map(s => (
                  <button key={s} onClick={() => setSlippage(s)}
                    style={{ flex: 1, padding: "6px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${slippage === s ? "var(--green)" : "var(--border)"}`, background: slippage === s ? "var(--green-bg)" : "transparent", color: slippage === s ? "var(--green)" : "var(--text-muted)", cursor: "pointer" }}>
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FROM */}
          <div style={{ background: "var(--bg-elevated)", borderRadius: 14, padding: "14px 16px", marginBottom: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>You pay</span>
              {account && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Balance: <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{fmt(fromBalance, 4)} {fromToken.symbol}</span>
                  </span>
                  <button onClick={() => setAmountIn(fromBalance.toFixed(Math.min(fromToken.decimals, 6)))}
                    style={{ fontSize: 10, color: "var(--green)", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 4, padding: "1px 6px", cursor: "pointer", fontWeight: 600 }}>
                    MAX
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                value={amountIn}
                onChange={e => { setAmountIn(e.target.value); setRoute(null); setBestQuote(null) }}
                placeholder="0.00"
                style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 28, fontWeight: 700, color: insufficientBalance ? "#EF4444" : "var(--text-primary)", minWidth: 0 }}
              />
              <TokenSelector
                selected={fromToken}
                tokens={tokens.filter(t => t.coinType !== toToken.coinType)}
                onSelect={t => { setFromToken(t); setRoute(null); setBestQuote(null); setRouteError("") }}
                label="Sell"
              />
            </div>
            {insufficientBalance && (
              <div style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>Insufficient balance</div>
            )}
          </div>

          {/* Flip */}
          <div style={{ display: "flex", justifyContent: "center", margin: "2px 0", position: "relative", zIndex: 1 }}>
            <button onClick={flipTokens}
              style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--green)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
              <ArrowDownUp size={14} color="var(--text-muted)" />
            </button>
          </div>

          {/* TO */}
          <div style={{ background: "var(--bg-elevated)", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10 }}>You receive (est.)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, fontSize: 28, fontWeight: 700, color: status === "fetching" ? "var(--text-muted)" : route ? "var(--green)" : "var(--text-primary)" }}>
                {status === "fetching" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 14, color: "var(--text-muted)" }}>Getting best rate...</span>
                  </div>
                ) : route ? fmt(route.amountOut) : "0.00"}
              </div>
              <TokenSelector
                selected={toToken}
                tokens={tokens.filter(t => t.coinType !== fromToken.coinType)}
                onSelect={t => { setToToken(t); setRoute(null); setBestQuote(null); setRouteError("") }}
                label="Buy"
              />
            </div>
          </div>

          {/* Route details */}
          {route && status !== "fetching" && (
            <div style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Rate</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                  1 {fromToken.symbol} ≈ {amountNum > 0 ? (route.amountOut / amountNum).toFixed(4) : "0"} {toToken.symbol}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Price impact</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: route.priceImpact > 2 ? "#EF4444" : route.priceImpact > 0.5 ? "#F5A623" : "var(--green)" }}>
                  {route.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Min received</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                  {fmt(route.amountOut * (1 - slippage / 100))} {toToken.symbol}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Route</span>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 10, background: "rgba(6,182,212,0.12)", color: "#06B6D4", borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>Cetus</span>
                  {route.routes.slice(0, 3).map((r, i) => (
                    <span key={i} style={{ fontSize: 11, color: "var(--text-muted)" }}>· {r}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Route error */}
          {routeError && amountNum > 0 && (
            <div style={{ fontSize: 12, color: "#F5A623", marginBottom: 12, textAlign: "center", padding: "8px 12px", background: "rgba(245,166,35,0.08)", borderRadius: 8 }}>
              ⚠ {routeError}
            </div>
          )}

          {/* Swap error */}
          {status === "error" && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <AlertCircle size={14} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: "#EF4444" }}>{errorMsg}</span>
            </div>
          )}

          {/* Success */}
          {status === "success" ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <CheckCircle size={44} style={{ color: "var(--green)", margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Swap successful!</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
                {fmt(amountNum)} {fromToken.symbol} → {fmt(route?.amountOut ?? 0)} {toToken.symbol}
              </div>
              {txHash && (
                <a href={`https://suiscan.xyz/mainnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--green)", textDecoration: "none", marginBottom: 16 }}>
                  View on Suiscan <ExternalLink size={11} />
                </a>
              )}
              <button onClick={() => { setStatus("idle"); setAmountIn(""); setRoute(null); setBestQuote(null); setTxHash("") }}
                style={{ width: "100%", padding: 12, borderRadius: 10, background: "var(--green)", color: "#000", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
                Swap again
              </button>
            </div>

          ) : !account ? (
            <div style={{ textAlign: "center", padding: 14, fontSize: 13, color: "var(--text-muted)", background: "var(--bg-elevated)", borderRadius: 12 }}>
              Connect wallet to swap
            </div>

          ) : (
            <button
              onClick={handleSwap}
              disabled={!route || amountNum <= 0 || insufficientBalance || status === "building" || status === "signing" || status === "fetching"}
              style={{
                width: "100%", padding: 14, borderRadius: 12,
                background: route && amountNum > 0 && !insufficientBalance ? "var(--green)" : "var(--bg-elevated)",
                color: route && amountNum > 0 && !insufficientBalance ? "#000" : "var(--text-muted)",
                fontSize: 15, fontWeight: 700, border: "none",
                cursor: route && amountNum > 0 && !insufficientBalance ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}>
              {(status === "building" || status === "signing") && (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              )}
              {insufficientBalance        ? `Insufficient ${fromToken.symbol}` :
               status === "fetching"      ? "Getting best route..." :
               status === "building"      ? "Building transaction..." :
               status === "signing"       ? "Check your wallet..." :
               !route && amountNum > 0    ? "No route found" :
               amountNum <= 0            ? "Enter an amount" :
               `Swap ${fromToken.symbol} → ${toToken.symbol}`}
            </button>
          )}
        </div>

        {/* Post-swap earn suggestion */}
        {bestYield && route && amountNum > 0 && status !== "success" && (
          <div style={{ background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(75,139,255,0.06))", border: "1px solid var(--green-border)", borderRadius: 16, padding: 18, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Zap size={13} style={{ color: "var(--green)" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Earn {bestYield.apy.toFixed(2)}% APY on your {toToken.symbol}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.6 }}>
              After swapping, deposit your {toToken.symbol} to {bestYield.protocol} — the best rate on Sui right now.
            </div>
            <a href="/app" style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", textDecoration: "none" }}>
              View yield opportunities →
            </a>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}