"use client"
import { useState, useEffect, useRef } from "react"
import Navbar from "@/components/Navbar"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { Bell, Plus, Trash2, Loader2, CheckCircle, AlertCircle, ExternalLink, Send, Copy, Zap, TrendingUp, Shield } from "lucide-react"

const ASSETS = ["USDC", "USDT", "SUI", "DEEP", "WAL", "WETH", "NAVX", "CETUS", "HASUI", "VSUI", "HAEDAL"]
const PROTOCOLS = ["Any protocol", "Navi Protocol", "Scallop"]
const BOT_USERNAME = "Suiyield_alerts_bot"

interface Alert {
  id: string; walletAddress: string; chatId: string; asset: string
  protocol: string; direction: "above" | "below"; threshold: number
  active: boolean; createdAt: number; lastTriggered?: number
}

const EXAMPLE_ALERTS = [
  { asset: "USDC", protocol: "Any protocol", direction: "above", threshold: 12, desc: "Best stablecoin alert" },
  { asset: "SUI", protocol: "Navi Protocol", direction: "above", threshold: 8, desc: "SUI lending spike" },
  { asset: "DEEP", protocol: "Any protocol", direction: "above", threshold: 20, desc: "High yield opportunity" },
]

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
  const [mounted, setMounted] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => { setMounted(true) }, [])

  async function checkTgStatus() {
    if (!account?.address) return
    try {
      const res = await fetch(`/api/telegram/status?wallet=${account.address}`)
      const data = await res.json()
      if (data.connected) { setTgConnected(true); setPolling(false); if (pollRef.current) clearInterval(pollRef.current) }
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
      .then(r => r.json()).then(data => setAlerts(data.alerts ?? []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [account?.address, tgConnected])

  function connectTelegram() {
    if (!account?.address) return
    const walletParam = account.address.replace("0x", "sui")
    window.open(`https://t.me/${BOT_USERNAME}?start=${walletParam}`, "_blank")
    setPolling(true)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(checkTgStatus, 3000)
    setTimeout(() => { if (pollRef.current) clearInterval(pollRef.current); setPolling(false) }, 120000)
  }

  function copyCommand() {
    if (!account?.address) return
    navigator.clipboard.writeText(`/start sui${account.address.slice(2)}`)
    setSuccessMsg("Copied! Paste it in the Telegram bot.")
    setTimeout(() => setSuccessMsg(""), 3000)
  }

  async function disconnectTelegram() {
    if (!account?.address) return
    try { await fetch(`/api/telegram/status?wallet=${account.address}`, { method: "DELETE" }); setTgConnected(false); setAlerts([]) } catch {}
  }

  async function createAlert() {
    if (!form.threshold || !account?.address) return
    setSaving(true); setErrorMsg("")
    try {
      const res = await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ walletAddress: account.address, asset: form.asset, protocol: form.protocol, direction: form.direction, threshold: parseFloat(form.threshold) }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAlerts(prev => [data.alert, ...prev]); setShowForm(false)
      setForm({ asset: "USDC", protocol: "Any protocol", direction: "above", threshold: "" })
      setSuccessMsg("Alert created!"); setTimeout(() => setSuccessMsg(""), 3000)
    } catch (err: any) { setErrorMsg(err.message ?? "Failed to create alert") }
    finally { setSaving(false) }
  }

  async function toggleAlert(alert: Alert) {
    try {
      await fetch("/api/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet: alert.walletAddress, id: alert.id, active: !alert.active }) })
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: !a.active } : a))
    } catch {}
  }

  async function deleteAlert(alert: Alert) {
    try { await fetch(`/api/alerts?wallet=${alert.walletAddress}&id=${alert.id}`, { method: "DELETE" }); setAlerts(prev => prev.filter(a => a.id !== alert.id)) } catch {}
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#0A0E1A" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40, opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)", transition: "all 0.6s ease" }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 8 }}>Rate Alerts</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Get notified on Telegram the moment yields hit your targets</p>
        </div>

        {successMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#00D4AA", fontSize: 13, animation: "fadeIn 0.3s ease" }}>
            <CheckCircle size={14} /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#EF4444", fontSize: 13 }}>
            <AlertCircle size={14} /> {errorMsg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 520px", gap: 24, alignItems: "start" }} className="alerts-grid">

          {/* Left — how it works + example alerts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, opacity: mounted ? 1 : 0, transform: mounted ? "translateX(0)" : "translateX(-20px)", transition: "all 0.6s ease 0.1s" }}>

            {/* How alerts work */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>How it works</div>
              {[
                { icon: Send,       title: "Connect Telegram",    desc: "Link your wallet to our Telegram bot in one click. No email, no sign up." },
                { icon: Bell,       title: "Set your threshold",  desc: "Pick any asset, protocol, and APY target. Above or below — your call." },
                { icon: Zap,        title: "Get instant alerts",  desc: "The moment a pool crosses your target, you get a Telegram message. No delays." },
                { icon: TrendingUp, title: "Act on the insight",  desc: "Click the link in the message to go straight to the pool and deposit." },
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

            {/* Example alerts */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Popular alert ideas</div>
              {EXAMPLE_ALERTS.map((a, i) => (
                <div key={i} style={{ padding: "12px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{a.asset} {a.direction} {a.threshold}%</div>
                    <span style={{ fontSize: 10, color: "#00D4AA", background: "rgba(0,212,170,0.08)", borderRadius: 4, padding: "2px 8px" }}>{a.desc}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{a.protocol}</div>
                </div>
              ))}
            </div>

            {/* Telegram preview */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>What you'll receive</div>
              <div style={{ background: "#17212B", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(0,212,170,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔔</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>SuiYield Alerts</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Bot · just now</div>
                  </div>
                </div>
                <div style={{ background: "#232E3C", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 13, color: "#fff", lineHeight: 1.6 }}>
                    🚨 <strong>Alert triggered!</strong><br />
                    <strong style={{ color: "#00D4AA" }}>USDC on Navi Protocol</strong> is now at <strong style={{ color: "#00D4AA" }}>16.22% APY</strong><br />
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Your threshold: above 12%</span>
                  </div>
                  <a href="#" style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: "#2AABEE", textDecoration: "none" }}>→ View on SuiYield</a>
                </div>
              </div>
            </div>
          </div>

          {/* Right — main alerts panel */}
          <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? "translateX(0)" : "translateX(20px)", transition: "all 0.6s ease 0.2s" }}>

            {!account ? (
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "60px 24px", textAlign: "center" }}>
                <Bell size={36} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 16px", display: "block" }} />
                <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Connect your wallet</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Connect to set up yield alerts for your assets.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Telegram connection */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${tgConnected ? "rgba(0,212,170,0.25)" : "rgba(255,255,255,0.06)"}`, borderRadius: 16, padding: 20, transition: "border-color 0.3s" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: tgConnected ? "rgba(0,212,170,0.1)" : "rgba(42,171,238,0.1)", border: `1px solid ${tgConnected ? "rgba(0,212,170,0.25)" : "rgba(42,171,238,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Send size={18} style={{ color: tgConnected ? "#00D4AA" : "#2AABEE" }} />
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Telegram</span>
                          {tgConnected && <span style={{ fontSize: 10, color: "#00D4AA", background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>Connected</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                          {tgConnected ? "Alerts will be sent to your Telegram." : "Connect to receive yield alerts."}
                        </div>
                      </div>
                    </div>
                    {tgChecking
                      ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "rgba(255,255,255,0.3)" }} />
                      : tgConnected
                        ? <button onClick={disconnectTelegram} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Disconnect</button>
                        : <button onClick={connectTelegram} style={{ display: "flex", alignItems: "center", gap: 6, background: "#2AABEE", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Send size={13} /> Connect</button>
                    }
                  </div>

                  {!tgConnected && (
                    <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 10 }}>How to connect:</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 12 }}>
                        <strong style={{ color: "rgba(255,255,255,0.7)" }}>Step 1:</strong> Tap Connect above and press START in the bot.<br />
                        <strong style={{ color: "rgba(255,255,255,0.7)" }}>Step 2:</strong> If you've used the bot before, send this command:
                      </div>
                      {account?.address && (
                        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
                          <code style={{ fontSize: 11, color: "#00D4AA", wordBreak: "break-all", display: "block", marginBottom: 10 }}>
                            /start sui{account.address.slice(2)}
                          </code>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={copyCommand} style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center", background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)", borderRadius: 8, padding: "8px", fontSize: 12, color: "#00D4AA", cursor: "pointer", fontWeight: 600 }}>
                              <Copy size={11} /> Copy command
                            </button>
                            <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, justifyContent: "center", background: "rgba(42,171,238,0.08)", border: "1px solid rgba(42,171,238,0.2)", borderRadius: 8, padding: "8px", fontSize: 12, color: "#2AABEE", textDecoration: "none", fontWeight: 600 }}>
                              <ExternalLink size={11} /> Open Bot
                            </a>
                          </div>
                        </div>
                      )}
                      {polling && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                          <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Waiting for connection...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connected UI */}
                {tgConnected && (
                  <>
                    {/* New alert button */}
                    {!showForm && (
                      <button onClick={() => setShowForm(true)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "rgba(0,212,170,0.06)", border: "1px dashed rgba(0,212,170,0.25)", borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 600, color: "#00D4AA", cursor: "pointer", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,170,0.1)"; e.currentTarget.style.borderColor = "rgba(0,212,170,0.4)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,212,170,0.06)"; e.currentTarget.style.borderColor = "rgba(0,212,170,0.25)" }}>
                        <Plus size={16} /> New alert
                      </button>
                    )}

                    {/* Form */}
                    {showForm && (
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, animation: "fadeIn 0.3s ease" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 18 }}>Create new alert</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                          {[
                            { label: "Asset", key: "asset", options: ASSETS },
                            { label: "Protocol", key: "protocol", options: PROTOCOLS },
                            { label: "Direction", key: "direction", options: ["above", "below"] },
                          ].map(f => (
                            <div key={f.key}>
                              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{f.label}</div>
                              <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 13, color: "#fff", outline: "none" }}>
                                {f.options.map(o => <option key={o} value={o} style={{ background: "#131820" }}>{o}</option>)}
                              </select>
                            </div>
                          ))}
                          <div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>APY %</div>
                            <input type="number" placeholder="e.g. 12" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))}
                              style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 13, color: "#fff", outline: "none", boxSizing: "border-box" as const }} />
                          </div>
                        </div>

                        {form.threshold && (
                          <div style={{ background: "rgba(0,212,170,0.05)", border: "1px solid rgba(0,212,170,0.12)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, animation: "fadeIn 0.2s ease" }}>
                            📲 When <strong style={{ color: "#fff" }}>{form.asset}</strong> on <strong style={{ color: "#fff" }}>{form.protocol}</strong> goes <strong style={{ color: "#fff" }}>{form.direction}</strong> <strong style={{ color: "#00D4AA" }}>{form.threshold}%</strong> → Telegram message
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={createAlert} disabled={saving || !form.threshold}
                            style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", background: form.threshold ? "#00D4AA" : "rgba(255,255,255,0.05)", color: form.threshold ? "#000" : "rgba(255,255,255,0.3)", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: form.threshold ? "pointer" : "not-allowed" }}>
                            {saving && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
                            Create alert
                          </button>
                          <button onClick={() => setShowForm(false)}
                            style={{ flex: 1, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 12, fontSize: 14, cursor: "pointer" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Alerts list */}
                    {loading ? (
                      <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)" }}>
                        <Loader2 size={22} style={{ animation: "spin 1s linear infinite", margin: "0 auto 10px", display: "block" }} />
                        Loading alerts...
                      </div>
                    ) : alerts.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>
                        <Bell size={32} style={{ margin: "0 auto 14px", opacity: 0.2, display: "block", color: "#fff" }} />
                        <div style={{ fontSize: 16, color: "#fff", marginBottom: 6, fontWeight: 600 }}>No alerts yet</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>Create your first alert to get notified when yields hit your targets</div>
                        <button onClick={() => setShowForm(true)}
                          style={{ background: "#00D4AA", color: "#000", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                          Create first alert
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {alerts.map(a => (
                          <div key={a.id}
                            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${a.active ? "rgba(0,212,170,0.15)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "16px 18px", transition: "border-color 0.2s" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                                <div style={{ width: 38, height: 38, borderRadius: "50%", background: a.active ? "rgba(0,212,170,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${a.active ? "rgba(0,212,170,0.25)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Bell size={14} style={{ color: a.active ? "#00D4AA" : "rgba(255,255,255,0.3)" }} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 3 }}>
                                    {a.asset} · {a.direction} {a.threshold.toFixed(2)}%
                                  </div>
                                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                                    {a.protocol} · <span style={{ color: a.active ? "#00D4AA" : "rgba(255,255,255,0.3)" }}>{a.active ? "Active" : "Paused"}</span>
                                    {a.lastTriggered ? ` · Last: ${new Date(a.lastTriggered).toLocaleDateString()}` : ""}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                                <button onClick={() => toggleAlert(a)}
                                  style={{ width: 44, height: 24, borderRadius: 12, position: "relative", background: a.active ? "#00D4AA" : "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                                  <div style={{ position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: a.active ? 23 : 3 }} />
                                </button>
                                <button onClick={() => deleteAlert(a)}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 4, transition: "color 0.15s" }}
                                  onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) {
          .alerts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}