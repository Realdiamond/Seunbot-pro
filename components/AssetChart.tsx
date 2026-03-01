'use client';

import { useState } from 'react';
import { Timeframe } from '@/types';
import StockChart from './StockChart';

export default function AssetChart({
  symbol,
  theme = 'dark',
}: {
  symbol: string;
  theme?: 'dark' | 'light';
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timeframes: Timeframe[] = ['Daily', 'Weekly', 'Monthly'];

  // Map Timeframe to chart resolution (D/W/M)
  const resolutionMap: Record<Timeframe, 'D' | 'W' | 'M'> = {
    Daily: 'D',
    Weekly: 'W',
    Monthly: 'M',
  };

  const isDark = theme === 'dark';

  return (
    <>
      <div className={`rounded-lg overflow-hidden border ${
        isDark 
          ? 'bg-[#0d1420] border-gray-800' 
          : 'bg-white border-gray-200'
      }`}>
        <div className={`flex justify-between items-center px-6 py-4 border-b ${
          isDark 
            ? 'border-gray-800' 
            : 'border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>Price Chart</h2>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeframe === tf
                      ? 'bg-teal-600 text-white'
                      : isDark 
                        ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsFullscreen(true)}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-white/5 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
              title="Fullscreen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stock Chart with Lightweight Charts */}
        <div className="p-4">
          <StockChart 
            symbol={symbol} 
            resolution={resolutionMap[timeframe]}
            theme={theme}
            height={500}
          />
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className={`fixed inset-0 z-50 flex flex-col ${
          isDark ? 'bg-[#0a0f16]' : 'bg-white'
        }`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark 
              ? 'border-gray-800 bg-[#0d1420]' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-4">
              <h2 className={`text-2xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{symbol} - Price Chart</h2>
              <div className="flex gap-2">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      timeframe === tf
                        ? 'bg-teal-600 text-white'
                        : isDark 
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className={`p-2 rounded-lg transition-colors ${
                isDark 
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white' 
                  : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
              title="Exit Fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 p-6 overflow-hidden">
            <StockChart 
              symbol={symbol} 
              resolution={resolutionMap[timeframe]}
              theme={theme}
              height={window.innerHeight - 100}
            />
          </div>
        </div>
      )}
    </>
  );
}
