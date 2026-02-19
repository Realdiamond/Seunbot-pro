'use client';

import { useState } from 'react';
import { getMockChatResponse } from '@/lib/mockData';
import { ChatMessage } from '@/types';
import Link from 'next/link';

export default function ChatPage() {
  const [chatInput, setChatInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you understand market signals and trading insights. Ask me about any asset or market sentiment.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getMockChatResponse(chatInput);
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleNewAnalysis = () => {
    setChatMessages([
      {
        role: 'assistant',
        content: 'Hello! I can help you understand market signals and trading insights. Ask me about any asset or market sentiment.',
        timestamp: new Date().toISOString(),
      },
    ]);
    setChatInput('');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'AI Chat', path: '/chat', icon: '🤖' },
    { name: 'Profile', path: '/profile', icon: '👤' },
  ];

  const recentChats = [
    { title: 'BTC Analysis Today', subtitle: 'Bullish divergence noted on 4h...' },
    { title: 'ETH Support Levels', subtitle: 'Testing 200 EMA support...' },
    { title: 'Gold vs DXY Sentiment', subtitle: 'Inverse correlation strengthening...' },
    { title: 'NVDA Earnings Play', subtitle: 'Implied volatility crushing...' },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0b0f16] text-white' : 'bg-[#f6f6f8] text-slate-900'}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`border-r transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          } ${isDark ? 'border-white/5 bg-[#0a0f16]' : 'border-gray-200 bg-white'}`}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-5">
              <div className={`flex items-center gap-3 ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500" />
                <div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>SeunBot Pro</p>
                  <p className="text-xs text-gray-500">Market Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className={`h-9 w-9 rounded-lg border transition-colors ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-slate-900'}`}
              >
                {sidebarOpen ? '⟨' : '⟩'}
              </button>
            </div>

            <div className="px-4 py-3">
              <button
                onClick={handleNewAnalysis}
                className={`w-full rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium py-2.5 shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all ${sidebarOpen ? 'px-4' : 'px-2'}`}
              >
                {sidebarOpen ? '+ New Analysis' : '+'}
              </button>
            </div>

            <div className="px-3 py-2">
              <p className={`text-[11px] uppercase tracking-widest text-gray-500 ${sidebarOpen ? 'block' : 'hidden'}`}>
                Menu
              </p>
            </div>

            <nav className="px-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    item.path === '/chat' 
                      ? isDark ? 'bg-[#131a24] text-white' : 'bg-slate-200 text-slate-900' 
                      : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>{item.name}</span>
                </Link>
              ))}
            </nav>

            <div className={`px-3 mt-5 flex-1 ${sidebarOpen ? 'block' : 'hidden'}`}>
              <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Recent</p>
              <div className="space-y-1">
                {recentChats.map((chat, idx) => (
                  <button
                    key={idx}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}
                  >
                    <p className={`text-xs font-medium truncate ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{chat.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{chat.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className={`px-4 py-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>AT</div>
                <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Alex Trader</p>
                  <p className="text-xs text-gray-500">Pro Plan</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-3">
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Market Chat</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`px-3 py-2 rounded-lg border transition-colors ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' : 'bg-gray-200 text-slate-900 hover:bg-gray-300'}`}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <div className="relative">
                <button
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className={`h-9 w-9 rounded-lg border relative ${isDark ? 'border-white/10 bg-white/5 text-gray-300 hover:text-white' : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-slate-900'}`}
                >
                  🔔
                  <span className="absolute top-1 right-1 h-2 w-2 bg-teal-500 rounded-full"></span>
                </button>
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-lg border border-white/10 bg-[#0f1520] shadow-xl z-50">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 hover:bg-white/5 border-b border-white/5">
                        <p className="text-sm text-white mb-1">New BUY signal: BTC</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                      <div className="p-4 hover:bg-white/5 border-b border-white/5">
                        <p className="text-sm text-white mb-1">TSLA reached TP1</p>
                        <p className="text-xs text-gray-500">15 minutes ago</p>
                      </div>
                      <div className="p-4 hover:bg-white/5">
                        <p className="text-sm text-white mb-1">Market analysis updated</p>
                        <p className="text-xs text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/profile" className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white flex items-center justify-center">👤</Link>
            </div>
          </header>

          {/* Chat Container */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.map((message, idx) => (
                <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                      : isDark ? 'bg-[#0f1520] border border-white/10 text-gray-200' : 'bg-white border border-gray-200 text-slate-900'
                  }`}>
                    {message.role === 'assistant' && (
                      <div className="text-xs text-gray-400 mb-2 font-medium">🤖 AI Assistant</div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-teal-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp || Date.now()).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className={`max-w-[75%] rounded-2xl p-4 border ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className="text-xs text-gray-400 mb-2 font-medium">🤖 AI Assistant</div>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className={`border-t px-6 py-4 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask about market signals, trends, or specific assets..."
                  className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDark ? 'bg-[#0f1520] border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-400'}`}
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
