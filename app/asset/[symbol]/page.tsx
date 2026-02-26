'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { ChatMessage, Asset, PredictionResponse, SentimentResponse, PredictionHistoryItem } from '@/types';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved !== 'light';
    }
    return true;
  });
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestedFollowups, setSuggestedFollowups] = useState<string[]>([]);
  const [loadingInitialMessage, setLoadingInitialMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'sentiment' | 'chat'>('analysis');
  
  // Prediction API States
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentResponse | null>(null);
  const [historyData, setHistoryData] = useState<PredictionHistoryItem[]>([]);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Analysis Settings & Data
  const [accountBalance, setAccountBalance] = useState(10000);
  const [fundamentalScore, setFundamentalScore] = useState(0); // -3 to +3
  const [sentimentScore, setSentimentScore] = useState(0);     // -3 to +3
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

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
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ANALYSIS API ERROR');
        console.error('Status:', response.status, response.statusText);
        console.error('URL:', `${API_BASE_URL}/api/Analysis/comprehensive-report/${asset.symbol}?${queryParams}`);
        console.error('Raw Response:', errorText);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        let errorMessage = `${response.status} ${response.statusText}`;
        
        if (errorText) {
          try {
            const errorJson = JSON.parse(errorText);
            console.error('Parsed Error JSON:', errorJson);
            
            // Extract validation errors if present
            if (errorJson.errors) {
              errorMessage = Object.entries(errorJson.errors)
                .map(([field, messages]: [string, any]) => `${field}: ${messages.join(', ')}`)
                .join('; ');
            } else if (errorJson.title) {
              errorMessage = errorJson.title;
            } else if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch (parseError) {
            // Not JSON, use raw text
            errorMessage = errorText || errorMessage;
          }
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

  // Fetch prediction data
  const fetchPrediction = async () => {
    if (!asset) return;
    setLoadingPrediction(true);
    try {
      const response = await fetch(`/api/prediction/${asset.symbol}`);
      if (response.ok) {
        const data = await response.json();
        setPredictionData(data);
        console.log('✅ Prediction loaded for', asset.symbol);
      } else {
        console.warn(`Prediction API returned status: ${response.status} for ${asset.symbol}`);
      }
    } catch (error) {
      if (error instanceof TypeError && (error as any).message === 'Failed to fetch') {
        console.warn('⚠️ Prediction API unavailable (CORS or network issue)');
      } else {
        console.error('Error fetching prediction:', error);
      }
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Fetch sentiment data
  const fetchSentiment = async () => {
    if (!asset) return;
    setLoadingSentiment(true);
    try {
      const response = await fetch(`/api/prediction/${asset.symbol}/sentiment`);
      if (response.ok) {
        const data = await response.json();
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 SENTIMENT API RESPONSE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Symbol:', asset.symbol);
        console.log('Complete Response:', JSON.stringify(data, null, 2));
        console.log('sentimentLabel:', data.sentimentLabel);
        console.log('sentimentScore:', data.sentimentScore);
        console.log('confidence:', data.confidence);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        setSentimentData(data);
        console.log('✅ Sentiment loaded for', asset.symbol);
      } else {
        console.warn(`Sentiment API returned status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof TypeError && (error as any).message === 'Failed to fetch') {
        console.warn('⚠️ Sentiment API unavailable');
      } else {
        console.error('Error fetching sentiment:', error);
      }
    } finally {
      setLoadingSentiment(false);
    }
  };

  // Fetch prediction history
  const fetchHistory = async () => {
    if (!asset) return;
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/prediction/${asset.symbol}/history?count=10`);
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
        console.log('✅ History loaded:', data.length, 'records');
      } else {
        console.warn(`History API returned status: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof TypeError && (error as any).message === 'Failed to fetch') {
        console.warn('⚠️ History API unavailable');
      } else {
        console.error('Error fetching history:', error);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

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

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Fetch analysis and predictions when asset is loaded
  useEffect(() => {
    if (asset) {
      fetchAnalysis();
      fetchPrediction();
      fetchSentiment();
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  // Fetch initial chat message when page loads (pre-load chat for instant access)
  useEffect(() => {
    if (chatMessages.length === 0 && !loadingInitialMessage && asset) {
      setLoadingInitialMessage(true);
      
      fetch(`/api/chat?message=Give me a quick analysis overview of this stock&symbol=${asset.symbol}`)
        .then(response => response.json())
        .then(data => {
          if (data.conversationId) {
            setConversationId(data.conversationId);
          }
          if (data.suggestedFollowups) {
            setSuggestedFollowups(data.suggestedFollowups);
          }
          setChatMessages([{
            role: 'assistant',
            content: data.message || `I've analyzed ${asset.symbol}. How can I help you with this stock?`,
            timestamp: new Date().toISOString()
          }]);
        })
        .catch(error => {
          console.error('Error loading initial chat message:', error);
          setChatMessages([{
            role: 'assistant',
            content: `I'm ready to help you analyze ${asset.symbol}. What would you like to know?`,
            timestamp: new Date().toISOString()
          }]);
        })
        .finally(() => {
          setLoadingInitialMessage(false);
        });
    }
  }, [asset, chatMessages.length, loadingInitialMessage]);

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
  const handleChatSend = async () => {
    if (!chatInput.trim() || !asset) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput, timestamp: new Date().toISOString() };
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
            symbol: asset.symbol,
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

        setChatMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: data.message || 'Sorry, I could not generate a response.', 
          timestamp: new Date().toISOString() 
        }]);
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

    setChatMessages((prev) => [...prev, { 
      role: 'assistant', 
      content: errorContent, 
      timestamp: new Date().toISOString() 
    }]);
    setIsTyping(false);
  };

  const handleSuggestedPrompt = async (prompt: string) => {
    if (!asset) return;

    const userMessage: ChatMessage = { role: 'user', content: prompt, timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMessage]);
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
            message: prompt,
            symbol: asset.symbol,
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
        
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }

        if (data.suggestedFollowups) {
          setSuggestedFollowups(data.suggestedFollowups);
        }

        setChatMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: data.message || 'Sorry, I could not generate a response.', 
          timestamp: new Date().toISOString() 
        }]);
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

    setChatMessages((prev) => [...prev, { 
      role: 'assistant', 
      content: errorContent, 
      timestamp: new Date().toISOString() 
    }]);
    setIsTyping(false);
  };

  const handleSearchSelect = (selectedSymbol: string) => {
    router.push(`/asset/${selectedSymbol}`);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#0b0f16] text-white' : 'bg-[#f6f6f8] text-slate-900'}`}>
      {/* Header */}
      <header className={`flex items-center justify-between border-b px-4 md:px-6 py-3 ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="size-7 md:size-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white">
              <span className="text-base md:text-[20px]">🤖</span>
            </div>
            <h2 className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>SeunBot Pro</h2>
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
                        {result.imageUrl ? (
                          <img 
                            src={result.imageUrl} 
                            alt={result.symbol}
                            className="size-10 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`size-10 rounded-lg flex items-center justify-center text-sm font-bold ${isDark ? 'bg-white/10' : 'bg-slate-100'} ${result.imageUrl ? 'hidden' : ''}`}>
                          {result.name.slice(0, 2)}
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.name}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{result.symbol}</div>
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
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}>Dashboard</Link>
            <Link href="/chat" className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}>AI Chat</Link>
          </nav>
          <div className={`h-6 w-px hidden lg:block ${isDark ? 'bg-white/10' : 'bg-gray-300'}`}></div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`h-9 w-9 rounded-lg transition-colors ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-6 lg:px-8 max-w-[1600px] mx-auto w-full gap-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all w-fit ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-gray-600 hover:text-slate-900'}`}
        >
          <span className="text-lg">←</span>
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Asset Header */}
        <section className={`flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-6 p-6 md:p-6 lg:p-8 rounded-xl shadow-sm ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3 md:gap-4">
            {asset.imageUrl ? (
              <img 
                src={asset.imageUrl} 
                alt={asset.symbol}
                className="size-10 md:size-12 rounded-full object-cover border border-orange-500/20"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`size-10 md:size-12 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 ${asset.imageUrl ? 'hidden' : ''}`}>
              <span className="text-xl md:text-2xl">{asset.name?.slice(0, 1) || '₿'}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg md:text-xl lg:text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.name}</h1>
                <span className={`text-xs md:text-sm font-medium px-2 py-0.5 rounded ${isDark ? 'text-gray-400 bg-white/5' : 'text-gray-600 bg-slate-100'}`}>{asset.symbol}</span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Asset Intelligence Report</p>
            </div>
          </div>
          <div className={`w-full md:w-auto grid grid-cols-3 md:flex md:flex-wrap md:items-center gap-2 md:gap-0 md:divide-x ${isDark ? 'md:divide-[#2b2839]' : 'md:divide-gray-300'}`}>
            <div className="md:px-2 lg:px-4 md:first:pl-0">
              <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Price</p>
              <p className={`text-base md:text-lg lg:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {predictionData?.currentPrice ? `${asset.market === 'NGX' ? '₦' : '$'}${predictionData.currentPrice.toLocaleString()}` : '-'}
              </p>
            </div>
            <div className="text-center md:text-left md:px-2 lg:px-4">
              <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>24h Change</p>
              <div className="flex items-center justify-center md:justify-start gap-1 text-[#0bda6c]">
                <span>↗</span>
                <span className="text-sm md:text-base lg:text-lg font-bold">+2.45%</span>
              </div>
            </div>
            <div className="text-right md:text-left md:px-2 lg:px-4">
              <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>24h Volume</p>
              <p className={`text-sm md:text-base lg:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>$34.2B</p>
            </div>
            <div className="md:px-2 lg:px-4 hidden sm:block">
              <p className={`text-xs md:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Market Cap</p>
              <p className={`text-sm md:text-base lg:text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>$1.2T</p>
            </div>
          </div>
        </section>

        {/* Chart Section + Signal Intelligence - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart Section - 65-70% (8 columns) */}
          <div className="lg:col-span-8">
            <div className={`rounded-xl flex flex-col h-[500px] shadow-sm overflow-hidden ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
              <div className={`flex items-center justify-between border-b p-4 ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
                <div className={`flex items-center gap-2 p-1 rounded-lg ${isDark ? 'bg-[#0f1520] border border-white/10' : 'bg-gray-200'}`}>
                  {(['Monthly', 'Weekly', 'Daily', 'H4'] as Timeframe[]).map((tf) => (
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
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#0bda6c]"></span>
                    <span className={`hidden md:inline text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Market Open</span>
                  </div>
                  <button 
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`hidden md:flex p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-gray-500' : 'hover:bg-slate-100 text-gray-600'}`}
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
          </div>

          {/* Signal Intelligence - 30-35% (4 columns) */}
          <div className="lg:col-span-4">
            <div className={`rounded-xl border border-teal-500/30 shadow-[0_0_30px_-10px_rgba(20,184,166,0.15)] overflow-hidden relative ${isDark ? 'bg-[#0b111b]' : 'bg-white'}`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent opacity-50"></div>
              
              {/* Loading State */}
              {loadingPrediction && (
                <div className="p-8 flex flex-col items-center justify-center h-[500px]">
                  <div className="h-12 w-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mb-4"></div>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading AI prediction...</span>
                </div>
              )}

              {/* Prediction Data Available */}
              {!loadingPrediction && predictionData && predictionData.isSuccess && (
                <div className="h-[500px] flex flex-col">
                  {/* Header with Recommendation */}
                  <div className={`p-5 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span>🧠</span>
                          Signal Intelligence
                        </h3>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          {new Date(predictionData.analyzedAt).toLocaleString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit',
                            hour12: false 
                          })}
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-lg font-bold flex items-center gap-1.5 shadow-lg ${
                        predictionData.recommendation === 'BUY' 
                          ? 'bg-[#0bda6c]/20 border-2 border-[#0bda6c]/40 text-[#0bda6c] animate-pulse' 
                          : predictionData.recommendation === 'SELL' 
                          ? 'bg-red-500/20 border-2 border-red-500/40 text-red-500 animate-pulse' 
                          : 'bg-yellow-500/20 border-2 border-yellow-500/40 text-yellow-500'
                      }`}>
                        {predictionData.recommendation === 'BUY' && <span className="text-xl">↑</span>}
                        {predictionData.recommendation === 'SELL' && <span className="text-xl">↓</span>}
                        {predictionData.recommendation}
                      </div>
                    </div>

                    {/* AI Confidence */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>AI Confidence</span>
                        <span className={isDark ? 'text-white' : 'text-slate-900'}>{(predictionData.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                          style={{ width: `${predictionData.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Component Scores */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                        <p className={`text-[9px] uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Final</p>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {predictionData.finalScore.toFixed(2)}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                        <p className={`text-[9px] uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Tech</p>
                        <p className={`text-sm font-bold ${
                          predictionData.technicalScore > 0 ? 'text-teal-400' : 
                          predictionData.technicalScore < 0 ? 'text-red-400' : 
                          'text-gray-400'
                        }`}>
                          {predictionData.technicalScore >= 0 ? '+' : ''}{predictionData.technicalScore.toFixed(2)}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                        <p className={`text-[9px] uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Fund</p>
                        <p className={`text-sm font-bold ${
                          predictionData.fundamentalScore > 0 ? 'text-teal-400' : 
                          predictionData.fundamentalScore < 0 ? 'text-red-400' : 
                          'text-gray-400'
                        }`}>
                          {predictionData.fundamentalScore >= 0 ? '+' : ''}{predictionData.fundamentalScore.toFixed(2)}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                        <p className={`text-[9px] uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Sent</p>
                        <p className={`text-sm font-bold ${
                          predictionData.sentimentScore > 0 ? 'text-teal-400' : 
                          predictionData.sentimentScore < 0 ? 'text-red-400' : 
                          'text-gray-400'
                        }`}>
                          {predictionData.sentimentScore >= 0 ? '+' : ''}{predictionData.sentimentScore.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Price Levels */}
                  <div className="flex-1">
                    <div className={`p-5 ${isDark ? 'bg-[#0a0f16]/40' : 'bg-slate-50'} h-full overflow-visible`}>
                      <p className={`text-xs uppercase font-bold tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>💲 Price Levels</p>
                      
                      {/* 2x2 Grid for Price Levels */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f1520] border-white/5' : 'bg-white border-gray-200'}`}>
                          <p className={`text-[10px] uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Current Price</p>
                          <p className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <span className="text-base align-middle">₦</span>{predictionData.currentPrice.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f1520] border-white/5' : 'bg-white border-gray-200'}`}>
                          <p className={`text-[10px] uppercase mb-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Entry Price</p>
                          <p className={`text-xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <span className="text-base align-middle">₦</span>{predictionData.suggestedEntry.toFixed(2)}
                          </p>
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f1520] border-red-500/10' : 'bg-white border-red-200'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="size-2 rounded-full bg-[#ff4d4d]"></span>
                            <p className={`text-[10px] uppercase ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Stop Loss</p>
                          </div>
                          <p className="text-xl font-bold text-[#ff4d4d] font-mono"><span className="text-base align-middle">₦</span>{predictionData.stopLoss.toFixed(2)}</p>
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#0f1520] border-teal-500/10' : 'bg-white border-teal-200'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="size-2 rounded-full bg-[#0bda6c]"></span>
                            <p className={`text-[10px] uppercase ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Take Profit</p>
                          </div>
                          <p className="text-xl font-bold text-[#0bda6c] font-mono"><span className="text-base align-middle">₦</span>{predictionData.takeProfit.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Risk/Reward Ratio - Below the grid */}
                      <div className={`p-3 rounded-lg border ${isDark ? 'bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border-teal-500/20' : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Risk/Reward Ratio</span>
                          <span className={`text-xl font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                            1:{predictionData.riskRewardRatio.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No Prediction Data */}
              {!loadingPrediction && (!predictionData || !predictionData.isSuccess) && (
                <div className="p-8 flex flex-col items-center justify-center h-[500px]">
                  <div className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    <p className="text-4xl mb-3">🔮</p>
                    <p className="text-sm font-medium">No AI prediction available</p>
                    <p className="text-xs mt-2">Prediction data is loading...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Tabs+Content on Left, History on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tabs + Content (2 columns width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs for Analysis/Chat */}
            <div className={`sticky top-0 z-10 rounded-xl border ${isDark ? 'bg-[#0b111b] border-white/5' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-1.5 md:gap-4 p-2 md:p-4">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`flex-1 md:flex-none px-2 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium md:font-semibold transition-all ${
                    activeTab === 'analysis'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                      : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="hidden md:inline">📊 </span>Analysis
                </button>
                <button
                  onClick={() => setActiveTab('sentiment')}
                  className={`flex-1 md:flex-none px-2 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium md:font-semibold transition-all ${
                    activeTab === 'sentiment'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                      : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="hidden md:inline">🎭 </span>Market Sentiment
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 md:flex-none px-2 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium md:font-semibold transition-all ${
                    activeTab === 'chat'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/30'
                      : isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="hidden md:inline">💬 </span>AI Chat
                </button>
              </div>
            </div>

        {/* Comprehensive Analysis - Full Width */}
        {activeTab === 'analysis' && (
          <div className={`rounded-xl overflow-hidden shadow-sm relative ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
          <div className={`p-4 md:p-6 border-b ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Comprehensive Analysis</h3>
                  <p className={`text-xs uppercase tracking-wider font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Multi-Timeframe Market Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-slate-900'}`}
                title="Analysis Settings"
              >
                <span className="md:hidden text-xl">⚙️</span>
                <span className="hidden md:inline">{showSettings ? 'Hide Settings' : 'Show Settings'}</span>
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
          
          <div className={`pt-6 ${isDark ? 'bg-[#0a0f16]/50' : 'bg-slate-50/50'}`}>
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
                <div className={`border p-6 ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
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
                    <div className="col-span-2 md:col-span-1 p-4 rounded-lg space-y-3">
                      <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Signal Strength</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {analysisData.analysis.signalStrength?.toFixed(2)} / 5.0
                      </p>
                      <div className={`h-2 w-full rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
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
                      <div key={item.label} className="p-4 rounded-lg space-y-3">
                        <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{item.label}</p>
                        <p className={`text-2xl font-bold ${item.color}`}>{item.value?.toFixed(2) || '0.00'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi-Timeframe Table */}
                <div className={`rounded-lg border overflow-hidden ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className={`p-5 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
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

                {/* Comprehensive Report - Free Flowing */}
                <div className="mt-8 px-6">
                  <div className={`mb-6 pb-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <h4 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Comprehensive Report</h4>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>AI-Generated Market Intelligence</p>
                  </div>
                  {analysisData.report ? (
                    <div className="space-y-4">
                      {renderReport(analysisData.report)}
                    </div>
                  ) : (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
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
        )}

        {/* Market Sentiment Tab */}
        {activeTab === 'sentiment' && (
          <div className="space-y-6">
            {/* Loading State */}
            {(loadingPrediction || loadingSentiment) && (
              <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
                <div className="inline-block h-12 w-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mb-4"></div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading sentiment analysis...</p>
              </div>
            )}

            {/* Sentiment Overview - From Prediction API */}
            {!loadingPrediction && predictionData && predictionData.isSuccess && predictionData.breakdown && (
              <div className={`rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
                <div className={`p-5 border-b ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Market Sentiment Overview
                      </h3>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        {predictionData.breakdown.tweetsAnalyzed || 0} sources analyzed
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                      predictionData.sentimentScore > 0.3 ? 'bg-[#0bda6c]/20 text-[#0bda6c] border border-[#0bda6c]/30' :
                      predictionData.sentimentScore < -0.3 ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                      'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                    }`}>
                      {predictionData.sentimentScore > 0.3 ? 'BULLISH' : predictionData.sentimentScore < -0.3 ? 'BEARISH' : 'NEUTRAL'}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Sentiment Score Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Sentiment Score</span>
                      <span className={`text-lg font-bold ${
                        predictionData.sentimentScore > 0 ? 'text-teal-500' : 
                        predictionData.sentimentScore < 0 ? 'text-red-500' : 
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {predictionData.sentimentScore >= 0 ? '+' : ''}{(predictionData.sentimentScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative">
                      <div className={`h-3 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded-full transition-all ${
                            predictionData.sentimentScore >= 0 
                              ? 'bg-gradient-to-r from-teal-500 to-cyan-500' 
                              : 'bg-gradient-to-r from-red-500 to-orange-500'
                          }`}
                          style={{ width: `${Math.abs(predictionData.sentimentScore) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-red-400">Bearish</span>
                        <span className={isDark ? 'text-gray-500' : 'text-gray-600'}>Neutral</span>
                        <span className="text-teal-400">Bullish</span>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Summary */}
                  {predictionData.breakdown.sentimentSummary && (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                      <p className={`text-xs uppercase font-bold tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        📝 Summary
                      </p>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                        {predictionData.breakdown.sentimentSummary}
                      </p>
                    </div>
                  )}

                  {/* Sentiment Themes */}
                  {predictionData.breakdown.sentimentThemes && predictionData.breakdown.sentimentThemes.length > 0 && (
                    <div>
                      <p className={`text-xs uppercase font-bold tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        💡 Key Themes
                      </p>
                      <div className="space-y-2">
                        {predictionData.breakdown.sentimentThemes.map((theme, idx) => (
                          <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                            <span className="text-teal-500 text-sm mt-0.5 shrink-0">→</span>
                            <span className={`text-sm flex-1 leading-relaxed ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{theme}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent News - From Sentiment API */}
            {!loadingSentiment && sentimentData && sentimentData.recentNews && sentimentData.recentNews.length > 0 && (
              <div className={`rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
                <div className={`p-5 border-b ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>📰</span>
                    Recent News & Analysis
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    {sentimentData.recentNews.length} recent article{sentimentData.recentNews.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="divide-y divide-white/5">
                  {sentimentData.recentNews.map((news, idx) => (
                    <div key={idx} className={`p-5 ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-colors`}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className={`text-sm font-bold flex-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {news.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold shrink-0 ${
                          news.sentimentLabel === 'positive' || news.sentimentLabel === 'BULLISH'
                            ? 'bg-teal-500/20 text-teal-400'
                            : news.sentimentLabel === 'negative' || news.sentimentLabel === 'BEARISH'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {news.sentimentLabel}
                        </span>
                      </div>
                      
                      {news.summary && (
                        <p className={`text-sm mb-3 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {news.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {news.source}
                          </span>
                          {news.publishedAt && (
                            <span className={isDark ? 'text-gray-600' : 'text-gray-500'}>
                              {new Date(news.publishedAt).toLocaleDateString()}
                            </span>
                          )}
                          {news.relevance && (
                            <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                              {(news.relevance * 100).toFixed(0)}% relevant
                            </span>
                          )}
                        </div>
                        {news.url && (
                          <a 
                            href={news.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-teal-500 hover:text-teal-400 font-medium"
                          >
                            Read more →
                          </a>
                        )}
                      </div>
                      
                      {news.topics && news.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {news.topics.slice(0, 5).map((topic, topicIdx) => (
                            <span 
                              key={topicIdx}
                              className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Factors & Risks - From Prediction API */}
            {!loadingPrediction && predictionData && predictionData.isSuccess && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key Factors */}
                {predictionData.keyFactors && predictionData.keyFactors.length > 0 && (
                  <div className={`rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
                    <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span>✨</span>
                        Key Factors
                      </h4>
                    </div>
                    <div className="p-4 space-y-2">
                      {predictionData.keyFactors.map((factor, idx) => (
                        <div key={idx} className={`flex items-start gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                          <span className="text-teal-500 text-sm shrink-0">•</span>
                          <span className="flex-1 leading-relaxed">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {predictionData.risks && predictionData.risks.length > 0 && (
                  <div className={`rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-[#0b111b] border border-red-500/20' : 'bg-white border border-red-200'}`}>
                    <div className={`p-4 border-b ${isDark ? 'border-red-500/20 bg-red-500/5' : 'border-red-200 bg-red-50'}`}>
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                        <span>⚠️</span>
                        Risks
                      </h4>
                    </div>
                    <div className={`p-4 space-y-2 ${isDark ? 'bg-red-500/5' : 'bg-red-50/50'}`}>
                      {predictionData.risks.map((risk, idx) => (
                        <div key={idx} className={`flex items-start gap-3 text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                          <span className="text-sm shrink-0">•</span>
                          <span className="flex-1 leading-relaxed">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Opportunities - From Sentiment API */}
            {!loadingSentiment && sentimentData && sentimentData.opportunities && sentimentData.opportunities.length > 0 && (
              <div className={`rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-[#0b111b] border border-teal-500/20' : 'bg-white border border-teal-200'}`}>
                <div className={`p-4 border-b ${isDark ? 'border-teal-500/20 bg-teal-500/5' : 'border-teal-200 bg-teal-50'}`}>
                  <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
                    <span>🎯</span>
                    Opportunities
                  </h4>
                </div>
                <div className={`p-4 space-y-2 ${isDark ? 'bg-teal-500/5' : 'bg-teal-50/50'}`}>
                  {sentimentData.opportunities.map((opportunity, idx) => (
                    <div key={idx} className={`flex items-start gap-3 text-sm ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>
                      <span className="text-sm shrink-0">•</span>
                      <span className="flex-1 leading-relaxed">{opportunity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Sentiment Drivers - From Sentiment API */}
            {!loadingSentiment && sentimentData && sentimentData.keyDrivers && sentimentData.keyDrivers.length > 0 && (
              <div className={`rounded-xl overflow-hidden shadow-sm ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
                <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
                  <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <span>🚀</span>
                    Market Drivers
                  </h4>
                </div>
                <div className="p-4 space-y-2">
                  {sentimentData.keyDrivers.map((driver, idx) => (
                    <div key={idx} className={`flex items-start gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                      <span className="text-cyan-500 text-sm shrink-0">→</span>
                      <span className="flex-1 leading-relaxed">{driver}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Data State */}
            {!loadingPrediction && !loadingSentiment && (!predictionData || !predictionData.isSuccess) && (!sentimentData || sentimentData.errorMessage) && (
              <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
                <p className="text-4xl mb-3">📊</p>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No sentiment data available</p>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Sentiment analysis is loading...</p>
              </div>
            )}
          </div>
        )}

        {/* AI Chat */}
        {activeTab === 'chat' && (
          <div>
            <div className={`rounded-xl overflow-hidden flex flex-col shadow-sm h-[500px] ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-[#0b111b]' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg p-1.5 shadow-lg shadow-teal-500/20">
                    <span className="text-white text-sm">🤖</span>
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>AI Assistant</h3>
                    <p className={`text-[10px] uppercase tracking-wider font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Powered by SeunBot Neural Engine</p>
                  </div>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
                    <div className={`flex-1 flex flex-col min-h-[300px] border-b md:border-b-0 md:border-r relative ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isDark ? 'bg-[#0a0f16]/50' : 'bg-slate-50/50'}`}>
                        {loadingInitialMessage && (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-2"></div>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading AI assistant...</p>
                            </div>
                          </div>
                        )}
                        {!loadingInitialMessage && chatMessages.map((message, idx) => (
                          <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`w-full md:max-w-[85%] rounded-2xl p-4 ${
                              message.role === 'user'
                                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20'
                                : isDark ? 'bg-[#0f1520] border border-white/10 text-gray-200' : 'bg-white border border-gray-200 text-slate-700'
                            }`}>
                              {message.role === 'assistant' && (
                                <div className={`text-xs mb-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>🤖 AI Assistant</div>
                              )}
                              <div className={`prose ${
                                message.role === 'user' 
                                  ? 'prose-invert max-w-none' 
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
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className={`w-full md:max-w-[85%] rounded-2xl p-4 border ${isDark ? 'bg-[#0f1520] border-white/10' : 'bg-white border border-gray-200'}`}>
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
                    <div className={`w-full md:w-64 p-4 ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Suggested Prompts</p>
                      <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
                        {suggestedFollowups.length > 0 ? (
                          suggestedFollowups.map((prompt, idx) => (
                            <button key={idx} onClick={() => handleSuggestedPrompt(prompt)} className={`text-left p-3 rounded-lg border hover:border-teal-500/50 hover:shadow-sm transition-all group ${isDark ? 'border-white/10 bg-[#0f1520]' : 'border-gray-200 bg-white'}`}>
                              <p className={`text-xs font-bold group-hover:text-teal-400 transition-colors ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>{prompt}</p>
                            </button>
                          ))
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                  </div>
            </div>
          </div>
        )}
          </div>

          {/* Right Column: Prediction History (Always Visible) */}
          <div className="lg:col-span-1">
            <div className={`rounded-xl overflow-hidden shadow-sm sticky top-6 ${isDark ? 'bg-[#0b111b] border border-white/5' : 'bg-white border border-gray-200'}`}>
              <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-[#0f1520]' : 'border-gray-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>📈</span>
                      History
                    </h3>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>AI predictions</p>
                  </div>
                  <button
                    onClick={fetchHistory}
                    disabled={loadingHistory}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      loadingHistory 
                        ? 'opacity-50 cursor-not-allowed' 
                        : isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                    }`}
                  >
                    {loadingHistory ? '...' : '↻'}
                  </button>
                </div>
              </div>
              
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="h-6 w-6 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto mb-2"></div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading...</p>
                  </div>
                </div>
              ) : historyData.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full">
                    <thead className={`sticky top-0 ${isDark ? 'bg-[#0a0f16]' : 'bg-slate-50'}`}>
                      <tr>
                        <th className={`text-left p-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date</th>
                        <th className={`text-left p-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Signal</th>
                        <th className={`text-left p-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Conf%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? (isDark ? 'bg-[#0f1520]/50' : 'bg-white') : (isDark ? 'bg-[#0a0f16]/30' : 'bg-slate-50/50')}>
                          <td className={`p-2 text-xs ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                            {new Date(item.predictedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.recommendation === 'BUY' ? 'bg-[#0bda6c]/15 text-[#0bda6c]' :
                              item.recommendation === 'SELL' ? 'bg-red-500/15 text-red-500' :
                              'bg-yellow-500/15 text-yellow-500'
                            }`}>
                              {item.recommendation}
                            </span>
                          </td>
                          <td className={`p-2 text-xs ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                            {(item.confidence * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  <p className="text-sm">No history</p>
                </div>
              )}
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
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>© 2026 SeunBot Pro. Financial data provided for informational purposes only.</p>
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
