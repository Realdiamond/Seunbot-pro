'use client';

import Link from 'next/link';
import { Asset } from '@/types';

export default function AssetCard({ asset }: { asset: Asset }) {
  const signalColors = {
    BUY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    SELL: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  const signalKey = (asset.signal ?? 'HOLD') as keyof typeof signalColors;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link href={`/asset/${asset.symbol}`}>
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{asset.symbol}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{asset.name}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {asset.market}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm font-bold px-3 py-1 rounded ${signalColors[signalKey]}`}>
            {asset.signal ?? 'HOLD'}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Strength: <span className="font-semibold text-gray-900 dark:text-white">{(asset.strength ?? 0).toFixed(1)}</span>/5.0
          </span>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Entry:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{(asset.entry ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Stop Loss:</span>
            <span className="font-semibold text-red-600 dark:text-red-400">{asset.stopLoss ?? 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">TP1:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">{asset.takeProfit1 ?? 0}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">TP2:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">{asset.takeProfit2 ?? 0}%</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-500">
          Updated: {formatDate(asset.updatedAt ?? new Date().toISOString())}
        </div>
      </div>
    </Link>
  );
}
