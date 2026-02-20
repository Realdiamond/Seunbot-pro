'use client';

import { useMemo, useState, useEffect } from 'react';
import { Asset, Market } from '@/types';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

const markets: (Market | 'All')[] = ['All', 'NGX', 'US Stocks', 'Forex', 'Crypto'];

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

// Map exchange to market category
const exchangeToMarket = (exchange: string): Market => {
  const exchangeUpper = exchange.toUpperCase();
  if (exchangeUpper.includes('NSENG') || exchangeUpper.includes('NGX')) return 'NGX';
  if (exchangeUpper.includes('NYSE') || exchangeUpper.includes('NASDAQ') || exchangeUpper.includes('US')) return 'US Stocks';
  if (exchangeUpper.includes('FOREX') || exchangeUpper.includes('FX')) return 'Forex';
  if (exchangeUpper.includes('CRYPTO') || exchangeUpper.includes('BTC') || exchangeUpper.includes('ETH')) return 'Crypto';
  return 'NGX'; // Default
};

const formatRelativeTime = (isoDate: string) => {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = Math.max(0, now - then);

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const calculateLevels = (entry?: number, stopLossPct?: number, tp1Pct?: number, tp2Pct?: number, signal?: string) => {
  if (!entry || !stopLossPct || !tp1Pct || !tp2Pct || !signal) {
    return { sl: 0, tp1: 0, tp2: 0 };
  }

  if (signal === 'SELL') {
    return {
      sl: entry * (1 + stopLossPct / 100),
      tp1: entry * (1 - tp1Pct / 100),
      tp2: entry * (1 - tp2Pct / 100),
    };
  }

  if (signal === 'HOLD') {
    return { sl: 0, tp1: 0, tp2: 0 };
  }

  return {
    sl: entry * (1 - stopLossPct / 100),
    tp1: entry * (1 + tp1Pct / 100),
    tp2: entry * (1 + tp2Pct / 100),
  };
};

type SignalFilter = 'BUY' | 'SELL';

export default function Home() {
  const [selectedMarket, setSelectedMarket] = useState<Market | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('BUY');
  const [isDark, setIsDark] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  // Set sidebar initial state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/Assets`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }

        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // Map exchange to market category
          const mappedAssets = data.data.map((asset: any) => ({
            ...asset,
            market: exchangeToMarket(asset.exchange || ''),
          }));
          setAssets(mappedAssets);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assets');
        console.error('Error fetching assets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    let filtered = selectedMarket === 'All'
      ? assets
      : assets.filter((asset) => asset.market === selectedMarket);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (asset) => asset.symbol.toLowerCase().includes(query) || asset.name.toLowerCase().includes(query)
      );
    }

    // Filter by signal type (BUY or SELL) if signal exists, and sort by strength (high to low)
    filtered = filtered
      .filter((asset) => !asset.signal || asset.signal === signalFilter)
      .sort((a, b) => (b.strength || 0) - (a.strength || 0));

    return filtered;
  }, [selectedMarket, searchQuery, signalFilter, assets]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMarket, searchQuery, signalFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAssets.slice(startIndex, endIndex);
  }, [filteredAssets, currentPage, ITEMS_PER_PAGE]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0b0f16] text-white' : 'bg-[#f6f6f8] text-slate-900'}`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          isDark={isDark} 
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden h-9 w-9 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}
              >
                ☰
              </button>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Market Signals</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`h-9 w-9 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white lg:border lg:border-white/10 lg:bg-white/5' : 'text-gray-600 hover:text-slate-900 lg:border lg:border-gray-300 lg:bg-gray-100'}`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className={`h-9 w-9 rounded-lg relative transition-colors ${isDark ? 'text-gray-300 hover:text-white lg:border lg:border-white/10 lg:bg-white/5' : 'text-gray-600 hover:text-slate-900 lg:border lg:border-gray-300 lg:bg-gray-100'}`}
                >
                  🔔
                  <span className="absolute top-1 right-1 h-2 w-2 bg-teal-500 rounded-full"></span>
                </button>
                {notificationOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-lg border shadow-xl z-50 ${isDark ? 'border-white/10 bg-[#0f1520]' : 'border-gray-200 bg-white'}`}>
                    <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className={`p-4 border-b ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-gray-100'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>New BUY signal: BTC</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                      <div className={`p-4 border-b ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-gray-100'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>TSLA reached TP1</p>
                        <p className="text-xs text-gray-500">15 minutes ago</p>
                      </div>
                      <div className={`p-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <p className={`text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Market analysis updated</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/profile" className={`hidden lg:flex h-9 w-9 rounded-lg border items-center justify-center ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-slate-900'}`}>👤</Link>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5">
              <div className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Home / Dashboard</div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search symbols (e.g., TSLA, BTC)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'border-white/10 bg-[#0f1520] text-white placeholder-gray-500' : 'border-gray-300 bg-white text-slate-900 placeholder-gray-400'}`}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className={`rounded-lg border px-3 py-2.5 text-sm transition-colors ${isDark ? 'border-white/10 bg-[#0f1520] text-gray-300 hover:text-white' : 'border-gray-300 bg-white text-gray-600 hover:text-slate-900'}`}
                  >
                    ⟳
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                  {markets.map((market) => (
                    <button
                      key={market}
                      onClick={() => setSelectedMarket(market)}
                      className={`rounded-lg px-2 py-1.5 lg:px-4 lg:py-2 text-xs lg:text-sm font-medium transition-all ${
                        selectedMarket === market
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                          : isDark ? 'border border-white/10 text-gray-400 hover:text-white hover:bg-white/5' : 'border border-gray-300 text-gray-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {market}
                    </button>
                  ))}
                  
                  <div className="ml-auto flex items-center gap-2">
                    <span className={`hidden lg:inline text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Filter by Signal:</span>
                    <div className={`flex rounded-lg border p-0.5 lg:p-1 ${isDark ? 'border-white/10 bg-[#0f1520]' : 'border-gray-300 bg-white'}`}>
                      <button
                        onClick={() => setSignalFilter('BUY')}
                        className={`px-2 py-1 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all ${
                          signalFilter === 'BUY'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setSignalFilter('SELL')}
                        className={`px-2 py-1 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all ${
                          signalFilter === 'SELL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'
                        }`}
                      >
                        Sell
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-6 rounded-xl border overflow-hidden ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className={`text-xs uppercase tracking-widest ${isDark ? 'bg-[#0f1520] text-gray-500' : 'bg-slate-100 text-gray-600'}`}>
                      <tr>
                        <th className="px-3 lg:px-5 py-3 text-left">Asset</th>
                        <th className="px-3 lg:px-5 py-3 text-left">Market</th>
                        <th className="hidden lg:table-cell px-5 py-3 text-left">Signal</th>
                        <th className="hidden lg:table-cell px-5 py-3 text-left">Strength</th>
                        <th className="hidden lg:table-cell px-5 py-3 text-left">Entry</th>
                        <th className="hidden lg:table-cell px-5 py-3 text-left">SL</th>
                        <th className="hidden lg:table-cell px-5 py-3 text-left">TP1</th>
                        <th className="hidden lg:table-cell px-5 py-3 text-left">TP2</th>
                        <th className="hidden lg:table-cell px-5 py-3 text-left">Time</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? 'divide-y divide-white/5' : 'divide-y divide-gray-200'}`}>
                      {loading ? (
                        <tr>
                          <td colSpan={2} className="lg:hidden px-5 py-16 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-5 w-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</span>
                            </div>
                          </td>
                          <td colSpan={9} className="hidden lg:table-cell px-5 py-16 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-5 w-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading assets...</span>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={2} className="lg:hidden px-5 py-16 text-center">
                            <div className="text-red-400 text-sm mb-2">{error}</div>
                            <button
                              onClick={() => window.location.reload()}
                              className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 text-sm"
                            >
                              Retry
                            </button>
                          </td>
                          <td colSpan={9} className="hidden lg:table-cell px-5 py-16 text-center">
                            <div className="text-red-400">{error}</div>
                            <button
                              onClick={() => window.location.reload()}
                              className="mt-3 px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
                            >
                              Retry
                            </button>
                          </td>
                        </tr>
                      ) : (
                        paginatedAssets.map((asset) => {
                          const levels = calculateLevels(asset.entry, asset.stopLoss, asset.takeProfit1, asset.takeProfit2, asset.signal);
                          const strengthBars = Math.round(asset.strength || 0);

                          return (
                            <tr
                              key={asset.symbol}
                              onClick={() => window.location.href = `/asset/${asset.symbol}`}
                              className={`cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                            >
                              <td className="px-3 lg:px-5 py-3 lg:py-4">
                                <div className="flex items-center gap-2 lg:gap-3">
                                  <div className={`h-6 w-6 lg:h-8 lg:w-8 rounded-md flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                                    {asset.symbol.slice(0, 1)}
                                  </div>
                                  <div>
                                    <div className={`font-semibold text-sm lg:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.symbol}</div>
                                    <div className="text-xs text-gray-500">{asset.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 lg:px-5 py-3 lg:py-4">
                                <span className={`rounded-md border px-2 py-1 text-xs ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-300 bg-slate-100 text-gray-700'}`}>
                                  {asset.market || asset.exchange || '-'}
                                </span>
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4">
                                {asset.signal ? (
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      asset.signal === 'BUY'
                                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                        : asset.signal === 'SELL'
                                        ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                        : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                                    }`}
                                  >
                                    {asset.signal}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">-</span>
                                )}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4">
                                {asset.strength ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <span
                                          key={`${asset.symbol}-bar-${idx}`}
                                          className={`h-3 w-1.5 rounded-full ${
                                            idx < strengthBars
                                              ? asset.signal === 'SELL'
                                                ? 'bg-red-400'
                                                : asset.signal === 'HOLD'
                                                ? 'bg-yellow-400'
                                                : 'bg-teal-400'
                                              : 'bg-white/10'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      asset.signal === 'SELL'
                                        ? 'text-red-400'
                                        : asset.signal === 'HOLD'
                                        ? 'text-yellow-400'
                                        : 'text-teal-400'
                                    }`}>
                                      {Math.round((asset.strength / 5) * 100)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">-</span>
                                )}
                              </td>
                              <td className={`hidden lg:table-cell px-5 py-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {asset.entry ? asset.entry.toLocaleString() : '-'}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4 text-red-400">
                                {asset.signal === 'HOLD' || !levels.sl ? '-' : levels.sl.toLocaleString()}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4 text-teal-400">
                                {asset.signal === 'HOLD' || !levels.tp1 ? '-' : levels.tp1.toLocaleString()}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4 text-teal-300">
                                {asset.signal === 'HOLD' || !levels.tp2 ? '-' : levels.tp2.toLocaleString()}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4 text-xs text-gray-500">
                                {asset.updatedAt ? formatRelativeTime(asset.updatedAt) : '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {!loading && !error && filteredAssets.length === 0 && (
                  <div className={`py-16 text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>No assets found.</div>
                )}

                {/* Pagination Controls */}
                {!loading && !error && filteredAssets.length > 0 && (
                  <div className={`mt-4 px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Showing <span className="font-semibold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)}</span> of{' '}
                      <span className="font-semibold">{filteredAssets.length}</span> assets
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? isDark ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        ← Previous
                      </button>
                      <div className={`px-3 py-1.5 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Page {currentPage} of {totalPages}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? isDark ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

