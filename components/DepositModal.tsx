"use client"
import { useState, useEffect } from "react"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import type { YieldEntry } from "@/types"
import { X, Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"


const COIN_TYPES: Record<string, string> = {
  "SUI":   "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  "USDC":  "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  "USDT":  "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
  "WETH":  "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
  "WBTC":  "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
  "NAVX":  "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
  "CETUS": "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  "DEEP":  "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
  "WAL":   "0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL",
  "HASUI": "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",
  "VSUI":  "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
}

const COIN_DECIMALS: Record<string, number> = {
  SUI: 9, USDC: 6, USDT: 6, WETH: 8, WBTC: 8,
  NAVX: 9, CETUS: 9, DEEP: 6, WAL: 9, HASUI: 9, VSUI: 9,
}

// Scallop uses lowercase coin names
const SCALLOP_COIN_NAMES: Record<string, string> = {
  SUI: "sui", USDC: "usdc", USDT: "sbusdt", WETH: "weth",
  WBTC: "wbtc", CETUS: "cetus", DEEP: "deep", WAL: "wal",
  HASUI: "hasui", VSUI: "vsui",
}

interface Props {
  pool: YieldEntry
  onClose: () => void
}

type Status = "idle" | "building" | "signing" | "success" | "error"

export default function DepositModal({ pool, onClose }: Props) {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction()

  const [amount, setAmount] = useState("")
  const [walletBalance, setWalletBalance] = useState(0)
  const [status, setStatus] = useState<Status>("idle")
  const [txHash, setTxHash] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  const asset = pool.asset.toUpperCase()
  const coinType = COIN_TYPES[asset]
  const decimals = COIN_DECIMALS[asset] ?? 9
  const isNavi = pool.protocol.toLowerCase().includes("navi")
  const isScallop = pool.protocol.toLowerCase().includes("scallop")
  const isSupported = (isNavi || isScallop) && !!coinType

  // Fetch wallet balance
  useEffect(() => {
    if (!account?.address || !coinType) return
    client.getBalance({ owner: account.address, coinType })
      .then(bal => setWalletBalance(Number(BigInt(bal.totalBalance)) / Math.pow(10, decimals)))
      .catch(() => setWalletBalance(0))
  }, [account?.address, coinType])

  const amountNum = parseFloat(amount) || 0
  const amountValid = amountNum > 0 && amountNum <= walletBalance
  const amountInBaseUnits = BigInt(Math.floor(amountNum * Math.pow(10, decimals)))

  async function handleDeposit() {
    if (!account?.address || !amountValid || !coinType) return
    setStatus("building")
    setErrorMsg("")

    try {
      if (isNavi) {
        await handleNaviDeposit()
      } else if (isScallop) {
        await handleScallopDeposit()
      }
    } catch (err: any) {
      console.error("[Deposit] Error:", err)
      setErrorMsg(err?.message?.slice(0, 200) ?? "Transaction failed")
      setStatus("error")
    }
  }

async function handleNaviDeposit() {
  // Build TX server-side (Navi SDK has browser compatibility issues)
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

  console.log("[Navi] TX built server-side, sending to wallet for signing")

  // Deserialize and sign client-side with connected wallet
  const txBytes = Uint8Array.from(Buffer.from(data.txBase64, "base64"))

  setStatus("signing")
  const result = await signAndExecute({
    transaction: Transaction.from(txBytes) as any,
  })

  setTxHash(result.digest)
  setStatus("success")
}
  async function handleScallopDeposit() {
  const { Scallop } = await import("@scallop-io/sui-scallop-sdk")
  const coinName = SCALLOP_COIN_NAMES[asset]
  if (!coinName) throw new Error(`${asset} not supported on Scallop yet`)

  const scallop = new Scallop({
    networkType: "mainnet",
    walletAddress: account!.address,
  })

  const scallopClient = await scallop.createScallopClient()

  // Get the transaction block without signing — we sign with the connected wallet
  const txBlock = await scallopClient.deposit(coinName, Number(amountInBaseUnits), true) // true = return tx only

  if (!txBlock) throw new Error("Failed to build Scallop transaction")

  setStatus("signing")
  const result = await signAndExecute({ transaction: txBlock as any })
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
        {/* Close button */}
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={14} color="var(--text-muted)" />
        </button>

        {/* Header */}
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

        {!isSupported ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              Native deposits for {pool.protocol} coming soon.
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
            {/* Pool stats */}
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

            {/* Amount input */}
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
                  onClick={() => setAmount(walletBalance.toFixed(decimals > 6 ? 6 : decimals))}
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

            {/* Earnings preview */}
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

            {/* Error */}
            {status === "error" && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <AlertCircle size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: "#EF4444" }}>{errorMsg || "Transaction failed. Please try again."}</span>
              </div>
            )}

            {/* Deposit button */}
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