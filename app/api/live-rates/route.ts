import { NextResponse } from 'next/server'

let cache: { data: LiveRate[]; timestamp: number } | null = null
const CACHE_MS = 5 * 60 * 1000

export interface LiveRate {
  protocol: string
  pool: string
  symbol: string
  apyBase: number
  apyReward: number
  tvlUsd: number
  source: 'live'
}

// ── Navi ─────────────────────────────────────────────────────────────────────
// ── Navi ─────────────────────────────────────────────────────────────────────
// Known Navi pool coin types with clean symbol names
// ── Navi ─────────────────────────────────────────────────────────────────────
const NAVI_POOLS: { coinType: string; symbol: string }[] = [
  { coinType: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI', symbol: 'SUI' },
  { coinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC', symbol: 'USDC' },
  { coinType: '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT', symbol: 'USDT' },
  { coinType: '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH', symbol: 'ETH' },
  { coinType: '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX', symbol: 'NAVX' },
  { coinType: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI', symbol: 'haSUI' },
  { coinType: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT', symbol: 'vSUI' },
  { coinType: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS', symbol: 'CETUS' },
  { coinType: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP', symbol: 'DEEP' },
  { coinType: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL', symbol: 'WAL' },
  { coinType: '0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY', symbol: 'USDY' },
  { coinType: '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD', symbol: 'FDUSD' },
  { coinType: '0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK', symbol: 'BUCK' },
  { coinType: '0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD', symbol: 'AUSD' },
  { coinType: '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS', symbol: 'NS' },
  { coinType: '0x3a304c7feba2d819ea57c3542d68439ca2c386ba02159c740f7b406e592c62ea::haedal::HAEDAL', symbol: 'HAEDAL' },
  { coinType: '0x7262fb2f7a3a14c888c438a3cd9b912469a58cf60f367352c46584262e8299aa::ika::IKA', symbol: 'IKA' },
  { coinType: '0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE', symbol: 'BLUE' },
  { coinType: '0x876a4b7bce8aeaef60464c11f4026903e9afacab79b9b142686158aa86560b50::xbtc::XBTC', symbol: 'XBTC' },
  { coinType: '0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI', symbol: 'stSUI' },
  { coinType: '0x44f838219cf67b058f3b37907b655f226153c18e33dfcd0da559a844fea9b1c1::usdsui::USDSUI', symbol: 'USDsui' },
  { coinType: '0x41d587e5336f1c86cad50d38a7136db99333bb9bda91cea4ba69115defeb1402::sui_usde::SUI_USDE', symbol: 'suiUSDe' },
  { coinType: '0x9d297676e7a4b771ab023291377b2adfaa4938fb9080b8d12430e4b108b836a9::xaum::XAUM', symbol: 'XAUm' },
  { coinType: '0xa03ab7eee2c8e97111977b77374eaf6324ba617e7027382228350db08469189e::ybtc::YBTC', symbol: 'YBTC' },
  { coinType: '0xd1a91b46bd6d966b62686263609074ad16cfdffc63c31a4775870a2d54d20c6b::mbtc::MBTC', symbol: 'MBTC' },
  { coinType: '0x3e8e9423d80e1774a7ca128fccd8bf5f1f7753be658c5e645929037f7c819040::lbtc::LBTC', symbol: 'LBTC' },
  { coinType: '0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC', symbol: 'BTC' },
  { coinType: '0x5f496ed5d9d045c5b788dc1bb85f54100f2ede11e46f6a232c29daada4c5bdb6::coin::COIN', symbol: 'afSUI' },
  { coinType: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN', symbol: 'suiETH' },
  { coinType: '0x8f2b5eb696ed88b71fea398d330bccfa52f6e2a5a8e1ac6180fcb25c6de42ebc::coin::COIN', symbol: 'stBTC' },
  { coinType: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN', symbol: 'wUSDC' },
  { coinType: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN', symbol: 'wUSDT' },
  { coinType: '0x0041f9f9344cac094454cd574e333c4fdb132d7bcc9379bcd4aab485b2a63942::wbtc::WBTC', symbol: 'wBTC' },
]

async function getNaviRates(): Promise<LiveRate[]> {
  try {
    const { getPool } = await import('@naviprotocol/lending')
    const results: LiveRate[] = []

    for (const { coinType, symbol } of NAVI_POOLS) {
      try {
        const pool = await getPool(coinType) as any
        if (!pool || pool.isDeprecated) continue

        // supplyIncentiveApyInfo.apy = full boosted APY (base + incentives)
        // supplyIncentiveApyInfo.vaultApr = base only
        const supplyInfo = pool.supplyIncentiveApyInfo
        const apyBase = Number(supplyInfo?.vaultApr ?? 0)
        const apyReward = Number(supplyInfo?.boostedApr ?? 0)
        // apy = apyBase + apyReward (total shown on Navi's site)

        // poolSupplyValue = TVL in USD (already converted, not raw units)
        const tvlUsd = Number(pool.poolSupplyValue ?? 0)

        results.push({
          protocol: 'navi',
          pool: symbol,
          symbol,
          apyBase,
          apyReward,
          tvlUsd,
          source: 'live' as const,
        })

        console.log(`[navi] ${symbol}: base=${apyBase.toFixed(2)}% boost=${apyReward.toFixed(2)}% total=${(apyBase + apyReward).toFixed(2)}% tvl=$${tvlUsd.toLocaleString()}`)
      } catch (e) {
        console.log(`[navi] getPool(${symbol}) failed:`, e)
      }
    }

    return results
  } catch (err) {
    console.error('[live-rates] Navi error:', err)
    return []
  }
}

// ── Scallop ───────────────────────────────────────────────────────────────────
const SCALLOP_DECIMALS: Record<string, number> = {
  usdc: 6, sbusdt: 6, wusdc: 6, wusdt: 6, fdusd: 6, musd: 6, usdy: 6, usdsui: 6,
  sbeth: 8, weth: 8, sbwbtc: 8, wbtc: 8, zwbtc: 8, xbtc: 8,
  sui: 9, afsui: 9, hasui: 9, vsui: 9, haedal: 9, hawal: 9, wal: 9, wwal: 9,
  cetus: 9, sca: 9, deep: 6, ns: 6, blub: 9, fud: 9,
  wapt: 8, wsol: 9, xaum: 9, suiusde: 9,
}

function scallopTvlUsd(coinName: string, pool: any): number {
  const decimals = SCALLOP_DECIMALS[coinName] ?? 9
  const rawAmount = Number(pool.supplyAmount ?? pool.marketCoinSupplyAmount ?? 0)
  const price = Number(pool.coinPrice ?? 1)
  return (rawAmount / Math.pow(10, decimals)) * price
}

async function getScallopRates(): Promise<LiveRate[]> {
  try {
    const { Scallop } = await import('@scallop-io/sui-scallop-sdk')
    const scallop = new Scallop({ networkType: 'mainnet' })
    const scallopQuery = await scallop.createScallopQuery()
    const market = await scallopQuery.getMarketPools()

    if (!market) return []

    const lendingPools = (market as any).pools ?? market
    const results: LiveRate[] = []

    for (const [coinName, pool] of Object.entries(lendingPools)) {
      if (!pool) continue
      const p = pool as any

      const apyBase = Number(p.supplyApy ?? p.supply_apy ?? p.depositApy ?? 0) * 100
      const tvlUsd = scallopTvlUsd(coinName, p)

      if (tvlUsd < 1000 && apyBase === 0) continue

      results.push({
        protocol: 'scallop',
        pool: coinName.toUpperCase(),
        symbol: p.symbol ?? coinName.toUpperCase(),
        apyBase,
        apyReward: Number(p.rewardApy ?? p.reward_apy ?? 0) * 100,
        tvlUsd,
        source: 'live' as const,
      })
    }

    return results
  } catch (err) {
    console.error('[live-rates] Scallop error:', err)
    return []
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_MS) {
    return NextResponse.json({ data: cache.data, cached: true, timestamp: cache.timestamp })
  }

  const [naviRates, scallopRates] = await Promise.allSettled([
    getNaviRates(),
    getScallopRates(),
  ])

  const data: LiveRate[] = [
    ...(naviRates.status === 'fulfilled' ? naviRates.value : []),
    ...(scallopRates.status === 'fulfilled' ? scallopRates.value : []),
  ]

  cache = { data, timestamp: Date.now() }

  return NextResponse.json({
    data,
    cached: false,
    timestamp: cache.timestamp,
    counts: {
      navi: naviRates.status === 'fulfilled' ? naviRates.value.length : 0,
      scallop: scallopRates.status === 'fulfilled' ? scallopRates.value.length : 0,
    },
  })
}