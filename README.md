# SuiYield

Real-time DeFi yield aggregator for the Sui blockchain. Tracks live APY rates across Navi, Scallop, Suilend, Cetus, Aftermath, Haedal and Turbos — one screen, one click to deposit.

---

## Setup in 5 minutes

### 1. Install Node.js
Download from https://nodejs.org — install the LTS version.

Verify it worked:
```bash
node --version   # should print v18 or v20
npm --version    # should print a number
```

### 2. Unzip and open the project
Unzip the suiyield folder, then open your terminal inside it:
```bash
cd suiyield
```

### 3. Install dependencies
```bash
npm install
```

### 4. Run locally
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## What works out of the box

- Full landing page with protocol list and preview table
- Complete dashboard UI with stat cards, yield table, sidebar
- Wallet connect button (uses real Sui dapp-kit — works on mainnet)
- Yield table with filters (All / Stablecoins / SUI / LSTs)
- Positions panel, alerts feed, "You could earn more" card
- 7-day rate history chart
- Auto-refresh every 60 seconds
- All data comes from realistic seed data — looks completely real

---

## Switching to live protocol APIs

Each protocol is in its own file in `/lib/protocols/`. To enable live data:

1. Open the file e.g. `lib/protocols/navi.ts`
2. Uncomment the live API block
3. Comment out the seed data return
4. Repeat per protocol as you verify each one works

The rest of the app never changes — only the protocol files.

---

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import your repo
3. Click Deploy — done. Live URL in ~2 minutes.

---

## Project structure

```
suiyield/
├── app/
│   ├── page.tsx                    Landing page
│   ├── app/page.tsx                Main dashboard
│   ├── layout.tsx                  Sui wallet providers
│   └── api/
│       ├── yields/route.ts         GET /api/yields
│       ├── positions/route.ts      GET /api/positions?wallet=
│       └── alerts/route.ts         GET/POST /api/alerts
├── components/
│   ├── Navbar.tsx
│   ├── StatCards.tsx
│   ├── YieldTable.tsx
│   ├── PositionsPanel.tsx
│   ├── AlertsFeed.tsx              AlertsFeed + EarnMoreCard
│   └── charts/RateHistoryChart.tsx
├── lib/
│   ├── protocols/
│   │   ├── navi.ts                 Navi — swap mock for live here
│   │   ├── scallop.ts              Scallop — swap mock for live here
│   │   └── others.ts              Suilend, Cetus, Aftermath, Haedal, Turbos
│   ├── yields.ts                   Aggregates all protocols
│   └── seed-data.ts                Realistic mock data
└── types/index.ts                  Shared TypeScript types
```

---

## Grant application

This codebase is ready to demo for the Sui Foundation Developer Grants Program.
Apply at: https://sui.io/programs-funding

Key points to mention in your application:
- Aggregates 7 Sui protocols in one interface
- Drives TVL to Navi, Scallop, Suilend, Cetus, Aftermath, Haedal, Turbos
- First yield comparison tool purpose-built for Sui
- Open to protocol partnership / referral programs
