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
  coinType?: string
  decimals?: number
  source: 'live'
}

// ── Navi ─────────────────────────────────────────────────────────────────────
// Cache pool list for 1 hour — new pools are rare
let naviPoolListCache: { coinTypes: string[]; ts: number } | null = null
const POOL_LIST_TTL = 60 * 60 * 1000

async function getNaviPoolCoinTypes(): Promise<string[]> {
  if (naviPoolListCache && Date.now() - naviPoolListCache.ts < POOL_LIST_TTL) {
    return naviPoolListCache.coinTypes
  }
  try {
    const { getPools } = await import('@naviprotocol/lending')
    const pools = await getPools()
    // getPools() returns array of coin type strings
    const coinTypes = Array.isArray(pools)
      ? pools.map((p: any) => typeof p === 'string' ? p : p?.suiCoinType ?? p?.coinType ?? '').filter(Boolean)
      : []
    naviPoolListCache = { coinTypes, ts: Date.now() }
    console.log(`[navi] discovered ${coinTypes.length} pools dynamically`)
    return coinTypes
  } catch (e) {
    console.log('[navi] getPools() failed, using fallback list:', e)
    // Fallback to known stable list if dynamic fetch fails
    return NAVI_FALLBACK_POOLS
  }
}

// Fallback list — only used if getPools() fails
const NAVI_FALLBACK_POOLS = [
  '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
  '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
  '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT',
  '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH',
  '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX',
  '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI',
  '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
  '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
  '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
  '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
  '0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY',
  '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD',
  '0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK',
  '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS',
  '0x3a304c7feba2d819ea57c3542d68439ca2c386ba02159c740f7b406e592c62ea::haedal::HAEDAL',
  '0x7262fb2f7a3a14c888c438a3cd9b912469a58cf60f367352c46584262e8299aa::ika::IKA',
  '0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE',
  '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
  '0x44f838219cf67b058f3b37907b655f226153c18e33dfcd0da559a844fea9b1c1::usdsui::USDSUI',
]

async function getNaviRates(): Promise<LiveRate[]> {
  try {
    const { getPool } = await import('@naviprotocol/lending')
    const coinTypes = await getNaviPoolCoinTypes()
    const results: LiveRate[] = []

    // Fetch all pools in parallel — much faster than sequential
    const poolResults = await Promise.allSettled(
      coinTypes.map(coinType => getPool(coinType).then(pool => ({ coinType, pool })))
    )

    for (const result of poolResults) {
      if (result.status !== 'fulfilled') continue
      const { coinType, pool } = result.value as any
      if (!pool || pool.isDeprecated) continue

      const symbol = pool.token?.symbol ?? coinType.split('::').pop() ?? '?'
      const supplyInfo = pool.supplyIncentiveApyInfo
      const apyBase = Number(supplyInfo?.vaultApr ?? 0)
      const apyReward = Number(supplyInfo?.boostedApr ?? 0)
      const tvlUsd = Number(pool.poolSupplyValue ?? 0)

      // Skip pools with no meaningful data
      if (apyBase === 0 && apyReward === 0 && tvlUsd === 0) continue

      results.push({
  protocol: 'navi',
  pool: symbol.toUpperCase(),
  symbol: symbol.toUpperCase(),
  apyBase,
  apyReward,
  tvlUsd,
  coinType: coinType, // add this
  decimals: pool.token?.decimals ?? 9, // add this
  source: 'live' as const,
})


    }

    console.log(`[navi] fetched ${results.length} active pools`)
    return results
  } catch (err) {
    console.error('[live-rates] Navi error:', err)
    return []
  }
}

// ── Scallop ───────────────────────────────────────────────────────────────────
// Scallop SDK returns decimals and price on each pool — no hardcoding needed
function scallopTvlUsd(coinName: string, pool: any): number {
  // Use coinPrice from SDK — it's already there
  const price = Number(pool.coinPrice ?? 1)
  const rawAmount = Number(pool.supplyAmount ?? pool.marketCoinSupplyAmount ?? 0)
  // Get decimals from SDK pool data if available, fallback to common values
  const decimals = pool.decimals ?? (
    ['usdc','sbusdt','wusdc','wusdt','fdusd','musd','usdy','usdsui','deep','ns','fdusd'].includes(coinName) ? 6 :
    ['sbeth','weth','sbwbtc','wbtc','zwbtc','xbtc'].includes(coinName) ? 8 : 9
  )
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
      const apyReward = Number(p.rewardApy ?? p.reward_apy ?? 0) * 100


      results.push({
  protocol: 'scallop',
  pool: coinName.toUpperCase(),
  symbol: p.symbol ?? coinName.toUpperCase(),
  apyBase,
  apyReward,
  tvlUsd,
  coinType: p.coinType ?? '', // add this
  decimals: p.decimals ?? 9,  // add this
  source: 'live' as const,
})
    }

    console.log(`[scallop] fetched ${results.length} pools`)
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