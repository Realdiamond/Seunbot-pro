'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { getAssetBySymbol, getMockChatResponse } from '@/lib/mockData';
import { ChatMessage } from '@/types';
import Link from 'next/link';

type Timeframe = 'Monthly' | 'Weekly' | 'Daily';

export default function AssetPage() {
  const params = useParams();
  const symbol = params.symbol as string;
  const asset = getAssetBySymbol(symbol);

  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: `I've analyzed the ${symbol} chart. We are currently seeing a confluence of bullish signals. Specifically, Wave 3 impulse is active and RSI is showing hidden bullish divergence. Would you like a deeper breakdown of the resistance levels?` 
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#121118] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Asset Not Found</h1>
          <p className="text-gray-400 mb-4">The asset you're looking for doesn't exist.</p>
          <Link href="/" className="text-[#3713ec] hover:text-[#3713ec]/80">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');

    setTimeout(() => {
      const aiResponse = getMockChatResponse(chatInput);
      const aiMessage: ChatMessage = { role: 'assistant', content: aiResponse };
      setChatMessages((prev) => [...prev, aiMessage]);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#121118] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#2b2839] px-6 py-3 bg-[#121118]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded bg-[#3713ec] flex items-center justify-center text-white">
              <span className="text-[20px]">🤖</span>
            </div>
            <h2 className="text-lg font-bold">SeunBot Pro</h2>
          </div>
          <div className="hidden md:flex">
            <input
              type="text"
              placeholder="Search Asset (e.g. ETH)"
              className="w-64 h-10 px-4 pl-10 bg-[#1e1c26] border border-[#2b2839] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3713ec]"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Dashboard</Link>
            <Link href="/markets" className="text-white text-sm font-medium">Markets</Link>
            <Link href="/chat" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Signals</Link>
            <Link href="/profile" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Portfolio</Link>
          </nav>
          <div className="h-6 w-px bg-[#2b2839] hidden lg:block"></div>
          <button className="px-4 h-9 bg-[#3713ec] hover:bg-[#3713ec]/90 transition-colors text-white text-sm font-bold rounded-lg shadow-lg shadow-[#3713ec]/20">
            Connect Wallet
          </button>
          <div className="size-9 rounded-full bg-gray-700 border border-[#2b2839]"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:px-8 max-w-[1600px] mx-auto w-full gap-6">
        {/* Asset Header */}
        <section className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl bg-[#1e1c26] border border-[#2b2839] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <span className="text-2xl">₿</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{asset.name}</h1>
                <span className="text-sm font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded">{asset.symbol}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Asset Intelligence Report</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 divide-x divide-[#2b2839]">
            <div className="px-4 first:pl-0">
              <p className="text-sm text-gray-400 mb-1">Current Price</p>
              <p className="text-xl font-bold text-white">${asset.entry?.toLocaleString() || 'N/A'}</p>
            </div>
            <div className="px-4">
              <p className="text-sm text-gray-400 mb-1">24h Change</p>
              <div className="flex items-center gap-1 text-[#0bda6c]">
                <span>↗</span>
                <span className="text-lg font-bold">+2.45%</span>
              </div>
            </div>
            <div className="px-4">
              <p className="text-sm text-gray-400 mb-1">24h Volume</p>
              <p className="text-lg font-bold text-white">$34.2B</p>
            </div>
            <div className="px-4 hidden sm:block">
              <p className="text-sm text-gray-400 mb-1">Market Cap</p>
              <p className="text-lg font-bold text-white">$1.2T</p>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column - Chart & AI */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Chart */}
            <div className="bg-[#1e1c26] rounded-xl border border-[#2b2839] flex flex-col h-[500px] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#2b2839] p-4 bg-[#15141b]">
                <div className="flex items-center gap-2 bg-[#2b2839] p-1 rounded-lg">
                  {(['Monthly', 'Weekly', 'Daily'] as Timeframe[]).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        timeframe === tf
                          ? 'bg-[#3713ec] text-white shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                    <span className="size-2 rounded-full bg-[#0bda6c]"></span>
                    Market Open
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-colors">
                    <span className="text-xl">⛶</span>
                  </button>
                </div>
              </div>
              <div className="relative flex-1 bg-[#13111a] w-full h-full p-4">
                {/* Grid Background */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="border-r border-b border-white/[0.03]"></div>
                  ))}
                </div>
                {/* Chart Placeholder */}
                <div className="relative h-full w-full flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full p-8" preserveAspectRatio="none">
                    <path
                      className="opacity-80 drop-shadow-[0_0_8px_rgba(55,19,236,0.6)]"
                      d="M0,400 C100,380 200,420 300,350 C400,280 500,300 600,200 C700,100 800,150 900,100"
                      fill="none"
                      stroke="#3713ec"
                      strokeWidth="2"
                    />
                    <path
                      className="opacity-50"
                      d="M0,420 C100,400 200,440 300,380 C400,320 500,340 600,250 C700,180 800,200 900,160"
                      fill="none"
                      stroke="#0bda6c"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />
                  </svg>
                  <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-[#3713ec] font-bold">EMA 50</span>
                      <span className="text-gray-400">63,892.50</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-[#0bda6c] font-bold">EMA 200</span>
                      <span className="text-gray-400">61,204.10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="flex-1 bg-[#1e1c26] rounded-xl border border-[#2b2839] overflow-hidden flex flex-col shadow-sm">
              <div className="p-4 border-b border-[#2b2839] flex items-center justify-between bg-[#1e1c26]">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#3713ec] to-blue-500 rounded-lg p-1.5 shadow-lg shadow-[#3713ec]/20">
                    <span className="text-white text-sm">✨</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Signal AI Assistant</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Powered by SeunBot Neural Engine</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-[#0bda6c]/10 text-[#0bda6c] text-[10px] font-bold border border-[#0bda6c]/20">ONLINE</span>
              </div>
              <div className="flex-1 flex flex-col md:flex-row h-full max-h-[400px]">
                <div className="flex-1 flex flex-col min-h-[300px] border-b md:border-b-0 md:border-r border-[#2b2839] relative">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#15141b]/50">
                    {chatMessages.map((message, idx) => (
                      <div key={idx} className={`flex gap-3 ${message.role === 'user' ? 'max-w-[90%] ml-auto flex-row-reverse' : 'max-w-[90%]'}`}>
                        <div className={`size-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                          message.role === 'user' ? 'bg-gray-700' : 'bg-[#3713ec]/10 border border-[#3713ec]/20'
                        }`}>
                          <span className="text-xs">{message.role === 'user' ? '👤' : '🤖'}</span>
                        </div>
                        <div className={`space-y-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                          <div className={`p-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-[#3713ec] text-white rounded-tr-none shadow-md shadow-[#3713ec]/10'
                              : 'bg-[#25232e] border border-[#2b2839] rounded-tl-none shadow-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 px-1">Just now</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-[#1e1c26] border-t border-[#2b2839]">
                    <div className="relative flex items-center">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                        className="w-full bg-[#15141b] border-none rounded-lg py-3 pl-4 pr-12 text-sm text-white focus:ring-1 focus:ring-[#3713ec] placeholder:text-gray-500"
                        placeholder="Ask about support, resistance, or trends..."
                        type="text"
                      />
                      <button
                        onClick={handleChatSend}
                        className="absolute right-2 p-1.5 bg-[#3713ec] hover:bg-[#3713ec]/90 text-white rounded-md transition-colors shadow-sm"
                      >
                        <span className="text-[18px]">➤</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-64 bg-[#18171f] p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Suggested Prompts</p>
                  <button className="text-left p-3 rounded-lg border border-[#2b2839] bg-[#1e1c26] hover:border-[#3713ec]/50 hover:shadow-sm transition-all group">
                    <p className="text-xs font-bold text-gray-200 group-hover:text-[#3713ec] transition-colors">Analyze Support Levels</p>
                    <p className="text-[10px] text-gray-500 mt-1">Where are the key buy zones?</p>
                  </button>
                  <button className="text-left p-3 rounded-lg border border-[#2b2839] bg-[#1e1c26] hover:border-[#3713ec]/50 hover:shadow-sm transition-all group">
                    <p className="text-xs font-bold text-gray-200 group-hover:text-[#3713ec] transition-colors">Explain Elliott Wave</p>
                    <p className="text-[10px] text-gray-500 mt-1">What is the current wave count?</p>
                  </button>
                  <button className="text-left p-3 rounded-lg border border-[#2b2839] bg-[#1e1c26] hover:border-[#3713ec]/50 hover:shadow-sm transition-all group">
                    <p className="text-xs font-bold text-gray-200 group-hover:text-[#3713ec] transition-colors">Risk Assessment</p>
                    <p className="text-[10px] text-gray-500 mt-1">Is the risk/reward ratio favorable?</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Event Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1e1c26] border border-[#2b2839] p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-[#3713ec]">
                  <span className="text-sm">⏰</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Upcoming Event</span>
                </div>
                <p className="text-sm font-bold text-white">FOMC Meeting Minutes</p>
                <p className="text-xs text-gray-500 mt-1">In 2 hours 15 mins</p>
              </div>
              <div className="bg-[#1e1c26] border border-[#2b2839] p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-[#a855f7]">
                  <span className="text-sm">📊</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Volatility Alert</span>
                </div>
                <p className="text-sm font-bold text-white">High Volatility Expected</p>
                <p className="text-xs text-gray-500 mt-1">Due to macro data release</p>
              </div>
              <div className="bg-[#1e1c26] border border-[#2b2839] p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-gray-400">
                  <span className="text-sm">⇄</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Correlation</span>
                </div>
                <p className="text-sm font-bold text-white">High w/ NASDAQ 100</p>
                <p className="text-xs text-gray-500 mt-1">0.89 Coefficient (Last 30d)</p>
              </div>
            </div>
          </div>

          {/* Right Column - Signal & Technical */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Signal Intelligence */}
            <div className="bg-[#1e1c26] rounded-xl border border-[#3713ec]/30 shadow-[0_0_30px_-10px_rgba(55,19,236,0.15)] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#3713ec] to-transparent opacity-50"></div>
              <div className="p-5 border-b border-[#2b2839]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>🧠</span>
                      Signal Intelligence
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">AI Confidence Score</p>
                  </div>
                  <div className="bg-[#0bda6c]/10 border border-[#0bda6c]/20 text-[#0bda6c] px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm animate-pulse">
                    <span>↑</span>
                    {asset.signal}
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-gray-400">Confidence</span>
                    <span className="text-white">{asset.strength || 0} / 5.0</span>
                  </div>
                  <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#3713ec] to-[#0bda6c] rounded-full"
                      style={{ width: `${((asset.strength || 0) / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4 bg-black/20">
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Entry Zone</p>
                  <p className="text-2xl font-bold text-white font-mono tracking-tight">
                    ${asset.entry?.toLocaleString() || 'N/A'} <span className="text-sm text-gray-400 font-sans font-normal">market</span>
                  </p>
                </div>
                <div className="bg-[#25232e] p-3 rounded-lg border border-[#2b2839]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-1.5 rounded-full bg-[#ff4d4d]"></span>
                    <p className="text-xs text-gray-500 font-medium">Stop Loss</p>
                  </div>
                  <p className="text-lg font-bold text-[#ff4d4d] font-mono">${asset.stopLoss?.toLocaleString() || 'N/A'}</p>
                  <p className="text-[10px] text-gray-400">-3.35% Risk</p>
                </div>
                <div className="bg-[#25232e] p-3 rounded-lg border border-[#2b2839]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-1.5 rounded-full bg-[#3713ec]"></span>
                    <p className="text-xs text-gray-500 font-medium">Pos. Size</p>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">3.0%</p>
                  <p className="text-[10px] text-gray-400">Risk Management</p>
                </div>
                <div className="bg-[#25232e] p-3 rounded-lg border border-[#2b2839]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-1.5 rounded-full bg-[#0bda6c]"></span>
                    <p className="text-xs text-gray-500 font-medium">TP 1</p>
                  </div>
                  <p className="text-lg font-bold text-[#0bda6c] font-mono">${asset.takeProfit1?.toLocaleString() || 'N/A'}</p>
                </div>
                <div className="bg-[#25232e] p-3 rounded-lg border border-[#2b2839]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="size-1.5 rounded-full bg-[#0bda6c]"></span>
                    <p className="text-xs text-gray-500 font-medium">TP 2</p>
                  </div>
                  <p className="text-lg font-bold text-[#0bda6c] font-mono">${asset.takeProfit2?.toLocaleString() || 'N/A'}</p>
                </div>
              </div>
              <div className="p-4 border-t border-[#2b2839]">
                <button className="w-full py-3 bg-[#3713ec] hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-[#3713ec]/25 flex items-center justify-center gap-2">
                  <span>Execute Trade</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Technical Breakdown */}
            <div className="bg-[#1e1c26] rounded-xl border border-[#2b2839] flex-1 flex flex-col">
              <div className="p-4 border-b border-[#2b2839] flex justify-between items-center">
                <h3 className="text-base font-bold text-white">Technical Breakdown</h3>
                <button className="text-[#3713ec] text-xs font-bold hover:underline">View All</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <div className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-[#2b2839] last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500/10 text-blue-500 p-1.5 rounded text-xs font-bold">EW</div>
                      <p className="text-sm font-bold text-gray-200">Elliott Wave</p>
                    </div>
                    <span className="text-xs bg-[#0bda6c]/10 text-[#0bda6c] px-2 py-0.5 rounded font-medium">Bullish</span>
                  </div>
                  <p className="text-sm text-gray-400 pl-9 leading-relaxed">
                    Currently in <span className="text-white font-medium">Wave {asset.elliottWave}</span> impulsive move. High probability of extension above recent swing highs.
                  </p>
                </div>
                <div className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-[#2b2839] last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-500/10 text-purple-500 p-1.5 rounded text-xs font-bold">SMC</div>
                      <p className="text-sm font-bold text-gray-200">Smart Money</p>
                    </div>
                    <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded font-medium">Neutral</span>
                  </div>
                  <p className="text-sm text-gray-400 pl-9 leading-relaxed">
                    Clean rejection from {timeframe} <span className="text-white font-medium">{asset.smcZone}</span>. Watching for displacement to confirm trend continuation.
                  </p>
                </div>
                <div className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-[#2b2839] last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-pink-500/10 text-pink-500 p-1.5 rounded text-xs font-bold">GANN</div>
                      <p className="text-sm font-bold text-gray-200">Gann Box</p>
                    </div>
                    <span className="text-xs bg-[#0bda6c]/10 text-[#0bda6c] px-2 py-0.5 rounded font-medium">Bullish</span>
                  </div>
                  <p className="text-sm text-gray-400 pl-9 leading-relaxed">
                    Price action sustaining above the <span className="text-white font-medium">{asset.gann}</span> support line.
                  </p>
                </div>
                <div className="group flex flex-col gap-2 p-3 rounded-lg hover:bg-white/5 transition-colors border-b border-[#2b2839] last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="bg-teal-500/10 text-teal-500 p-1.5 rounded text-xs font-bold">OSC</div>
                      <p className="text-sm font-bold text-gray-200">RSI / MACD</p>
                    </div>
                    <span className="text-xs bg-[#0bda6c]/10 text-[#0bda6c] px-2 py-0.5 rounded font-medium">Divergence</span>
                  </div>
                  <p className="text-sm text-gray-400 pl-9 leading-relaxed">
                    Hidden bullish divergence spotted on <span className="text-white font-medium">{timeframe} RSI</span>. Momentum shifting upwards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#2b2839] py-6 bg-[#121118]">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-400">© 2024 SeunBot Pro. Financial data provided for informational purposes only.</p>
          <div className="flex gap-4">
            <a className="text-xs text-gray-500 hover:text-[#3713ec] transition-colors" href="#">Terms of Service</a>
            <a className="text-xs text-gray-500 hover:text-[#3713ec] transition-colors" href="#">Privacy Policy</a>
            <a className="text-xs text-gray-500 hover:text-[#3713ec] transition-colors" href="#">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
