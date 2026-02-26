'use client';

import { useState, useEffect } from 'react';
import { ChatMessage } from '@/types';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const [chatInput, setChatInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved !== 'light';
    }
    return true;
  });
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load chat from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat_messages');
    const savedConversationId = localStorage.getItem('chat_conversationId');
    const savedFollowups = localStorage.getItem('chat_followups');
    
    if (savedMessages) {
      try {
        setChatMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Error loading chat messages:', error);
        // Set default welcome message if parse fails
        setChatMessages([{
          role: 'assistant',
          content: 'Hello! I can help you understand market signals and trading insights. Ask me about any asset or market sentiment.',
          timestamp: new Date().toISOString(),
        }]);
      }
    } else {
      // Initialize with welcome message
      setChatMessages([{
        role: 'assistant',
        content: 'Hello! I can help you understand market signals and trading insights. Ask me about any asset or market sentiment.',
        timestamp: new Date().toISOString(),
      }]);
    }
    
    if (savedConversationId) {
      setConversationId(savedConversationId);
    }
    
    if (savedFollowups) {
      try {
        setSuggestedFollowups(JSON.parse(savedFollowups));
      } catch (error) {
        console.error('Error loading followups:', error);
      }
    }
  }, []);

  // Save chat to localStorage whenever it changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('chat_messages', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('chat_conversationId', conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (suggestedFollowups.length > 0) {
      localStorage.setItem('chat_followups', JSON.stringify(suggestedFollowups));
    }
  }, [suggestedFollowups]);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');
    setIsTyping(true);

    // Retry logic for 503/502 errors (Heroku dyno waking up)
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait before retrying (exponential backoff: 1s, 2s, 4s)
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId: conversationId,
            message: currentInput,
            includeMarketData: true,
            includeAnalysis: true,
            includeNews: true,
            includeSentiment: true,
          }),
        });

        if (!response.ok) {
          const error = new Error(`API returned ${response.status}`);
          // Retry only on 503 (Service Unavailable) or 502 (Bad Gateway)
          if ((response.status === 503 || response.status === 502) && attempt < maxRetries - 1) {
            lastError = error;
            continue; // Try again
          }
          throw error; // Don't retry other errors or on last attempt
        }

        const data = await response.json();
        
        // Update conversation ID
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        // Update suggested follow-ups
        if (data.suggestedFollowups) {
          setSuggestedFollowups(data.suggestedFollowups);
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message || 'Sorry, I could not generate a response.',
          timestamp: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
        return; // Success, exit function
      } catch (error) {
        lastError = error as Error;
        // Continue to next attempt if it's a retryable error
        if (attempt < maxRetries - 1 && (lastError.message.includes('503') || lastError.message.includes('502'))) {
          continue;
        }
        break; // Exit loop on non-retryable errors or last attempt
      }
    }

    // If we get here, all retries failed
    console.error('Chat API error after retries:', lastError);
    let errorContent = 'Sorry, I encountered an error. Please try again.';
    
    if (lastError?.message.includes('503')) {
      errorContent = 'The AI service is temporarily unavailable. It may be starting up - please wait a moment and try again.';
    } else if (lastError?.message.includes('502')) {
      errorContent = 'Connection to AI service failed. Please check your internet connection and try again.';
    } else if (lastError?.message.includes('429')) {
      errorContent = 'Too many requests. Please wait a moment before trying again.';
    } else if (lastError?.message.includes('500')) {
      errorContent = 'Internal server error. The AI service is experiencing issues. Please try again later.';
    }

    const errorMessage: ChatMessage = {
      role: 'assistant',
      content: errorContent,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, errorMessage]);
    setIsTyping(false);
  };

  const handleNewAnalysis = async () => {
    // Delete old conversation if exists
    if (conversationId) {
      try {
        await fetch(`/api/chat/${conversationId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }

    // Clear localStorage
    localStorage.removeItem('chat_messages');
    localStorage.removeItem('chat_conversationId');
    localStorage.removeItem('chat_followups');

    // Reset state
    setConversationId(null);
    setSuggestedFollowups([]);
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
  ];

  return (
    <div className={`h-[100dvh] flex flex-col ${isDark ? 'bg-[#0b0f16] text-white' : 'bg-[#f6f6f8] text-slate-900'}`}>
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside
          className={`border-r transition-all duration-300 z-40 ${
            sidebarOpen ? 'lg:w-64' : 'lg:w-20'
          } ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } fixed lg:relative h-full w-64 ${isDark ? 'border-white/5 bg-[#0a0f16]' : 'border-gray-200 bg-white'}`}
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
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden h-9 w-9 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}
              >
                ☰
              </button>
              <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Market Chat</h1>
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

          {/* Chat Container */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
              {chatMessages.map((message, idx) => (
                <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`w-full md:max-w-[75%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                      : isDark ? 'bg-[#0f1520] border border-white/10 text-gray-200' : 'bg-white border border-gray-200 text-slate-700'
                  }`}>
                    {message.role === 'assistant' && (
                      <div className={`text-xs mb-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>🤖 AI Assistant</div>
                    )}
                    <div className={`prose ${
                      message.role === 'user' 
                        ? 'prose-invert' 
                        : isDark 
                          ? 'prose-invert max-w-none' 
                          : 'prose-slate max-w-none'
                    }`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-teal-100' : isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {new Date(message.timestamp ?? new Date()).toLocaleTimeString('en-US', {
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
                  <div className={`w-full md:max-w-[75%] rounded-2xl p-4 border ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                    <div className={`text-xs mb-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>🤖 AI Assistant</div>
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
            <div className={`border-t px-4 sm:px-6 py-4 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask about market signals, trends, or specific assets..."
                  className={`flex-1 px-3 sm:px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${isDark ? 'bg-[#0f1520] border-white/10 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-slate-900 placeholder-gray-400'}`}
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim()}
                  className="px-4 sm:px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-500 hover:to-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/30 flex-shrink-0"
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
