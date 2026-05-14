"use client"
import { useState, useEffect, useRef } from "react"
import Navbar from "@/components/Navbar"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Bell, Plus, Trash2, Loader2, CheckCircle, AlertCircle, ExternalLink, Send, Copy } from "lucide-react"

const ASSETS = ["USDC", "USDT", "SUI", "DEEP", "WAL", "WETH", "NAVX", "CETUS", "HASUI", "VSUI", "HAEDAL"]
const PROTOCOLS = ["Any protocol", "Navi Protocol", "Scallop"]
const BOT_USERNAME = "Suiyield_alerts_bot"

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

export default function AlertsPage() {
  const account = useCurrentAccount()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [tgConnected, setTgConnected] = useState(false)
  const [tgChecking, setTgChecking] = useState(false)
  const [polling, setPolling] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ asset: "USDC", protocol: "Any protocol", direction: "above" as "above" | "below", threshold: "" })
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  async function checkTgStatus() {
    if (!account?.address) return
    try {
      const res = await fetch(`/api/telegram/status?wallet=${account.address}`)
      const data = await res.json()
      if (data.connected) {
        setTgConnected(true)
        setPolling(false)
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } catch {}
  }

  useEffect(() => {
    if (!account?.address) return
    setTgChecking(true)
    checkTgStatus().finally(() => setTgChecking(false))
  }, [account?.address])

  useEffect(() => {
    if (!account?.address || !tgConnected) return
    setLoading(true)
    fetch(`/api/alerts?wallet=${account.address}`)
      .then(r => r.json())
      .then(data => setAlerts(data.alerts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [account?.address, tgConnected])

  function connectTelegram() {
    if (!account?.address) return
    const walletParam = account.address.replace("0x", "sui")
    const url = `https://t.me/${BOT_USERNAME}?start=${walletParam}`
    window.open(url, "_blank")
    setPolling(true)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(checkTgStatus, 3000)
    setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current)
      setPolling(false)
    }, 120000)
  }

  function copyCommand() {
    if (!account?.address) return
    const cmd = `/start sui${account.address.slice(2)}`
    navigator.clipboard.writeText(cmd)
    setSuccessMsg("Copied! Paste it in the Telegram bot.")
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  async function disconnectTelegram() {
    if (!account?.address) return
    try {
      await fetch(`/api/telegram/status?wallet=${account.address}`, { method: "DELETE" })
      setTgConnected(false)
      setAlerts([])
    } catch {}
  }

  async function createAlert() {
    if (!form.threshold || !account?.address) return
    setSaving(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: account.address,
          asset: form.asset,
          protocol: form.protocol,
          direction: form.direction,
          threshold: parseFloat(form.threshold),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAlerts(prev => [data.alert, ...prev])
      setShowForm(false)
      setForm({ asset: "USDC", protocol: "Any protocol", direction: "above", threshold: "" })
      setSuccessMsg("Alert created! You'll get a Telegram message when it triggers.")
      setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err: any) {
      setErrorMsg(err.message ?? "Failed to create alert")
    } finally {
      setSaving(false)
    }
  }

  async function toggleAlert(alert: Alert) {
    try {
      await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: alert.walletAddress, id: alert.id, active: !alert.active }),
      })
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: !a.active } : a))
    } catch {}
  }

  async function deleteAlert(alert: Alert) {
    try {
      await fetch(`/api/alerts?wallet=${alert.walletAddress}&id=${alert.id}`, { method: "DELETE" })
      setAlerts(prev => prev.filter(a => a.id !== alert.id))
    } catch {}
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Rate Alerts</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Get notified on Telegram when yields hit your targets</p>
          </div>
          {tgConnected && (
            <button onClick={() => setShowForm(s => !s)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--green)", color: "#000", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={14} /> New alert
            </button>
          )}
        </div>

        {/* Success/Error */}
        {successMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "var(--green)", fontSize: 13 }}>
            <CheckCircle size={13} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#EF4444", fontSize: 13 }}>
            <AlertCircle size={13} /> {errorMsg}
          </div>
        )}

        {!account ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 20px", textAlign: "center" }}>
            <Bell size={30} style={{ color: "var(--text-muted)", margin: "0 auto 14px", display: "block" }} />
            <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Connect your wallet</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Connect to set up yield alerts for your assets.</div>
          </div>
        ) : (
          <>
            {/* Telegram Connection Card */}
            <div style={{ background: "var(--bg-card)", border: `1px solid ${tgConnected ? "var(--green-border)" : "var(--border)"}`, borderRadius: 16, padding: 16, marginBottom: 20 }}>

              {/* Top row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: tgConnected ? 0 : 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: tgConnected ? "var(--green-bg)" : "#2AABEE22", border: `1px solid ${tgConnected ? "var(--green-border)" : "#2AABEE44"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Send size={18} style={{ color: tgConnected ? "var(--green)" : "#2AABEE" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Telegram</span>
                      {tgConnected && (
                        <span style={{ fontSize: 9, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "2px 7px", fontWeight: 600 }}>Connected</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {tgConnected ? "Alerts will be sent to your Telegram." : "Connect to receive yield alerts."}
                    </div>
                  </div>
                </div>

                {tgChecking ? (
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />
                ) : tgConnected ? (
                  <button onClick={disconnectTelegram}
                    style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "var(--text-muted)", cursor: "pointer", flexShrink: 0 }}>
                    Disconnect
                  </button>
                ) : (
                  <button onClick={connectTelegram}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "#2AABEE", color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                    <Send size={13} /> Connect
                  </button>
                )}
              </div>

              {/* Instructions */}
              {!tgConnected && (
                <div style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>How to connect:</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 10 }}>
                    <strong>Step 1:</strong> Tap <strong>Connect</strong> above and press <strong>START</strong> in the bot.<br />
                    <strong>Step 2:</strong> If you've used the bot before, send this command:
                  </div>
                  {account?.address && (
                    <div style={{ background: "var(--bg-card)", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                      <code style={{ fontSize: 11, color: "var(--green)", wordBreak: "break-all", display: "block", marginBottom: 8 }}>
                        /start sui{account.address.slice(2)}
                      </code>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={copyCommand}
                          style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center", background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 6, padding: "7px", fontSize: 12, color: "var(--green)", cursor: "pointer", fontWeight: 600 }}>
                          <Copy size={11} /> Copy command
                        </button>
                        <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, justifyContent: "center", background: "#2AABEE22", border: "1px solid #2AABEE44", borderRadius: 6, padding: "7px", fontSize: 12, color: "#2AABEE", textDecoration: "none", fontWeight: 600 }}>
                          <ExternalLink size={11} /> Open Bot
                        </a>
                      </div>
                    </div>
                  )}
                  {polling && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                      <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} />
                      Waiting for connection...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connected UI */}
            {tgConnected && (
              <>
                {/* New alert form */}
                {showForm && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 16 }}>Create new alert</div>

                    {/* 2-col on mobile, 4-col on desktop */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      {[
                        { label: "Asset", key: "asset", options: ASSETS },
                        { label: "Protocol", key: "protocol", options: PROTOCOLS },
                        { label: "Direction", key: "direction", options: ["above", "below"] },
                      ].map(f => (
                        <div key={f.key}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const }}>{f.label}</div>
                          <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            style={{ width: "100%", padding: "8px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", outline: "none" }}>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 5, fontWeight: 600, textTransform: "uppercase" as const }}>APY %</div>
                        <input type="number" placeholder="e.g. 12" value={form.threshold}
                          onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))}
                          style={{ width: "100%", padding: "8px 10px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" as const }} />
                      </div>
                    </div>

                    <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      📲 When <strong style={{ color: "var(--text-primary)" }}>{form.asset}</strong> on <strong style={{ color: "var(--text-primary)" }}>{form.protocol}</strong> goes <strong style={{ color: "var(--text-primary)" }}>{form.direction}</strong> <strong style={{ color: "var(--green)" }}>{form.threshold || "?"}%</strong> → Telegram message
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={createAlert} disabled={saving || !form.threshold}
                        style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", background: form.threshold ? "var(--green)" : "var(--bg-elevated)", color: form.threshold ? "#000" : "var(--text-muted)", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: form.threshold ? "pointer" : "not-allowed" }}>
                        {saving && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                        Create
                      </button>
                      <button onClick={() => setShowForm(false)}
                        style={{ flex: 1, background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Alerts list */}
                {loading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                    <Loader2 size={22} style={{ animation: "spin 1s linear infinite", margin: "0 auto 10px", display: "block" }} />
                    Loading alerts...
                  </div>
                ) : alerts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "50px 20px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }}>
                    <Bell size={28} style={{ margin: "0 auto 12px", opacity: 0.3, display: "block", color: "var(--text-muted)" }} />
                    <div style={{ fontSize: 15, color: "var(--text-primary)", marginBottom: 6, fontWeight: 500 }}>No alerts yet</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>Get notified when yields hit your targets</div>
                    <button onClick={() => setShowForm(true)}
                      style={{ background: "var(--green)", color: "#000", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Create first alert
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {alerts.map(a => (
                      <div key={a.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: a.active ? "var(--green-bg)" : "var(--bg-elevated)", border: `1px solid ${a.active ? "var(--green-border)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Bell size={14} style={{ color: a.active ? "var(--green)" : "var(--text-muted)" }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {a.asset} · {a.protocol} · {a.direction} {a.threshold.toFixed(2)}%
                              </div>
                              <div style={{ fontSize: 11, color: a.active ? "var(--green)" : "var(--text-muted)" }}>
                                {a.active ? "Active" : "Paused"}
                                {a.lastTriggered ? ` · ${new Date(a.lastTriggered).toLocaleDateString()}` : ""}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <button onClick={() => toggleAlert(a)}
                              style={{ width: 42, height: 22, borderRadius: 11, position: "relative", background: a.active ? "var(--green)" : "var(--bg-elevated)", border: `1px solid ${a.active ? "var(--green)" : "var(--border)"}`, cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                              <div style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: a.active ? 22 : 2 }} />
                            </button>
                            <button onClick={() => deleteAlert(a)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, flexShrink: 0 }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}