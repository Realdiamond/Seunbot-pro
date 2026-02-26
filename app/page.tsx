'use client';

import { useMemo, useState, useEffect } from 'react';
import { Asset, Market, PredictionResponse, DataSummaryResponse } from '@/types';
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

type SignalFilter = 'All' | 'BUY' | 'SELL' | 'HOLD';

export default function Home() {
  const [selectedMarket, setSelectedMarket] = useState<Market | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [signalFilter, setSignalFilter] = useState<SignalFilter>('All');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved !== 'light'; // default to dark
    }
    return true;
  });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  
  // Prediction states
  const [predictions, setPredictions] = useState<Record<string, PredictionResponse>>({});
  const [dataSummary, setDataSummary] = useState<DataSummaryResponse | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  
  // Cache states
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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

  // Unified function to fetch all data
  const fetchAllData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first (if not forcing refresh)
      if (!forceRefresh) {
        const cachedAssets = localStorage.getItem('homepage_assets');
        const cachedPredictions = localStorage.getItem('homepage_predictions');
        const cachedSummary = localStorage.getItem('homepage_summary');
        const cachedTimestamp = localStorage.getItem('homepage_timestamp');
        
        if (cachedAssets && cachedPredictions && cachedTimestamp) {
          const timestamp = new Date(cachedTimestamp);
          const now = new Date();
          const cacheAge = now.getTime() - timestamp.getTime();
          
          // Use cache if less than 10 minutes old
          if (cacheAge < CACHE_DURATION) {
            const parsedAssets = JSON.parse(cachedAssets);
            const parsedPredictions = JSON.parse(cachedPredictions);
            const parsedSummary = cachedSummary ? JSON.parse(cachedSummary) : null;
            
            setAssets(parsedAssets);
            setPredictions(parsedPredictions);
            setDataSummary(parsedSummary);
            setLastUpdated(timestamp);
            setLoading(false);
            console.log('✅ Loaded data from cache (age:', Math.round(cacheAge / 1000), 'seconds)');
            return;
          } else {
            console.log('⚠️ Cache expired, fetching fresh data...');
          }
        }
      }
      
      // Fetch fresh data
      console.log('📡 Fetching fresh data from all APIs...');
      
      // 1. Fetch Assets
      const assetsResponse = await fetch(`${API_BASE_URL}/api/Assets`);
      if (!assetsResponse.ok) {
        throw new Error('Failed to fetch assets');
      }
      const assetsData = await assetsResponse.json();
      
      if (!assetsData.success || !Array.isArray(assetsData.data)) {
        throw new Error('Invalid data format');
      }
      
      const mappedAssets = assetsData.data.map((asset: any) => ({
        ...asset,
        market: exchangeToMarket(asset.exchange || ''),
      }));
      
      // 2. Fetch Data Summary
      let summary: DataSummaryResponse | null = null;
      try {
        const summaryResponse = await fetch('/api/prediction/data-summary');
        if (summaryResponse.ok) {
          summary = await summaryResponse.json();
          console.log('✅ Data summary loaded:', summary?.totalSymbols, 'symbols');
        }
      } catch (error) {
        console.warn('⚠️ Data summary API unavailable');
      }
      
      // 3. Fetch Batch Predictions
      setLoadingPredictions(true);
      const symbols = mappedAssets.map((a: Asset) => a.symbol).join(',');
      const predictionsMap: Record<string, PredictionResponse> = {};
      
      if (symbols) {
        try {
          const predictionsResponse = await fetch(`/api/prediction/batch?symbols=${symbols}`);
          if (predictionsResponse.ok) {
            const predictionsData: PredictionResponse[] = await predictionsResponse.json();
            predictionsData.forEach(pred => {
              predictionsMap[pred.symbol] = pred;
            });
            const successCount = predictionsData.filter(p => p.isSuccess).length;
            console.log(`✅ Loaded ${successCount}/${predictionsData.length} predictions`);
          }
        } catch (error) {
          console.warn('⚠️ Prediction API failed');
        }
      }
      setLoadingPredictions(false);
      
      // Update state
      setAssets(mappedAssets);
      setPredictions(predictionsMap);
      setDataSummary(summary);
      
      // Cache the data
      const now = new Date();
      localStorage.setItem('homepage_assets', JSON.stringify(mappedAssets));
      localStorage.setItem('homepage_predictions', JSON.stringify(predictionsMap));
      if (summary) {
        localStorage.setItem('homepage_summary', JSON.stringify(summary));
      }
      localStorage.setItem('homepage_timestamp', now.toISOString());
      setLastUpdated(now);
      
      console.log('✅ All data fetched and cached successfully');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAllData(true); // Force refresh
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
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

    return filtered;
  }, [selectedMarket, searchQuery, assets]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMarket, searchQuery, signalFilter]);

  // Pagination with signal filtering and sorting based on predictions
  const filteredAndSortedAssets = useMemo(() => {
    // Filter by signal type based on predictions (only filter if predictions are loaded)
    const filtered = filteredAssets.filter((asset) => {
      const prediction = predictions[asset.symbol];
      // If no prediction yet, include the asset
      if (!prediction) return true;
      // If signal filter is 'All', include all assets
      if (signalFilter === 'All') return true;
      // Filter by signal recommendation
      return prediction.recommendation === signalFilter;
    });

    // Sort by confidence (strength) - high to low
    return filtered.sort((a, b) => {
      const predA = predictions[a.symbol];
      const predB = predictions[b.symbol];
      const confA = predA ? predA.confidence : 0;
      const confB = predB ? predB.confidence : 0;
      return confB - confA;
    });
  }, [filteredAssets, predictions, signalFilter]);

  // Calculate signal counts for smart empty state
  const signalCounts = useMemo(() => {
    const counts = { BUY: 0, SELL: 0, HOLD: 0 };
    const otherMarketCounts = { BUY: 0, SELL: 0, HOLD: 0 };
    
    assets.forEach((asset) => {
      const prediction = predictions[asset.symbol];
      if (!prediction) return;
      
      const matchesSearch = searchQuery.trim() 
        ? asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || asset.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      if (!matchesSearch) return;
      
      const matchesMarket = selectedMarket === 'All' || asset.market === selectedMarket;
      
      if (matchesMarket) {
        counts[prediction.recommendation as 'BUY' | 'SELL' | 'HOLD']++;
      } else {
        otherMarketCounts[prediction.recommendation as 'BUY' | 'SELL' | 'HOLD']++;
      }
    });
    
    return { current: counts, other: otherMarketCounts };
  }, [assets, predictions, selectedMarket, searchQuery]);

  const totalPages = Math.ceil(filteredAndSortedAssets.length / ITEMS_PER_PAGE);
  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedAssets.slice(startIndex, endIndex);
  }, [filteredAndSortedAssets, currentPage, ITEMS_PER_PAGE]);

  // Helper function to format relative time
  const getRelativeTimeString = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    return 'More than a day ago';
  };

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
                className={`h-9 w-9 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5">
              <div className={`text-xs mb-4 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Home / Dashboard</div>

              {/* Data Summary Widget */}
              {dataSummary && (
                <div className={`mb-5 rounded-xl border p-4 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>🔮</span>
                      Prediction Coverage
                    </h3>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      Updated {new Date(dataSummary.generatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                      <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Total Symbols</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{dataSummary.totalSymbols}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                      <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Ready for Prediction</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{dataSummary.symbolsReadyForPrediction}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                      <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Total Records</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{dataSummary.totalRecords.toLocaleString()}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                      <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Coverage</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {((dataSummary.symbolsReadyForPrediction / dataSummary.totalSymbols) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search symbols (e.g., TSLA, BTC)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full rounded-lg border px-3 md:px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${isDark ? 'border-white/10 bg-[#0f1520] text-white placeholder-gray-500' : 'border-gray-300 bg-white text-slate-900 placeholder-gray-400'}`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    {lastUpdated && (
                      <span className={`text-xs hidden lg:block ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Updated {getRelativeTimeString(lastUpdated)}
                      </span>
                    )}
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing || loading}
                      className={`flex items-center gap-2 rounded-lg border px-3 md:px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                        isRefreshing || loading
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      } ${isDark ? 'border-white/10 bg-[#0f1520] text-gray-300 hover:text-white hover:bg-white/5' : 'border-gray-300 bg-white text-gray-600 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                      <span className={isRefreshing ? 'animate-spin' : ''}>⟳</span>
                      <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:gap-3">{markets.map((market) => (
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
                        onClick={() => setSignalFilter('All')}
                        disabled={loadingPredictions}
                        className={`px-2 py-1 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all ${
                          loadingPredictions 
                            ? 'opacity-50 cursor-not-allowed' 
                            : signalFilter === 'All'
                            ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setSignalFilter('BUY')}
                        disabled={loadingPredictions}
                        className={`px-2 py-1 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all ${
                          loadingPredictions 
                            ? 'opacity-50 cursor-not-allowed' 
                            : signalFilter === 'BUY'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'
                        }`}
                      >
                        Buy
                      </button>
                      <button
                        onClick={() => setSignalFilter('SELL')}
                        disabled={loadingPredictions}
                        className={`px-2 py-1 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all ${
                          loadingPredictions 
                            ? 'opacity-50 cursor-not-allowed' 
                            : signalFilter === 'SELL'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'
                        }`}
                      >
                        Sell
                      </button>
                      <button
                        onClick={() => setSignalFilter('HOLD')}
                        disabled={loadingPredictions}
                        className={`px-2 py-1 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-all ${
                          loadingPredictions 
                            ? 'opacity-50 cursor-not-allowed' 
                            : signalFilter === 'HOLD'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'
                        }`}
                      >
                        Hold
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
                        <th className="hidden lg:table-cell px-5 py-3 text-left">TP</th>
                        <th className="hidden lg:table-cell px-5 py-3 text-left">Time</th>
                      </tr>
                    </thead>
                    <tbody className={`${isDark ? 'divide-y divide-white/5' : 'divide-y divide-gray-200'}`}>
                      {loading || loadingPredictions ? (
                        <tr>
                          <td colSpan={2} className="lg:hidden px-5 py-16 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-5 w-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                {loading ? 'Loading assets...' : 'Loading predictions...'}
                              </span>
                            </div>
                          </td>
                          <td colSpan={8} className="hidden lg:table-cell px-5 py-16 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-5 w-5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
                              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                                {loading ? 'Loading assets...' : 'Loading predictions...'}
                              </span>
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
                          <td colSpan={8} className="hidden lg:table-cell px-5 py-16 text-center">
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
                          const prediction = predictions[asset.symbol];
                          const strengthBars = prediction ? Math.round(prediction.confidence * 5) : 0;

                          return (
                            <tr
                              key={asset.symbol}
                              onClick={() => window.location.href = `/asset/${asset.symbol}`}
                              className={`cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                            >
                              <td className="px-3 lg:px-5 py-3 lg:py-4">
                                <div className="flex items-center gap-2 lg:gap-3">
                                  {asset.imageUrl ? (
                                    <img 
                                      src={asset.imageUrl} 
                                      alt={asset.symbol}
                                      className="h-6 w-6 lg:h-8 lg:w-8 rounded-full object-cover"
                                      onError={(e) => {
                                        // Fallback to letter if image fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                                      }}
                                    />
                                  ) : null}
                                  <div className={`h-6 w-6 lg:h-8 lg:w-8 rounded-full flex items-center justify-center text-xs font-semibold ${isDark ? 'bg-white/10' : 'bg-slate-100'} ${asset.imageUrl ? 'hidden' : ''}`}>
                                    {asset.name.slice(0, 1)}
                                  </div>
                                  <div>
                                    <div className={`font-semibold text-sm lg:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.name}</div>
                                    <div className="text-xs text-gray-500">{asset.symbol}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 lg:px-5 py-3 lg:py-4">
                                <span className={`rounded-md border px-2 py-1 text-xs ${isDark ? 'border-white/10 bg-white/5 text-gray-300' : 'border-gray-300 bg-slate-100 text-gray-700'}`}>
                                  {asset.market || asset.exchange || '-'}
                                </span>
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4">
                                {prediction ? (
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      prediction.recommendation === 'BUY'
                                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                        : prediction.recommendation === 'SELL'
                                        ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                        : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                                    }`}
                                  >
                                    {prediction.recommendation}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">-</span>
                                )}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4">
                                {prediction ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <span
                                          key={`${asset.symbol}-bar-${idx}`}
                                          className={`h-3 w-1.5 rounded-full ${
                                            idx < strengthBars
                                              ? prediction.recommendation === 'SELL'
                                                ? 'bg-red-400'
                                                : prediction.recommendation === 'HOLD'
                                                ? 'bg-yellow-400'
                                                : 'bg-teal-400'
                                              : 'bg-white/10'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className={`text-xs font-semibold ${
                                      prediction.recommendation === 'SELL'
                                        ? 'text-red-400'
                                        : prediction.recommendation === 'HOLD'
                                        ? 'text-yellow-400'
                                        : 'text-teal-400'
                                    }`}>
                                      {(prediction.confidence * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">-</span>
                                )}
                              </td>
                              <td className={`hidden lg:table-cell px-5 py-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {prediction?.suggestedEntry ? `₦${prediction.suggestedEntry.toLocaleString()}` : '-'}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4 text-red-400">
                                {prediction?.stopLoss ? `₦${prediction.stopLoss.toLocaleString()}` : '-'}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4 text-teal-400">
                                {prediction?.takeProfit ? `₦${prediction.takeProfit.toLocaleString()}` : '-'}
                              </td>
                              <td className="hidden lg:table-cell px-5 py-4 text-xs text-gray-500">
                                {prediction?.analyzedAt ? formatRelativeTime(prediction.analyzedAt) : '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {!loading && !loadingPredictions && !error && filteredAndSortedAssets.length === 0 && (
                  <div className={`py-16 px-4 text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    <div className="max-w-md mx-auto">
                      <div className="text-4xl mb-3">📊</div>
                      <div className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        No {signalFilter} signals found
                        {selectedMarket !== 'All' && ` for ${selectedMarket}`}
                      </div>
                      
                      {/* Show alternative signals in current market */}
                      {(signalCounts.current.BUY > 0 || signalCounts.current.SELL > 0 || signalCounts.current.HOLD > 0) && (
                        <div className="mt-3">
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Available in {selectedMarket === 'All' ? 'all markets' : selectedMarket}:{' '}
                            <span className="font-medium">
                              {signalFilter !== 'BUY' && signalCounts.current.BUY > 0 && `BUY (${signalCounts.current.BUY})`}
                              {signalFilter !== 'BUY' && signalFilter !== 'SELL' && signalCounts.current.BUY > 0 && signalCounts.current.SELL > 0 && ' • '}
                              {signalFilter !== 'SELL' && signalCounts.current.SELL > 0 && `SELL (${signalCounts.current.SELL})`}
                              {signalFilter !== 'HOLD' && (signalCounts.current.BUY > 0 || signalCounts.current.SELL > 0) && signalCounts.current.HOLD > 0 && ' • '}
                              {signalFilter !== 'HOLD' && signalCounts.current.HOLD > 0 && `HOLD (${signalCounts.current.HOLD})`}
                            </span>
                          </p>
                        </div>
                      )}
                      
                      {/* Show same signal in other markets */}
                      {signalCounts.other[signalFilter] > 0 && selectedMarket !== 'All' && (
                        <div className="mt-3">
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {signalCounts.other[signalFilter]} {signalFilter} signal{signalCounts.other[signalFilter] !== 1 ? 's' : ''} in other markets
                          </p>
                        </div>
                      )}
                      
                      {/* Completely empty state */}
                      {signalCounts.current.BUY === 0 && signalCounts.current.SELL === 0 && signalCounts.current.HOLD === 0 && signalCounts.other[signalFilter] === 0 && (
                        <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {searchQuery ? 'Try adjusting your search query.' : 'No trading signals available yet.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pagination Controls */}
                {!loading && !loadingPredictions && !error && filteredAndSortedAssets.length > 0 && (
                  <div className={`mt-4 px-4 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Showing <span className="font-semibold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedAssets.length)}</span> of{' '}
                      <span className="font-semibold">{filteredAndSortedAssets.length}</span> assets
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

