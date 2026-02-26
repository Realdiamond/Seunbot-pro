'use client';

import { useState, useEffect } from 'react';
import { WatchlistAnalysisResponse, PredictionResponse } from '@/types';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

export default function WatchlistPage() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved !== 'light';
    }
    return true;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<WatchlistAnalysisResponse | null>(null);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set sidebar initial state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch watchlist on mount
  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    setLoadingWatchlist(true);
    setError(null);
    try {
      const response = await fetch('/api/prediction/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlistSymbols(data);
        console.log('✅ Watchlist loaded:', data.length, 'symbols');
      } else {
        throw new Error(`API returned status ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const errorMsg = err instanceof TypeError && (err as any).message === 'Failed to fetch'
        ? 'Watchlist API unavailable. Please check your connection or try again later.'
        : err instanceof Error ? err.message : 'Failed to load watchlist';
      setError(errorMsg);
      console.error('Watchlist fetch error:', err);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const analyzeWatchlist = async () => {
    setLoadingAnalysis(true);
    setError(null);
    try {
      console.log('⏳ Starting watchlist analysis...');
      const response = await fetch('/api/prediction/watchlist/analyze', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data: WatchlistAnalysisResponse = await response.json();
        setAnalysisResult(data);
        console.log('✅ Analysis complete:', data.totalStocks, 'stocks analyzed in', data.durationSeconds.toFixed(1), 's');
      } else {
        throw new Error(`Analysis API returned status ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      const errorMsg = err instanceof TypeError && (err as any).message === 'Failed to fetch'
        ? 'Analysis API unavailable. The server may be down or not responding.'
        : err instanceof Error ? err.message : 'Failed to analyze watchlist';
      setError(errorMsg);
      console.error('Analysis error:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const renderPredictionCard = (prediction: PredictionResponse) => (
    <Link 
      href={`/asset/${prediction.symbol}`}
      key={prediction.symbol}
      className={`block rounded-xl border p-4 transition-all hover:shadow-lg ${
        isDark ? 'border-white/10 bg-[#0f1520] hover:border-teal-500/30' : 'border-gray-200 bg-white hover:border-teal-500/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{prediction.symbol}</h4>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{prediction.companyName}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
          prediction.recommendation === 'BUY' ? 'bg-[#0bda6c]/10 text-[#0bda6c]' :
          prediction.recommendation === 'SELL' ? 'bg-red-500/10 text-red-500' :
          'bg-yellow-500/10 text-yellow-500'
        }`}>
          {prediction.recommendation}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className={`text-[10px] uppercase ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Confidence</p>
          <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {(prediction.confidence * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className={`text-[10px] uppercase ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Price</p>
          <p className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ${prediction.currentPrice.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Score: {prediction.finalScore.toFixed(3)} • R/R: {prediction.riskRewardRatio.toFixed(2)}x
      </div>
    </Link>
  );

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0b0f16] text-white' : 'bg-[#f6f6f8] text-slate-900'}`}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          isDark={isDark} 
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden h-9 w-9 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}
              >
                ☰
              </button>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ⭐ My Watchlist
              </h1>
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

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
              {/* Watchlist Header */}
              <div className={`rounded-xl border p-6 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      NGX Watchlist
                    </h2>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {loadingWatchlist ? 'Loading...' : `${watchlistSymbols.length} stocks monitored`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={fetchWatchlist}
                      disabled={loadingWatchlist}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        loadingWatchlist 
                          ? 'opacity-50 cursor-not-allowed' 
                          : isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                      }`}
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={analyzeWatchlist}
                      disabled={loadingAnalysis || watchlistSymbols.length === 0}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                        loadingAnalysis || watchlistSymbols.length === 0
                          ? 'opacity-50 cursor-not-allowed bg-gray-500 text-gray-300'
                          : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                      }`}
                    >
                      {loadingAnalysis ? '⏳ Analyzing...' : '🔮 Analyze All'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`rounded-xl border p-4 ${isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'}`}>
                  <p className="text-red-500 text-sm">⚠️ {error}</p>
                </div>
              )}

              {/* Watchlist Symbols */}
              {loadingWatchlist ? (
                <div className={`rounded-xl border p-12 text-center ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                  <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-4"></div>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading watchlist...</p>
                </div>
              ) : watchlistSymbols.length > 0 && !analysisResult ? (
                <div className={`rounded-xl border p-6 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                  <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Watchlist Symbols
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {watchlistSymbols.map((symbol) => (
                      <Link
                        key={symbol}
                        href={`/asset/${symbol}`}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          isDark 
                            ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-gray-200'
                        }`}
                      >
                        {symbol}
                      </Link>
                    ))}
                  </div>
                  <p className={`text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click "Analyze All" to generate AI predictions for all watchlist stocks
                  </p>
                </div>
              ) : null}

              {/* Analysis Result */}
              {analysisResult && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className={`rounded-xl border p-6 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        📊 Portfolio Analysis Summary
                      </h3>
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        Analyzed {analysisResult.totalStocks} stocks in {analysisResult.durationSeconds.toFixed(1)}s
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Total Stocks</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{analysisResult.totalStocks}</p>
                      </div>
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Buy Signals</p>
                        <p className="text-2xl font-bold text-[#0bda6c]">{analysisResult.buySignals.length}</p>
                      </div>
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Sell Signals</p>
                        <p className="text-2xl font-bold text-red-500">{analysisResult.sellSignals.length}</p>
                      </div>
                      <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                        <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Hold Signals</p>
                        <p className="text-2xl font-bold text-yellow-500">{analysisResult.holdSignals.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Buy Signals */}
                  {analysisResult.buySignals.length > 0 && (
                    <div>
                      <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="text-[#0bda6c]">↑</span>
                        Buy Signals ({analysisResult.buySignals.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysisResult.buySignals.map(renderPredictionCard)}
                      </div>
                    </div>
                  )}

                  {/* Sell Signals */}
                  {analysisResult.sellSignals.length > 0 && (
                    <div>
                      <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="text-red-500">↓</span>
                        Sell Signals ({analysisResult.sellSignals.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysisResult.sellSignals.map(renderPredictionCard)}
                      </div>
                    </div>
                  )}

                  {/* Hold Signals */}
                  {analysisResult.holdSignals.length > 0 && (
                    <div>
                      <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span className="text-yellow-500">⏸</span>
                        Hold Signals ({analysisResult.holdSignals.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysisResult.holdSignals.map(renderPredictionCard)}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {analysisResult.errors && analysisResult.errors.length > 0 && (
                    <div className={`rounded-xl border p-4 ${isDark ? 'border-red-500/20 bg-red-500/10' : 'border-red-200 bg-red-50'}`}>
                      <h4 className="text-red-500 font-bold mb-2">⚠️ Errors ({analysisResult.errors.length})</h4>
                      <ul className="space-y-1">
                        {analysisResult.errors.map((err, idx) => (
                          <li key={idx} className="text-red-500 text-sm">
                            {err.symbol}: {err.errorMessage}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className={`mt-auto border-t py-6 ${isDark ? 'border-white/5 bg-[#0b0f16]' : 'border-gray-200 bg-white'}`}>
            <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                © 2026 SeunBot Pro. Financial data provided for informational purposes only.
              </p>
              <div className="flex gap-4">
                <a className={`text-xs hover:text-teal-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`} href="#">Terms of Service</a>
                <a className={`text-xs hover:text-teal-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`} href="#">Privacy Policy</a>
                <a className={`text-xs hover:text-teal-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`} href="#">Help Center</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
