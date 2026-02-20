'use client';

import { Asset } from '@/types';

export default function SignalDetails({ asset }: { asset: Asset }) {
  const signalColors = {
    BUY: 'text-teal-400',
    SELL: 'text-red-400',
    HOLD: 'text-yellow-400',
  };

  return (
    <div className="bg-[#0d1420] rounded-lg p-6 border border-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-white">Signal Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
            <span className="text-gray-400">Signal:</span>
            <span className={`text-xl font-bold ${signalColors[asset.signal]}`}>
              {asset.signal}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
            <span className="text-gray-400">Strength:</span>
            <span className="text-xl font-bold text-white">
              {asset.strength.toFixed(1)} / 5.0
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
            <span className="text-gray-400">Entry Price:</span>
            <span className="text-xl font-bold text-white">
              {asset.entry.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-900 rounded">
            <span className="text-gray-400">Position Size:</span>
            <span className="text-xl font-bold text-teal-400">
              {asset.positionSize}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-red-900/20 rounded border border-red-800">
            <span className="text-gray-400">Stop Loss:</span>
            <span className="text-xl font-bold text-red-400">
              {asset.stopLoss}%
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-teal-900/20 rounded border border-teal-800">
            <span className="text-gray-400">Take Profit 1:</span>
            <span className="text-xl font-bold text-teal-400">
              {asset.takeProfit1}%
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-teal-900/20 rounded border border-teal-800">
            <span className="text-gray-400">Take Profit 2:</span>
            <span className="text-xl font-bold text-teal-400">
              {asset.takeProfit2}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-800">
        <h3 className="text-lg font-semibold mb-3 text-white">Technical Analysis</h3>
        <div className="space-y-2 text-sm">
          {asset.elliottWave && (
            <div className="flex justify-between p-2 bg-gray-900 rounded">
              <span className="text-gray-400">Elliott Wave:</span>
              <span className="font-medium text-white">{asset.elliottWave}</span>
            </div>
          )}
          {asset.smcZone && (
            <div className="flex justify-between p-2 bg-gray-900 rounded">
              <span className="text-gray-400">SMC Zone:</span>
              <span className="font-medium text-white">{asset.smcZone}</span>
            </div>
          )}
          {asset.gann && (
            <div className="flex justify-between p-2 bg-gray-900 rounded">
              <span className="text-gray-400">Gann Analysis:</span>
              <span className="font-medium text-white">{asset.gann}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
