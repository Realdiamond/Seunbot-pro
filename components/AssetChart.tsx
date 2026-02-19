'use client';

import { useState } from 'react';
import { Timeframe } from '@/types';

export default function AssetChart({
  symbol,
}: {
  symbol: string;
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');

  const timeframes: Timeframe[] = ['H4', 'Daily', 'Weekly'];

  return (
    <div className="bg-[#0d1420] rounded-lg p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Price Chart</h2>
        <div className="flex gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                timeframe === tf
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder for chart - can be replaced with actual charting library */}
      <div className="w-full h-96 bg-gray-900 rounded flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-2">
            Chart for <span className="font-bold">{symbol}</span> ({timeframe})
          </p>
          <p className="text-sm text-gray-500">
            Chart integration ready (TradingView, Recharts, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
