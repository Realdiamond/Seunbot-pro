'use client';

import { createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://seun-bot-4fb16422b74d.herokuapp.com';

interface StockChartProps {
  symbol?: string;
  resolution?: 'D' | 'W' | 'M';
  theme?: 'dark' | 'light';
  height?: number;
}

export default function StockChart({
  symbol = 'DANGCEM',
  resolution = 'D',
  theme = 'dark',
  height = 500,
}: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Chart Configuration (Colors and Layout)
    const isDark = theme === 'dark';
    const backgroundColor = isDark ? '#0d1420' : '#ffffff';
    const textColor = isDark ? '#d1d4dc' : '#191919';
    const gridColor = isDark ? '#1a2332' : '#e1e3ea';

    const chart = createChart(chartContainerRef.current, {
      height: height,
      width: chartContainerRef.current.clientWidth,
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: gridColor,
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
    });

    // 2. Add Candlestick and Volume Series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // 3. Fetch and Transform UDF Data
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch appropriate time range based on resolution
        const to = Math.floor(Date.now() / 1000);
        let from: number;
        
        // Adjust time range based on resolution
        switch (resolution) {
          case 'M':
            from = to - (5 * 365 * 24 * 60 * 60); // 5 years for monthly
            break;
          case 'W':
            from = to - (2 * 365 * 24 * 60 * 60); // 2 years for weekly
            break;
          default:
            from = to - (365 * 24 * 60 * 60); // 1 year for daily
        }
        
        const response = await fetch(
          `${API_BASE_URL}/udf/history?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();

        if (data.s === 'error' || data.s === 'no_data') {
          setError(data.errmsg || `No chart data available for ${symbol}`);
          setLoading(false);
          return;
        }

        if (!data.t || data.t.length === 0) {
          setError(`No chart data available for ${symbol}`);
          setLoading(false);
          return;
        }

        // Transform parallel arrays into objects
        const candlesticks = data.t.map((time: number, i: number) => ({
          time: time as any,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
        }));

        const volumes = data.t.map((time: number, i: number) => ({
          time: time as any,
          value: data.v[i],
          color: data.c[i] >= data.o[i] ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        }));

        candleSeries.setData(candlesticks);
        volumeSeries.setData(volumes);
        
        // Auto-fit the chart view to the data
        chart.timeScale().fitContent();
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch market data. Please try again later.');
        console.error('Chart data fetch error:', err);
        setLoading(false);
      }
    };

    fetchData();

    // 4. Handle Browser Window Resizing
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // 5. Cleanup on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, resolution, theme, height]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded">
          <div className="flex items-center gap-2 text-white">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading chart...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center p-6 bg-red-500/10 border border-red-500/50 rounded-lg">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full rounded" style={{ height: `${height}px` }} />
    </div>
  );
}
