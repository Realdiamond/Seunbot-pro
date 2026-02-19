'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { getMockChatResponse } from '@/lib/mockData';
import { ChatMessage, Asset } from '@/types';
import Link from 'next/link';

type Timeframe = 'Monthly' | 'Weekly' | 'Daily';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

// Map exchange to market category
const exchangeToMarket = (exchange: string) => {
  const exchangeUpper = exchange.toUpperCase();
  if (exchangeUpper.includes('NSENG') || exchangeUpper.includes('NGX')) return 'NGX';
  if (exchangeUpper.includes('NYSE') || exchangeUpper.includes('NASDAQ') || exchangeUpper.includes('US')) return 'US Stocks';
  if (exchangeUpper.includes('FOREX') || exchangeUpper.includes('FX')) return 'Forex';
  if (exchangeUpper.includes('CRYPTO') || exchangeUpper.includes('BTC') || exchangeUpper.includes('ETH')) return 'Crypto';
  return 'NGX';
};

export default function AssetPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDark, setIsDark] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: `I've analyzed the ${symbol} chart. We are currently seeing a confluence of bullish signals. Specifically, Wave 3 impulse is active and RSI is showing hidden bullish divergence. Would you like a deeper breakdown of the resistance levels?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  
  // Analysis Settings & Data
  const [accountBalance, setAccountBalance] = useState(10000);
  const [fundamentalScore, setFundamentalScore] = useState(0); // -3 to +3
  const [sentimentScore, setSentimentScore] = useState(0);     // -3 to +3
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Parse and render the comprehensive report
  const renderReport = (report: string) => {
    if (!report) return null;
    
    const lines = report.split('\n');
    const elements: any[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Detect ASCII table start
      if (line.includes('┌')) {
        const tableTitle = line.replace(/[┌─┐]/g, '').trim();
        const sections: any[] = [];
        let currentSection: { title: string; items: any[] } = { title: '', items: [] };
        
        i++; // Skip the top border
        
        // Parse table content until we hit the closing border
        while (i < lines.length && !lines[i].includes('└')) {
          const tLine = lines[i];
          
          // Section divider
          if (tLine.includes('├')) {
            if (currentSection.items.length > 0) {
              sections.push({ ...currentSection });
              currentSection = { title: '', items: [] };
            }
            i++;
            continue;
          }
          
          // Content line
          if (tLine.includes('│')) {
            const content = tLine.replace(/[│]/g, '').trim();
            
            // Check if this line has a progress bar
            if (content.includes('█') || content.includes('░')) {
              // Extract progress bar data
              const match = content.match(/([█░]+)\s*(\d+)%\s*(.+)/);
              if (match) {
                const filled = match[1].split('█').length - 1;
                const total = match[1].length;
                const percentage = parseInt(match[2]);
                const label = match[3].trim();
                currentSection.items.push({
                  type: 'progress',
                  percentage,
                  label
                });
              }
            } else if (content) {
              // Regular text content
              currentSection.items.push({
                type: 'text',
                content
              });
            }
          }
          
          i++;
        }
        
        // Add last section
        if (currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        
        // Render the table
        elements.push({
          type: 'table',
          title: tableTitle,
          sections
        });
        
        i++; // Skip closing border
        continue;
      }
      
      // Detect standalone progress bars
      if (line.includes('█') && line.includes('%') && !line.includes('│')) {
        const match = line.match(/([█░]+)\s*(\d+)%\s*(.+)/);
        if (match) {
          const percentage = parseInt(match[2]);
          const label = match[3].trim();
          elements.push({
            type: 'progress',
            percentage,
            label
          });
          i++;
          continue;
        }
      }
      
      // Detect section headers
      if (line.trim() && line.trim().length < 100 && !line.includes('•') && (i === 0 || (i < lines.length - 1 && !lines[i + 1].trim()))) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
          elements.push({
            type: 'header',
            text: trimmed
          });
          i++;
          continue;
        }
      }
      
      // Regular text
      if (line.trim()) {
        elements.push({
          type: 'text',
          text: line.trim()
        });
      }
      
      i++;
    }
    
    return (
      <div className="space-y-4">
        {elements.map((element, idx) => {
          if (element.type === 'table') {
            return (
              <div key={idx} className={`rounded-lg border overflow-hidden ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                {element.title && (
                  <div className={`p-4 border-b font-bold text-center ${isDark ? 'bg-[#0a0f16] border-white/10 text-white' : 'bg-slate-100 border-gray-200 text-slate-900'}`}>
                    {element.title}
                  </div>
                )}
                <div className="p-5 space-y-4">
                  {element.sections.map((section: any, sIdx: number) => (
                    <div key={sIdx} className={sIdx > 0 ? `pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}` : ''}>
                      {section.items.map((item: any, iIdx: number) => {
                        if (item.type === 'progress') {
                          return (
                            <div key={iIdx} className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                                  {item.label}
                                </span>
                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {item.percentage}%
                                </span>
                              </div>
                              <div className={`h-2.5 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    item.percentage >= 70 
                                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500'
                                      : item.percentage >= 30
                                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                                      : 'bg-gradient-to-r from-red-500 to-pink-500'
                                  }`}
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <p key={iIdx} className={`text-sm leading-relaxed mb-1 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                            {item.content}
                          </p>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          
          if (element.type === 'progress') {
            return (
              <div key={idx} className={`p-4 rounded-lg border ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{element.label}</span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{element.percentage}%</span>
                </div>
                <div className={`h-3 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${element.percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          }
          
          if (element.type === 'header') {
            return (
              <h5 key={idx} className={`text-base font-bold mt-6 mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {element.text}
              </h5>
            );
          }
          
          return (
            <p key={idx} className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {element.text}
            </p>
          );
        })}
      </div>
    );
  };

  // Fetch comprehensive analysis from API
  const fetchAnalysis = async () => {
    if (!asset) return;
    
    setIsLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      // Extract asset name from symbol if needed (e.g., NSENG_ABCTRANS -> ABCTRANS)
      const assetName = asset.name || (asset.symbol.includes('_') ? asset.symbol.split('_')[1] : asset.symbol);
      
      // ALL parameters are query parameters (not body)
      const queryParams = new URLSearchParams({
        assetName: assetName,
        exchange: asset.exchange || 'NSENG',
        accountBalance: accountBalance.toString(),
        fundamentalScore: fundamentalScore.toString(),
        sentimentScore: sentimentScore.toString(),
      });
      
      console.log('Fetching analysis with:', { 
        query: queryParams.toString(),
        url: `${API_BASE_URL}/api/Analysis/comprehensive-report/${asset.symbol}?${queryParams}`,
        asset: { symbol: asset.symbol, name: asset.name, exchange: asset.exchange }
      });
      
      const response = await fetch(
        `${API_BASE_URL}/api/Analysis/comprehensive-report/${asset.symbol}?${queryParams}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // No body - all params are in query string
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `${response.status} ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('API Error Response:', {
            status: response.status,
            statusText: response.statusText,
            errorDetails: errorJson
          });
          
          // Extract validation errors if present
          if (errorJson.errors) {
            errorMessage = Object.entries(errorJson.errors)
              .map(([field, messages]: [string, any]) => `${field}: ${messages.join(', ')}`)
              .join('; ');
          } else if (errorJson.title) {
            errorMessage = errorJson.title;
          }
        } catch {
          console.error('API Error Response (raw):', errorText);
        }
        
        throw new Error(`Failed to fetch analysis: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('Analysis API Response:', data);
      setAnalysisData(data);
      setAnalysisError(null);
    } catch (error: any) {
      console.error('Error fetching analysis:', error);
      setAnalysisData(null);
      setAnalysisError(error.message || 'Failed to fetch analysis');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Fetch assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
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
          
          // Find the specific asset
          const foundAsset = mappedAssets.find((a: Asset) => a.symbol === symbol);
          setAsset(foundAsset || null);
        }
      } catch (err) {
        console.error('Error fetching assets:', err);
        setAsset(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [symbol]);

  // Fetch analysis when asset is loaded
  useEffect(() => {
    if (asset) {
      fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  // Search results (useMemo must be before conditional returns)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return assets.filter(
      (asset) => 
        asset.symbol.toLowerCase().includes(query) || 
        asset.name.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to 5 results
  }, [searchQuery, assets]);

  // Conditional returns AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f16] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading asset...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#0b0f16] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Asset Not Found</h1>
          <p className="text-gray-400 mb-4">The asset you're looking for doesn't exist.</p>
          <Link href="/" className="text-teal-500 hover:text-teal-500/80">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Handler functions
  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput, timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = getMockChatResponse(currentInput);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }]);
      setIsTyping(false);
    }, 500);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    const userMessage: ChatMessage = { role: 'user', content: prompt, timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = getMockChatResponse(prompt);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }]);
      setIsTyping(false);
    }, 500);
  };

  const handleSearchSelect = (selectedSymbol: string) => {
    router.push(`/asset/${selectedSymbol}`);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0b0f16] text-white' : 'bg-[#f6f6f8] text-slate-900'}`}>
      {/* Header */}
      <header className={`flex items-center justify-between border-b px-3 md:px-6 py-3 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-3 md:gap-8 flex-1 min-w-0">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="size-7 md:size-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white">
              <span className="text-base md:text-[20px]">🤖</span>
            </div>
            <h2 className={`text-sm md:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>SeunBot Pro</h2>
          </div>
          <div className="hidden md:flex relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Asset (e.g. ETH)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                className={`w-64 h-10 px-4 pl-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${isDark ? 'bg-[#0f1520] border border-white/10 text-white placeholder-gray-500' : 'bg-slate-100 border border-gray-300 text-slate-900 placeholder-gray-400'}`}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              
              {showSearchResults && searchResults.length > 0 && (
                <div className={`absolute top-full mt-2 w-80 rounded-lg border shadow-xl z-50 ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="p-2">
                    <div className={`text-xs uppercase tracking-wider mb-2 px-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Search Results
                    </div>
                    {searchResults.map((result) => (
                      <button
                        key={result.symbol}
                        onClick={() => handleSearchSelect(result.symbol)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                      >
                        <div className={`size-10 rounded-lg flex items-center justify-center text-sm font-bold ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                          {result.symbol.slice(0, 2)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.symbol}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{result.name}</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-100 text-gray-600'}`}>
                          {result.market}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {showSearchResults && searchQuery && searchResults.length === 0 && (
                <div className={`absolute top-full mt-2 w-80 rounded-lg border shadow-xl z-50 p-4 text-center ${isDark ? 'bg-[#0f1520] border-white/10 text-gray-500' : 'bg-white border-gray-200 text-gray-600'}`}>
                  No assets found
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-6">
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}>Dashboard</Link>
            <Link href="/chat" className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}>AI Chat</Link>
            <Link href="/profile" className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}>Profile</Link>
          </nav>
          <div className={`h-6 w-px hidden lg:block ${isDark ? 'bg-white/10' : 'bg-gray-300'}`}></div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 md:px-3 md:py-2 rounded-lg border transition-colors ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' : 'bg-gray-200 text-slate-900 hover:bg-gray-300'}`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <div className={`size-7 md:size-9 rounded-full border ${isDark ? 'bg-white/10 border-white/10' : 'bg-gray-300 border-gray-400'}`}></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-3 md:p-6 lg:px-8 max-w-[1600px] mx-auto w-full gap-4 md:gap-6 overflow-x-hidden">
        {/* Asset Header */}
        <section className={`flex flex-wrap items-center justify-between gap-3 md:gap-4 p-3 md:p-5 rounded-xl shadow-sm ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="size-10 md:size-12 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <span className="text-xl md:text-2xl">₿</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-lg md:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.name}</h1>
                <span className={`text-xs md:text-sm font-medium px-2 py-0.5 rounded ${isDark ? 'text-gray-400 bg-white/5' : 'text-gray-600 bg-slate-100'}`}>{asset.symbol}</span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Asset Intelligence Report</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-6 w-full md:w-auto">
            <div className="px-0 md:px-4">
              <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Price</p>
              <p className={`text-base md:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.entry ? `$${asset.entry.toLocaleString()}` : '-'}</p>
            </div>
            <div className={`hidden sm:block w-px h-10 ${isDark ? 'bg-[#2b2839]' : 'bg-gray-300'}`}></div>
            <div className="px-0 md:px-4">
              <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>24h Change</p>
              <div className="flex items-center gap-1 text-[#0bda6c]">
                <span>↗</span>
                <span className="text-sm md:text-lg font-bold">+2.45%</span>
              </div>
            </div>
            <div className={`hidden sm:block w-px h-10 ${isDark ? 'bg-[#2b2839]' : 'bg-gray-300'}`}></div>
            <div className="px-0 md:px-4 hidden sm:block">
              <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>24h Volume</p>
              <p className={`text-sm md:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>$34.2B</p>
            </div>
            <div className={`hidden lg:block w-px h-10 ${isDark ? 'bg-[#2b2839]' : 'bg-gray-300'}`}></div>
            <div className="px-0 md:px-4 hidden lg:block">
              <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Market Cap</p>
              <p className={`text-sm md:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>$1.2T</p>
            </div>
          </div>
        </section>

        {/* Chart Section - Full Width */}
        <div className={`rounded-xl flex flex-col h-[400px] md:h-[500px] shadow-sm overflow-hidden ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between border-b p-3 md:p-4 gap-3 ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
                <div className={`flex items-center gap-2 p-1 rounded-lg ${isDark ? 'bg-[#0f1520] border border-white/10' : 'bg-gray-200'} overflow-x-auto w-full sm:w-auto`}>
                  {(['Monthly', 'Weekly', 'Daily'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        timeframe === tf
                          ? 'bg-teal-500 text-white shadow-sm'
                          : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    <span className="size-2 rounded-full bg-[#0bda6c]"></span>
                    Market Open
                  </div>
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-slate-100 text-gray-600'}`}
                    title="Toggle Fullscreen"
                  >
                    <span className="text-xl">{isFullscreen ? '✕' : '⛶'}</span>
                  </button>
                </div>
              </div>
              <div className={`relative flex-1 w-full h-full p-4 ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                {/* Grid Background */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="border-r border-b border-white/[0.03]"></div>
                  ))}
                </div>
                {/* Chart Placeholder */}
                <div className="relative h-full w-full flex items-center justify-center">
                  <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <p className="text-lg font-medium">The chart will show here</p>
                    <p className="text-sm mt-2">TradingView integration coming soon</p>
                  </div>
                </div>
              </div>
            </div>

        {/* Comprehensive Analysis - Full Width */}
        <div className={`rounded-xl overflow-hidden shadow-sm relative ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
          <div className={`p-5 border-b ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-2 shadow-lg shadow-purple-500/20">
                  <span className="text-white text-lg">📊</span>
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Comprehensive Analysis</h3>
                  <p className={`text-xs uppercase tracking-wider font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Multi-Timeframe Market Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-slate-200 text-gray-600 hover:text-slate-900'}`}
                title="Analysis Settings"
              >
                <span className="text-xl">⚙️</span>
              </button>
            </div>
            
            {/* Settings Panel */}
            {showSettings && (
              <div className={`mt-4 p-4 rounded-lg border ${isDark ? 'bg-[#0a0f16] border-white/10' : 'bg-slate-50 border-gray-200'}`}>
                <h4 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Analysis Parameters</h4>
                <div className="space-y-4">
                  {/* Account Balance */}
                  <div>
                    <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Account Balance: ${accountBalance.toLocaleString()}
                    </label>
                    <input
                      type="number"
                      value={accountBalance}
                      onChange={(e) => setAccountBalance(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-[#0f1520] border border-white/10 text-white' : 'bg-white border border-gray-300 text-slate-900'}`}
                      min="0"
                      step="1000"
                    />
                  </div>
                  
                  {/* Fundamental Score */}
                  <div>
                    <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Fundamental Score: {fundamentalScore} {fundamentalScore < 0 ? '(Bearish)' : fundamentalScore > 0 ? '(Bullish)' : '(Neutral)'}
                    </label>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>-3</span>
                      <input
                        type="range"
                        min="-3"
                        max="3"
                        step="0.5"
                        value={fundamentalScore}
                        onChange={(e) => setFundamentalScore(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>+3</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-red-400">Very Bearish</span>
                      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Neutral</span>
                      <span className="text-[10px] text-teal-400">Very Bullish</span>
                    </div>
                  </div>
                  
                  {/* Sentiment Score */}
                  <div>
                    <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Sentiment Score: {sentimentScore} {sentimentScore < 0 ? '(Fear)' : sentimentScore > 0 ? '(Greed)' : '(Neutral)'}
                    </label>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>-3</span>
                      <input
                        type="range"
                        min="-3"
                        max="3"
                        step="0.5"
                        value={sentimentScore}
                        onChange={(e) => setSentimentScore(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>+3</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-red-400">Extreme Fear</span>
                      <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Neutral</span>
                      <span className="text-[10px] text-teal-400">Extreme Greed</span>
                    </div>
                  </div>
                  
                  {/* Update Button */}
                  <button
                    onClick={() => {
                      fetchAnalysis();
                      setShowSettings(false);
                    }}
                    disabled={isLoadingAnalysis}
                    className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
                  >
                    {isLoadingAnalysis ? 'Updating...' : 'Update Analysis'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className={`p-6 ${isDark ? 'bg-[#0a0f16]/50' : 'bg-slate-50/50'}`}>
            {isLoadingAnalysis ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mb-4"></div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Generating comprehensive analysis...</p>
                </div>
              </div>
            ) : analysisData?.analysis ? (
              <div className="space-y-4">
                {/* Trading Signal Overview */}
                <div className={`rounded-lg border p-6 ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">🎯</span>
                      <div>
                        <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Trading Signal</h4>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          {new Date(analysisData.analysis.analysisTimestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className={`px-6 py-3 rounded-xl text-2xl font-bold border shadow-lg ${
                      analysisData.analysis.direction === 'BUY' 
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                        : analysisData.analysis.direction === 'SELL'
                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                        : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
                    }`}>
                      {analysisData.analysis.direction}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Signal Strength</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {analysisData.analysis.signalStrength?.toFixed(2)} / 5.0
                      </p>
                      <div className={`h-2 w-full rounded-full mt-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                          style={{ width: `${(analysisData.analysis.signalStrength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {[
                      { label: 'Technical', value: analysisData.analysis.tradingSignal?.technicalScore, color: 'text-blue-400' },
                      { label: 'Fundamental', value: analysisData.analysis.tradingSignal?.fundamentalScore, color: 'text-purple-400' },
                      { label: 'Sentiment', value: analysisData.analysis.tradingSignal?.sentimentScore, color: 'text-pink-400' },
                      { label: 'Gann', value: analysisData.analysis.tradingSignal?.gannScore, color: 'text-orange-400' },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{item.label}</p>
                        <p className={`text-xl font-bold ${item.color}`}>{item.value?.toFixed(2) || '0.00'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Timeframe Table */}
                <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Multi-Timeframe Analysis</h4>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className={isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}>
                        <tr>
                          <th className={`text-left p-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Timeframe</th>
                          <th className={`text-left p-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Signal</th>
                          <th className={`text-left p-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>RSI</th>
                          <th className={`text-left p-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>ADX</th>
                          <th className={`text-left p-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>ATR</th>
                          <th className={`text-left p-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Cycle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['monthlyAnalysis', 'weeklyAnalysis', 'dailyAnalysis', 'h4Analysis'].map((key, idx) => {
                          const data = analysisData.analysis.multiTimeframeResult?.[key];
                          if (!data) return null;
                          return (
                            <tr key={key} className={idx % 2 === 0 ? (isDark ? 'bg-[#0f1520]/50' : 'bg-white') : (isDark ? 'bg-[#0a0f16]/30' : 'bg-slate-50/50')}>
                              <td className={`p-3 text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {data.timeframe}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  data.cyclePhase === 'Bull' ? 'bg-teal-500/15 text-teal-300' : 'bg-red-500/15 text-red-300'
                                }`}>
                                  {data.cyclePhase}
                                </span>
                              </td>
                              <td className={`p-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{data.rsi?.toFixed(1)}</td>
                              <td className={`p-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{data.adx?.toFixed(1)}</td>
                              <td className={`p-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{data.atr?.toFixed(2)}</td>
                              <td className={`p-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{data.cycleDuration}d</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cycle Analysis Detailed */}
                <div className={`rounded-lg border p-6 ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-2xl">🔄</span>
                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Detailed Cycle Analysis</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Current Phase</p>
                      <p className={`text-2xl font-bold mb-2 ${analysisData.analysis.cycleAnalysis?.currentPhase === 'Bull' ? 'text-teal-400' : 'text-red-400'}`}>
                        {analysisData.analysis.cycleAnalysis?.currentPhase}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Duration: {analysisData.analysis.cycleAnalysis?.currentPhaseDuration} days
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Cycle Quality</p>
                      <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {analysisData.analysis.cycleAnalysis?.cycleQuality}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Strength: {analysisData.analysis.cycleAnalysis?.cycleStrength?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Expected Transition</p>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {analysisData.analysis.cycleAnalysis?.expectedTransitionDate ? 
                          new Date(analysisData.analysis.cycleAnalysis.expectedTransitionDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Completion: {analysisData.analysis.cycleAnalysis?.cycleCompletionPercentage}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Report */}
                <div className={`rounded-lg border p-6 ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📄</span>
                      <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Comprehensive Report</h4>
                    </div>
                  </div>
                  {analysisData.report ? (
                    <div className={`space-y-4 ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'} rounded-lg p-4`}>
                      {renderReport(analysisData.report)}
                    </div>
                  ) : (
                    <div className={`text-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      <p className="text-sm">No detailed report available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : analysisError ? (
              <div className={`text-center py-12 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                <p className="text-lg mb-2">⚠️</p>
                <p className="text-base font-medium">Failed to load analysis</p>
                <p className="text-sm mt-2">{analysisError}</p>
                <button
                  onClick={fetchAnalysis}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                <p className="text-base font-medium">No analysis data available</p>
                <p className="text-sm mt-2">Analysis is loading automatically...</p>
                <button
                  onClick={fetchAnalysis}
                  className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold text-sm transition-colors shadow-md"
                >
                  Generate Analysis
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Grid - AI Chat & Signal Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* AI Chat - 8 columns */}
          <div className="lg:col-span-8">
            <div className={`rounded-xl overflow-hidden flex flex-col shadow-sm h-[450px] md:h-[500px] ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
              <div className={`p-3 md:p-4 border-b ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg p-1.5 shadow-lg shadow-teal-500/20">
                    <span className="text-white text-sm">✨</span>
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Assistant</h3>
                    <p className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Powered by SeunBot Neural Engine</p>
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <div className={`flex-1 flex flex-col min-h-[300px] relative ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                      <div className={`flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 ${isDark ? 'bg-[#0a0f16]/50' : 'bg-slate-50/50'}`}>
                        {chatMessages.map((message, idx) => (
                          <div key={idx} className={`flex gap-2 md:gap-3 ${message.role === 'user' ? 'max-w-[95%] sm:max-w-[90%] ml-auto flex-row-reverse' : 'max-w-[95%] sm:max-w-[90%]'}`}>
                            <div className={`size-7 md:size-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                              message.role === 'user' ? (isDark ? 'bg-gray-700' : 'bg-gray-300') : 'bg-teal-500/10 border border-teal-500/20'
                            }`}>
                              <span className="text-xs">{message.role === 'user' ? '👤' : '🤖'}</span>
                            </div>
                            <div className={`space-y-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                              <div className={`p-2.5 md:p-3 rounded-2xl ${
                                message.role === 'user'
                                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-tr-none shadow-md shadow-teal-500/10'
                                  : isDark ? 'bg-[#0f1520] border border-white/10 rounded-tl-none shadow-sm text-gray-200' : 'bg-white border border-gray-200 rounded-tl-none shadow-sm text-slate-700'
                              }`}>
                                <p className="text-xs md:text-sm leading-relaxed">{message.content}</p>
                              </div>
                              <p className="text-[10px] text-gray-400 px-1">Just now</p>
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex gap-3 max-w-[90%]">
                            <div className="size-8 rounded-full flex-shrink-0 flex items-center justify-center bg-teal-500/10 border border-teal-500/20">
                              <span className="text-xs">🤖</span>
                            </div>
                            <div className="space-y-1">
                              <div className={`p-3 rounded-2xl rounded-tl-none shadow-sm ${isDark ? 'bg-[#0f1520] border border-white/10' : 'bg-white border border-gray-200'}`}>
                                <div className="flex gap-1">
                                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-400 px-1">Typing...</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`p-3 border-t ${isDark ? 'bg-[#0b111b] border-white/5' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                            className={`flex-1 border-none rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-teal-500 ${isDark ? 'bg-[#0f1520] text-white placeholder:text-gray-500' : 'bg-slate-100 text-slate-900 placeholder:text-gray-400'}`}
                            placeholder="Ask about support, resistance, or trends..."
                            type="text"
                          />
                          <button
                            onClick={handleChatSend}
                            disabled={!chatInput.trim()}
                            className="p-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-sm shadow-teal-500/30"
                            title="Send message"
                          >
                            <span className="text-[18px]">➤</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={`w-full md:w-64 p-4 flex flex-col gap-3 ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Suggested Prompts</p>
                      <button onClick={() => handleSuggestedPrompt('Where are the key buy zones?')} className={`text-left p-3 rounded-lg border hover:border-teal-500/50 hover:shadow-sm transition-all group ${isDark ? 'border-white/10 bg-[#0f1520]' : 'border-gray-200 bg-white'}`}>
                        <p className={`text-xs font-bold group-hover:text-teal-400 transition-colors ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>Analyze Support Levels</p>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Where are the key buy zones?</p>
                      </button>
                      <button onClick={() => handleSuggestedPrompt('What is the current Elliott Wave count?')} className={`text-left p-3 rounded-lg border hover:border-teal-500/50 hover:shadow-sm transition-all group ${isDark ? 'border-white/10 bg-[#0f1520]' : 'border-gray-200 bg-white'}`}>
                        <p className={`text-xs font-bold group-hover:text-teal-400 transition-colors ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>Explain Elliott Wave</p>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>What is the current wave count?</p>
                      </button>
                      <button onClick={() => handleSuggestedPrompt('Is the risk/reward ratio favorable?')} className={`text-left p-3 rounded-lg border hover:border-teal-500/50 hover:shadow-sm transition-all group ${isDark ? 'border-white/10 bg-[#0f1520]' : 'border-gray-200 bg-white'}`}>
                        <p className={`text-xs font-bold group-hover:text-teal-400 transition-colors ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>Risk Assessment</p>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Is the risk/reward ratio favorable?</p>
                      </button>
                    </div>
                  </div>
            </div>
          </div>

          {/* Signal Intelligence - 4 columns */}
          <div className="lg:col-span-4">
            {/* Signal Intelligence */}
            <div className={`rounded-xl border border-teal-500/30 shadow-[0_0_30px_-10px_rgba(20,184,166,0.15)] overflow-hidden relative ${isDark ? 'bg-[#0b111b]' : 'bg-white'}`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50"></div>
              <div className={`p-5 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>🧠</span>
                      Signal Intelligence
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>AI Confidence Score</p>
                  </div>
                  {asset.signal ? (
                    <div className="bg-[#0bda6c]/10 border border-[#0bda6c]/20 text-[#0bda6c] px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm animate-pulse">
                      <span>↑</span>
                      {asset.signal}
                    </div>
                  ) : (
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                      No Signal
                    </div>
                  )}
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Confidence</span>
                    <span className={isDark ? 'text-white' : 'text-slate-900'}>{asset.strength || 0} / 5.0</span>
                  </div>
                  <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                      style={{ width: `${((asset.strength || 0) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className={`p-5 grid grid-cols-2 gap-4 ${isDark ? 'bg-[#0a0f16]/60' : 'bg-slate-50'}`}>
                <div className="col-span-2">
                  <p className={`text-xs uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Entry Zone</p>
                  <p className={`text-2xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {asset.entry ? `$${asset.entry.toLocaleString()}` : '-'} <span className={`text-sm font-sans font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{asset.entry ? 'market' : 'N/A'}</span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f1520] border-white/5' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-1.5 rounded-full bg-[#ff4d4d]"></span>
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Stop Loss</p>
                  </div>
                  <p className="text-lg font-bold text-[#ff4d4d] font-mono">{asset.stopLoss ? `$${asset.stopLoss.toLocaleString()}` : '-'}</p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{asset.stopLoss ? '-3.35% Risk' : 'N/A'}</p>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-1.5 rounded-full bg-teal-500"></span>
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Pos. Size</p>
                  </div>
                  <p className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>3.0%</p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Risk Management</p>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f1520] border-white/5' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-1.5 rounded-full bg-[#0bda6c]"></span>
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>TP 1</p>
                  </div>
                  <p className="text-lg font-bold text-[#0bda6c] font-mono">{asset.takeProfit1 ? `$${asset.takeProfit1.toLocaleString()}` : '-'}</p>
                </div>
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f1520] border-white/5' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-1.5 rounded-full bg-[#0bda6c]"></span>
                    <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>TP 2</p>
                  </div>
                  <p className="text-lg font-bold text-[#0bda6c] font-mono">{asset.takeProfit2 ? `$${asset.takeProfit2.toLocaleString()}` : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fullscreen Chart Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-white text-lg font-bold">{asset.name} - {timeframe} Chart</h3>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-gray-400">
              <p className="text-2xl font-medium">The chart will show here</p>
              <p className="text-lg mt-4">TradingView integration coming soon</p>
              <p className="text-sm mt-2">Timeframe: {timeframe}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`mt-auto border-t py-6 ${isDark ? 'border-white/5 bg-[#0b0f16]' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>© 2024 SeunBot Pro. Financial data provided for informational purposes only.</p>
          <div className="flex gap-4">
            <a className={`text-xs hover:text-teal-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`} href="#">Terms of Service</a>
            <a className={`text-xs hover:text-teal-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`} href="#">Privacy Policy</a>
            <a className={`text-xs hover:text-teal-400 transition-colors ${isDark ? 'text-gray-500' : 'text-gray-600'}`} href="#">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
