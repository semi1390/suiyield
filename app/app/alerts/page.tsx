"use client"
import { useState } from "react"
import Navbar from "@/components/Navbar"
import { Bell, Plus, Trash2, Check } from "lucide-react"
import { SEED_ALERTS } from "@/lib/seed-data"
import type { AlertItem } from "@/types"

const ASSETS = ["USDC", "USDT", "SUI", "afSUI", "haSUI", "WBTC", "WETH"]
const PROTOCOLS = ["Any protocol", "Navi Protocol", "Scallop", "Suilend", "Cetus LP", "Aftermath", "Haedal"]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(SEED_ALERTS)
  const [showForm, setShowForm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ asset: "USDC", threshold: "", direction: "above", protocol: "Any protocol" })

  const toggle = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
  const remove = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id))

  const addAlert = () => {
    if (!form.threshold) return
    const newAlert: AlertItem = {
      id: Date.now().toString(),
      message: `${form.asset} on ${form.protocol} ${form.direction} ${form.threshold}%`,
      type: "increase",
      time: "Just now",
      active: true,
      asset: form.asset
    }
    setAlerts(prev => [newAlert, ...prev])
    setShowForm(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setForm({ asset: "USDC", threshold: "", direction: "above", protocol: "Any protocol" })
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <Navbar />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Rate Alerts</h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Get notified when yields hit your targets</p>
          </div>
          <button onClick={() => setShowForm(s => !s)} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--green)", color: "#000", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer"
          }}>
            <Plus size={15} /> New alert
          </button>
        </div>

        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "10px 16px", marginBottom: 16, color: "var(--green)", fontSize: 13, fontWeight: 500 }}>
            <Check size={14} /> Alert created successfully
          </div>
        )}

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
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>{f.label}</div>
                  <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", outline: "none" }}>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase" }}>APY threshold (%)</div>
                <input type="number" placeholder="e.g. 12" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text-primary)", outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={addAlert} style={{ background: "var(--green)", color: "#000", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Create alert</button>
              <button onClick={() => setShowForm(false)} style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 20px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Alerts list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map(a => (
            <div key={a.id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: a.active ? "var(--green-bg)" : "var(--bg-elevated)",
                  border: `1px solid ${a.active ? "var(--green-border)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Bell size={16} style={{ color: a.active ? "var(--green)" : "var(--text-muted)" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 3 }}>{a.message}</div>
                  <div style={{ fontSize: 12, color: a.active ? "var(--green)" : "var(--text-muted)" }}>
                    {a.active ? `Active · ${a.time}` : "Paused"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => toggle(a.id)} style={{
                  width: 44, height: 24, borderRadius: 12, position: "relative",
                  background: a.active ? "var(--green)" : "var(--bg-elevated)",
                  border: `1px solid ${a.active ? "var(--green)" : "var(--border)"}`,
                  cursor: "pointer", transition: "background 0.2s"
                }}>
                  <div style={{ position: "absolute", top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", left: a.active ? 25 : 3 }} />
                </button>
                <button onClick={() => remove(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {alerts.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 40px", color: "var(--text-muted)" }}>
            <Bell size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <div style={{ fontSize: 15, marginBottom: 6 }}>No alerts yet</div>
            <div style={{ fontSize: 13 }}>Create an alert to get notified when yields hit your targets</div>
          </div>
        )}
      </div>
    </div>
  )
}
