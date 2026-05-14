"use client"
import { useState, useEffect, useRef } from "react"
import Navbar from "@/components/Navbar"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Bell, Plus, Trash2, Loader2, CheckCircle, AlertCircle, ExternalLink, Send } from "lucide-react"

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
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ asset: "USDC", protocol: "Any protocol", direction: "above" as "above" | "below", threshold: "" })
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Check Telegram connection status
  async function checkTgStatus() {
    if (!account?.address) return
    try {
      const res = await fetch(`/api/telegram/status?wallet=${account.address}`)
      const data = await res.json()
      if (data.connected) {
        setTgConnected(true)
        // Stop polling once connected
        if (pollRef.current) clearInterval(pollRef.current)
      }
    } catch {}
  }

  useEffect(() => {
    if (!account?.address) return
    setTgChecking(true)
    checkTgStatus().finally(() => setTgChecking(false))
  }, [account?.address])

  // Load alerts
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
  // Telegram start param only allows alphanumeric and _ -
  // Remove 0x prefix and add it back in webhook
  const walletParam = account.address.replace("0x", "sui")
  const url = `https://t.me/${BOT_USERNAME}?start=${walletParam}`
  window.open(url, "_blank")

    // Start polling for connection every 3 seconds
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(checkTgStatus, 3000)

    // Stop polling after 2 minutes
    setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current)
    }, 120000)
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

  // Cleanup polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Rate Alerts</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Get notified on Telegram when yields hit your targets</p>
          </div>
          {tgConnected && (
            <button onClick={() => setShowForm(s => !s)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--green)", color: "#000", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={15} /> New alert
            </button>
          )}
        </div>

        {/* Success/Error */}
        {successMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "var(--green)", fontSize: 13 }}>
            <CheckCircle size={14} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "#EF4444", fontSize: 13 }}>
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        {/* Not connected wallet */}
        {!account ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 20, padding: "60px 40px", textAlign: "center" }}>
            <Bell size={32} style={{ color: "var(--text-muted)", margin: "0 auto 16px", display: "block" }} />
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Connect your wallet</div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Connect to set up yield alerts for your assets.</div>
          </div>
        ) : (
          <>
            {/* Telegram Connection Card */}
            <div style={{ background: "var(--bg-card)", border: `1px solid ${tgConnected ? "var(--green-border)" : "var(--border)"}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Telegram icon */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: tgConnected ? "var(--green-bg)" : "#2AABEE22", border: `1px solid ${tgConnected ? "var(--green-border)" : "#2AABEE44"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Send size={20} style={{ color: tgConnected ? "var(--green)" : "#2AABEE" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Telegram Notifications</span>
                      {tgConnected && (
                        <span style={{ fontSize: 10, background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "2px 8px", fontWeight: 600 }}>Connected</span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {tgConnected
                        ? "Your wallet is linked to Telegram. You'll receive alerts directly in the app."
                        : "Connect Telegram to receive yield alerts instantly on your phone."}
                    </div>
                  </div>
                </div>

                <div>
                  {tgChecking ? (
                    <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "var(--text-muted)" }} />
                  ) : tgConnected ? (
                    <button onClick={disconnectTelegram}
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
                      Disconnect
                    </button>
                  ) : (
                    <button onClick={connectTelegram}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: "#2AABEE", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      <Send size={14} />
                      Connect Telegram
                    </button>
                  )}
                </div>
              </div>

              {/* Waiting for connection */}
              {!tgConnected && pollRef.current && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, padding: "10px 14px", background: "var(--bg-elevated)", borderRadius: 10, fontSize: 13, color: "var(--text-secondary)" }}>
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                  Waiting for you to start the bot in Telegram...
                </div>
              )}
            </div>

            {/* Only show rest if Telegram connected */}
            {!tgConnected ? (
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.8 }}>
                  To receive alerts:<br />
                  1. Click <strong>Connect Telegram</strong> above<br />
                  2. Press <strong>START</strong> in the Telegram bot<br />
                  3. Come back here and create your first alert
                </div>
                <button onClick={connectTelegram}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2AABEE", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  <ExternalLink size={14} />
                  Open Telegram Bot
                </button>
              </div>

            ) : (
              <>
                {/* New alert form */}
                {showForm && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24, marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>Create new alert</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                      {[
                        { label: "Asset", key: "asset", options: ASSETS },
                        { label: "Protocol", key: "protocol", options: PROTOCOLS },
                        { label: "Direction", key: "direction", options: ["above", "below"] },
                      ].map(f => (
                        <div key={f.key}>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const }}>{f.label}</div>
                          <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            style={{ width: "100%", padding: "9px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", outline: "none" }}>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      ))}
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const }}>APY Threshold (%)</div>
                        <input type="number" placeholder="e.g. 12" value={form.threshold}
                          onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", outline: "none" }} />
                      </div>
                    </div>

                    {/* Preview */}
                    <div style={{ background: "var(--bg-elevated)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--text-secondary)" }}>
                      📲 When <strong style={{ color: "var(--text-primary)" }}>{form.asset}</strong> on <strong style={{ color: "var(--text-primary)" }}>{form.protocol}</strong> goes <strong style={{ color: "var(--text-primary)" }}>{form.direction}</strong> <strong style={{ color: "var(--green)" }}>{form.threshold || "?"}%</strong> APY → Telegram message
                    </div>

                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={createAlert} disabled={saving || !form.threshold}
                        style={{ display: "flex", alignItems: "center", gap: 6, background: form.threshold ? "var(--green)" : "var(--bg-elevated)", color: form.threshold ? "#000" : "var(--text-muted)", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: form.threshold ? "pointer" : "not-allowed" }}>
                        {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
                        Create alert
                      </button>
                      <button onClick={() => setShowForm(false)}
                        style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Alerts list */}
                {loading ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                    <Loader2 size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block" }} />
                    Loading alerts...
                  </div>
                ) : alerts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 40px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }}>
                    <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.3, display: "block", color: "var(--text-muted)" }} />
                    <div style={{ fontSize: 15, color: "var(--text-primary)", marginBottom: 6, fontWeight: 500 }}>No alerts yet</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Create an alert to get notified on Telegram when yields hit your targets</div>
                    <button onClick={() => setShowForm(true)}
                      style={{ background: "var(--green)", color: "#000", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Create first alert
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {alerts.map(a => (
                      <div key={a.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: a.active ? "var(--green-bg)" : "var(--bg-elevated)", border: `1px solid ${a.active ? "var(--green-border)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Bell size={16} style={{ color: a.active ? "var(--green)" : "var(--text-muted)" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>
                              {a.asset} on {a.protocol} {a.direction} {a.threshold.toFixed(2)}%
                            </div>
                            <div style={{ fontSize: 12, color: a.active ? "var(--green)" : "var(--text-muted)" }}>
                              {a.active ? "Active" : "Paused"}
                              {a.lastTriggered ? ` · Last sent ${new Date(a.lastTriggered).toLocaleDateString()}` : ""}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <button onClick={() => toggleAlert(a)}
                            style={{ width: 44, height: 24, borderRadius: 12, position: "relative", background: a.active ? "var(--green)" : "var(--bg-elevated)", border: `1px solid ${a.active ? "var(--green)" : "var(--border)"}`, cursor: "pointer", transition: "background 0.2s" }}>
                            <div style={{ position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: a.active ? 25 : 3 }} />
                          </button>
                          <button onClick={() => deleteAlert(a)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                            <Trash2 size={15} />
                          </button>
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