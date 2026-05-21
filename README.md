# SuiYield — DeFi Yield Aggregator on Sui

> **Find the best yield across Sui — instantly.**

SuiYield is a real-time DeFi yield aggregator and portfolio manager built on the Sui blockchain. It aggregates lending, DEX, and staking yields across every major Sui protocol, reads on-chain positions directly, and uses AI to help users optimize where their capital earns.

**Live:** [suiyield-umzj.vercel.app](https://suiyield-umzj.vercel.app)

---

## What It Does

- **Yield aggregation** — 113+ live pools from Navi, Scallop, Cetus, Bluefin, Turbos, Kai Finance, Current, and more. Updated every 5 minutes from DeFiLlama + live protocol SDKs.
- **Live position reading** — reads your real on-chain positions from Navi Protocol, Scallop, Cetus CLMM, and Haedal. No manual input required.
- **AI Yield Advisor** — Claude-powered portfolio analysis that reads your positions and wallet tokens, identifies yield inefficiencies, and gives actionable move suggestions with specific APY numbers.
- **Telegram alerts** — set threshold alerts for any protocol or asset. Get notified instantly when rates move above your target.
- **Swap** — integrated Cetus aggregator for token swaps directly in the app.
- **Portfolio tracking** — full wallet + DeFi position overview with 30-day chart reconstructed from on-chain data.

---

## Architecture

```
suiyield/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── app/
│   │   ├── page.tsx                # Dashboard — yield table + AI advisor
│   │   ├── explore/page.tsx        # Pool explorer with trending section
│   │   ├── positions/page.tsx      # Live position reader
│   │   ├── portfolio/page.tsx      # Full portfolio view
│   │   ├── alerts/page.tsx         # Telegram alert management
│   │   └── swap/page.tsx           # Cetus swap integration
│   └── api/
│       ├── yields/route.ts         # DeFiLlama yield aggregation
│       ├── live-rates/route.ts     # Live rates from Navi + Scallop SDKs
│       ├── positions/
│       │   ├── navi/route.ts       # On-chain Navi positions
│       │   ├── scallop/route.ts    # On-chain Scallop positions
│       │   ├── cetus/route.ts      # On-chain Cetus CLMM positions
│       │   └── haedal/route.ts     # Haedal haSUI/haWAL balances
│       ├── ai-analysis/route.ts    # Claude AI portfolio advisor
│       ├── swap/route.ts           # Cetus 7k aggregator swap
│       ├── swap-quote/route.ts     # Swap quote fetcher
│       ├── alerts/route.ts         # Alert CRUD
│       ├── alerts/check/route.ts   # Cron alert checker
│       └── wallet-tokens/route.ts  # Wallet token balances
├── components/
│   ├── Navbar.tsx
│   ├── YieldTable.tsx
│   ├── AiAdvisor.tsx
│   ├── PositionsFetcher.tsx
│   ├── PositionsPanel.tsx
│   ├── DepositModal.tsx
│   └── AlertsFeed.tsx
└── lib/
    ├── defillama.ts                # DeFiLlama fetcher + protocol metadata
    └── seed-data.ts                # Fallback data
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Blockchain | Sui Mainnet |
| Wallet | `@mysten/dapp-kit` |
| Sui SDK | `@mysten/sui@1.21.0` |
| Navi SDK | `@naviprotocol/lending` |
| Scallop SDK | `@scallop-io/sui-scallop-sdk` |
| Swap | `@7kprotocol/sdk-ts` |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Yield Data | DeFiLlama API |
| Prices | DeFiLlama Coins API (CoinGecko) |
| Alerts | Telegram Bot API |
| Deploy | Vercel |

---

## Position Reading — How It Works

Unlike most yield aggregators that only show rates, SuiYield reads your actual on-chain positions:

### Navi Protocol
Uses `@naviprotocol/lending` SDK to fetch supply positions including boosted APY from incentives.

### Scallop
Uses Scallop SDK to read lending positions with reward breakdown.

### Cetus CLMM
Reads position NFTs directly via Sui RPC (`getOwnedObjects`), fetches pool state for current sqrt price, then uses Uniswap V3 math to calculate token amounts from liquidity and tick ranges. USD values calculated from DeFiLlama price feed.

### Haedal
Reads `haSUI` and `haWAL` coin balances directly via `getAllBalances`. APR fetched from DeFiLlama.

---

## AI Yield Advisor

The AI advisor calls Claude's API with:
- Your current positions (protocol, asset, USD value, APY)
- Live rates from all Sui protocols
- Wallet token balances (idle capital)

Claude returns structured JSON with a portfolio score, insights categorized as opportunities/risks/signals, and specific move recommendations with APY numbers. Results are cached in sessionStorage for 10 minutes.

---

## Alerts System

Alerts are stored in Upstash Redis. A Vercel cron job hits `/api/alerts/check` daily, comparing live rates against user thresholds and sending Telegram messages via the bot API.

Bot: `@Suiyield_alerts_bot`

---

## Environment Variables

```env
TELEGRAM_BOT_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=https://suiyield-umzj.vercel.app
```

---

## Running Locally

```bash
git clone https://github.com/semi1390/suiyield.git
cd suiyield
npm install
cp .env.example .env.local
# Fill in your env vars
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

```bash
./deploy.ps1   # Pushes to GitHub + deploys to Vercel
```

---

## Hackathon — Sui Overflow 2026

**Track:** DeFi & Payments — Capital Management Tools

SuiYield fits the "Vaults & Capital Management" and "Financial Automation" categories:
- Reads real on-chain positions across 4 protocols
- AI identifies yield inefficiencies and suggests capital moves
- Telegram alerts automate rate monitoring
- Cross-protocol move suggestions (coming: PTB-based rebalancing)

**Submission:** Sui Overflow 2026 (deadline June 21, 2026)

---

## Protocols Supported

| Protocol | Type | Data Source |
|----------|------|-------------|
| Navi Protocol | Lending | Live SDK |
| Scallop | Lending | Live SDK |
| Cetus | DEX LP | DeFiLlama + On-chain positions |
| Bluefin | DEX LP | DeFiLlama |
| Turbos | DEX LP | DeFiLlama |
| Full Sail | DEX LP | DeFiLlama |
| FlowX | DEX LP | DeFiLlama |
| Kai Finance | Lending | DeFiLlama |
| Current Finance | Lending | DeFiLlama |
| Haedal | LST Staking | On-chain balances |
| Aftermath | LST Staking | Seed data |
| Volo | LST Staking | Seed data |

---

## Roadmap

- [ ] Cetus CLMM live APR (pending Cetus API access)
- [ ] PTB-based cross-protocol rebalancing (one-click move funds)
- [ ] Haedal/Aftermath live staking APR from protocol APIs
- [ ] More protocols: Suilend, SpringSui, AlphaFi
- [ ] Email alerts in addition to Telegram
- [ ] Mobile app (React Native)

---

## License

MIT

---

*Built with ❤️ on Sui · Not financial advice*