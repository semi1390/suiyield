"use client"
import { useState, useEffect } from "react"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import type { YieldEntry } from "@/types"
import { X, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"

// Scallop coin name map — Scallop uses different names than standard symbols
// This is the only map we keep — Scallop has its own naming convention
const SCALLOP_COIN_NAMES: Record<string, string> = {
  SUI: "sui", USDC: "usdc", USDT: "sbusdt", WETH: "weth",
  WBTC: "wbtc", CETUS: "cetus", DEEP: "deep", WAL: "wal",
  HASUI: "hasui", VSUI: "vsui", NAVX: "navx", NS: "ns",
  USDY: "usdy", FDUSD: "fdusd", HAEDAL: "haedal",
  HAWAL: "hawal", WWAL: "wwal", SCA: "sca",
}

interface Props {
  pool: YieldEntry
  onClose: () => void
}

type Status = "idle" | "building" | "signing" | "success" | "error"

interface CoinInfo {
  coinType: string
  decimals: number
}

export default function DepositModal({ pool, onClose }: Props) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [amount, setAmount] = useState("")
  const [walletBalance, setWalletBalance] = useState(0)
  const [status, setStatus] = useState<Status>("idle")
  const [txHash, setTxHash] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [coinInfo, setCoinInfo] = useState<CoinInfo | null>(null)
  const [coinLoading, setCoinLoading] = useState(true)

  const asset = pool.asset.toUpperCase()
  const isNavi = pool.protocol.toLowerCase().includes("navi")
  const isScallop = pool.protocol.toLowerCase().includes("scallop")

  // Fetch coin type + decimals dynamically from Navi pool data
  // This means ANY token Navi lists automatically works — no hardcoding
  useEffect(() => {
    async function fetchCoinInfo() {
      setCoinLoading(true)
      try {
        // Use our live-rates API which already fetches pool data
        // For Navi — get coinType from pool's suiCoinType
        // For Scallop — get coinType from pool's coinType field
        const res = await fetch("/api/live-rates")
        const data = await res.json()
        const rates = data.data ?? []

        // Find the matching pool
        const matchingRate = rates.find((r: any) => {
          const sym = r.symbol?.toUpperCase()
          const proto = r.protocol?.toLowerCase()
          if (isNavi && proto === "navi" && sym === asset) return true
          if (isScallop && proto === "scallop" && sym === asset) return true
          return false
        })

        if (matchingRate?.coinType) {
          setCoinInfo({ coinType: matchingRate.coinType, decimals: matchingRate.decimals ?? 9 })
          setCoinLoading(false)
          return
        }

        // Fallback: fetch from Navi pool directly
        if (isNavi) {
          const poolRes = await fetch(`/api/coin-info?symbol=${asset}`)
          if (poolRes.ok) {
            const poolData = await poolRes.json()
            if (poolData.coinType) {
              setCoinInfo({ coinType: poolData.coinType, decimals: poolData.decimals ?? 9 })
              setCoinLoading(false)
              return
            }
          }
        }

        setCoinInfo(null)
      } catch (e) {
        console.error("[DepositModal] coin info fetch failed:", e)
        setCoinInfo(null)
      } finally {
        setCoinLoading(false)
      }
    }
    fetchCoinInfo()
  }, [asset, isNavi, isScallop])

  const coinType = coinInfo?.coinType ?? null
  const decimals = coinInfo?.decimals ?? 9
  const isSupported = (isNavi || isScallop) && !!coinType && !coinLoading

  // Fetch wallet balance once we have coinType
  useEffect(() => {
    if (!account?.address || !coinType) return
    client.getBalance({ owner: account.address, coinType })
      .then(bal => setWalletBalance(Number(BigInt(bal.totalBalance)) / Math.pow(10, decimals)))
      .catch(() => setWalletBalance(0))
  }, [account?.address, coinType, decimals])

  const amountNum = parseFloat(amount) || 0
  const amountValid = amountNum > 0 && amountNum <= walletBalance
  const amountInBaseUnits = BigInt(Math.floor(amountNum * Math.pow(10, decimals)))

  async function handleDeposit() {
    if (!account?.address || !amountValid || !coinType) return
    setStatus("building")
    setErrorMsg("")
    try {
      if (isNavi) await handleNaviDeposit()
      else if (isScallop) await handleScallopDeposit()
    } catch (err: any) {
      console.error("[Deposit] Error:", err)
      setErrorMsg(err?.message?.slice(0, 200) ?? "Transaction failed")
      setStatus("error")
    }
  }

  async function handleNaviDeposit() {
    const res = await fetch("/api/deposit/navi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: account!.address,
        coinType,
        amountInBaseUnits: amountInBaseUnits.toString(),
      }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error ?? "Failed to build transaction")
    const txBytes = Uint8Array.from(Buffer.from(data.txBase64, "base64"))
    setStatus("signing")
    const result = await signAndExecute({ transaction: Transaction.from(txBytes) as any })
    setTxHash(result.digest)
    setStatus("success")
  }

async function handleScallopDeposit() {
  const res = await fetch("/api/deposit/scallop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: account!.address,
      coinType,
      amountInBaseUnits: amountInBaseUnits.toString(),
    }),
  })
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? "Failed to build transaction")
  const txBytes = Uint8Array.from(Buffer.from(data.txBase64, "base64"))
  setStatus("signing")
  const result = await signAndExecute({ transaction: Transaction.from(txBytes) as any })
  setTxHash(result.digest)
  setStatus("success")
}

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: 28, width: 440, maxWidth: "100%", position: "relative" }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={14} color="var(--text-muted)" />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: pool.color + "22", border: `1px solid ${pool.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: pool.color }}>
            {pool.initials}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Deposit {asset}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {pool.protocol} · <span style={{ color: "var(--green)", fontWeight: 600 }}>{pool.apy.toFixed(2)}% APY</span>
            </div>
          </div>
        </div>

        {/* Loading coin info */}
        {coinLoading ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <Loader2 size={24} style={{ color: "var(--green)", animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading pool info...</div>
          </div>

        ) : !isSupported ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              Native deposits for {pool.protocol} · {asset} coming soon.
            </div>
            <a href={pool.depositUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green)", color: "#000", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
              Open {pool.protocol} <ExternalLink size={13} />
            </a>
          </div>

        ) : status === "success" ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <CheckCircle size={48} style={{ color: "var(--green)", margin: "0 auto 16px", display: "block" }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Deposit successful!</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              {fmt(amountNum)} {asset} deposited to {pool.protocol}
            </div>
            {txHash && (
              <a href={`https://suiscan.xyz/mainnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--green)", textDecoration: "none", marginBottom: 20 }}>
                View on Suiscan <ExternalLink size={12} />
              </a>
            )}
            <button onClick={onClose}
              style={{ width: "100%", padding: 12, borderRadius: 10, background: "var(--green)", color: "#000", fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" }}>
              Done
            </button>
          </div>

        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "APY", value: `${pool.apy.toFixed(2)}%`, color: "var(--green)" },
                { label: "TVL", value: pool.tvl >= 1e6 ? `$${(pool.tvl / 1e6).toFixed(1)}M` : `$${(pool.tvl / 1e3).toFixed(0)}K`, color: "var(--text-primary)" },
                { label: "Risk", value: pool.risk.charAt(0).toUpperCase() + pool.risk.slice(1), color: pool.risk === "low" ? "var(--green)" : pool.risk === "medium" ? "#F5A623" : "#EF4444" },
              ].map((s, i) => (
                <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Amount</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Wallet: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{fmt(walletBalance)} {asset}</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", background: "var(--bg-elevated)", border: `1px solid ${amountNum > walletBalance && amountNum > 0 ? "#EF4444" : "var(--border)"}`, borderRadius: 10, padding: "0 12px" }}>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 16, fontWeight: 600, color: "var(--text-primary)", padding: "12px 0" }}
                  />
                  <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>{asset}</span>
                </div>
                <button
                  onClick={() => setAmount(walletBalance.toFixed(Math.min(decimals, 6)))}
                  style={{ padding: "0 14px", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "var(--green)", cursor: "pointer" }}>
                  Max
                </button>
              </div>
              {amountNum > walletBalance && amountNum > 0 && (
                <div style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>Insufficient balance</div>
              )}
              {walletBalance === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                  No {asset} in wallet. <a href="/app/swap" style={{ color: "var(--green)" }}>Get {asset} →</a>
                </div>
              )}
            </div>

            {amountValid && (
              <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>You deposit</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{fmt(amountNum)} {asset}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Est. daily earnings</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>
                    +{(amountNum * pool.apy / 100 / 365).toFixed(6)} {asset}/day
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Yearly est.</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>+{pool.apy.toFixed(2)}% APY</span>
                </div>
              </div>
            )}

            {status === "error" && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <AlertCircle size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "#EF4444" }}>{errorMsg || "Transaction failed. Please try again."}</span>
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={!amountValid || status === "building" || status === "signing"}
              style={{
                width: "100%", padding: 14, borderRadius: 12,
                background: amountValid ? "var(--green)" : "var(--bg-elevated)",
                color: amountValid ? "#000" : "var(--text-muted)",
                fontSize: 15, fontWeight: 700, border: "none",
                cursor: amountValid ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}>
              {(status === "building" || status === "signing") && (
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              )}
              {status === "building" ? "Building transaction..." :
               status === "signing" ? "Check your wallet..." :
               walletBalance === 0 ? `No ${asset} in wallet` :
               `Deposit ${amount || "0"} ${asset}`}
            </button>

            <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>
              Transaction signed in your wallet. Funds go directly on-chain to {pool.protocol} — we never hold your assets.
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}