import { Asset, Market } from '@/types';

// Mock data for development
export const mockAssets: Asset[] = [
  // NGX (Nigerian Stocks)
  {
    symbol: 'DANGCEM',
    name: 'Dangote Cement',
    market: 'NGX',
    signal: 'BUY',
    strength: 4.2,
    entry: 305.50,
    stopLoss: 5,
    takeProfit1: 12,
    takeProfit2: 25,
    positionSize: '2%',
    elliottWave: 'Wave 3',
    smcZone: 'Order Block',
    gann: '90-degree confirmation',
    updatedAt: '2026-02-07T10:30:00Z',
  },
  {
    symbol: 'ZENITHBANK',
    name: 'Zenith Bank',
    market: 'NGX',
    signal: 'BUY',
    strength: 3.8,
    entry: 42.50,
    stopLoss: 4,
    takeProfit1: 10,
    takeProfit2: 20,
    positionSize: '2%',
    elliottWave: 'Wave 5',
    smcZone: 'Fair Value Gap',
    gann: 'Confirmed',
    updatedAt: '2026-02-07T09:15:00Z',
  },
  {
    symbol: 'GTCO',
    name: 'Guaranty Trust Holding Company',
    market: 'NGX',
    signal: 'SELL',
    strength: 2.5,
    entry: 53.20,
    stopLoss: 6,
    takeProfit1: 8,
    takeProfit2: 15,
    positionSize: '2%',
    elliottWave: 'Wave C',
    smcZone: 'Bearish Order Block',
    gann: 'Resistance at 45-degree',
    updatedAt: '2026-02-07T11:00:00Z',
  },

  // US Stocks
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    market: 'US Stocks',
    signal: 'BUY',
    strength: 4.7,
    entry: 185.20,
    stopLoss: 4,
    takeProfit1: 15,
    takeProfit2: 30,
    positionSize: '3%',
    elliottWave: 'Wave 3',
    smcZone: 'Bullish Order Block',
    gann: '90-degree confirmation',
    updatedAt: '2026-02-07T14:30:00Z',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    market: 'US Stocks',
    signal: 'BUY',
    strength: 3.9,
    entry: 245.80,
    stopLoss: 6,
    takeProfit1: 12,
    takeProfit2: 25,
    positionSize: '2%',
    elliottWave: 'Wave 1',
    smcZone: 'Demand Zone',
    gann: 'Support at 45-degree',
    updatedAt: '2026-02-07T13:45:00Z',
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    market: 'US Stocks',
    signal: 'HOLD',
    strength: 3.0,
    entry: 512.30,
    stopLoss: 3,
    takeProfit1: 8,
    takeProfit2: 15,
    positionSize: '2%',
    elliottWave: 'Wave 4',
    smcZone: 'Equilibrium',
    gann: 'Neutral',
    updatedAt: '2026-02-07T15:00:00Z',
  },

  // Forex
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    market: 'Forex',
    signal: 'SELL',
    strength: 4.1,
    entry: 1.0920,
    stopLoss: 5,
    takeProfit1: 10,
    takeProfit2: 20,
    positionSize: '3%',
    elliottWave: 'Wave C',
    smcZone: 'Supply Zone',
    gann: 'Resistance confirmed',
    updatedAt: '2026-02-07T12:20:00Z',
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    market: 'Forex',
    signal: 'BUY',
    strength: 3.6,
    entry: 1.2650,
    stopLoss: 4,
    takeProfit1: 12,
    takeProfit2: 22,
    positionSize: '2%',
    elliottWave: 'Wave 3',
    smcZone: 'Order Block',
    gann: '90-degree support',
    updatedAt: '2026-02-07T11:30:00Z',
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    market: 'Forex',
    signal: 'BUY',
    strength: 4.3,
    entry: 148.25,
    stopLoss: 5,
    takeProfit1: 15,
    takeProfit2: 28,
    positionSize: '3%',
    elliottWave: 'Wave 5',
    smcZone: 'Bullish Fair Value Gap',
    gann: 'Confirmed uptrend',
    updatedAt: '2026-02-07T10:00:00Z',
  },

  // Crypto
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    market: 'Crypto',
    signal: 'BUY',
    strength: 4.5,
    entry: 43000,
    stopLoss: 5,
    takeProfit1: 15,
    takeProfit2: 30,
    positionSize: '3%',
    elliottWave: 'Wave 3',
    smcZone: 'Order Block',
    gann: '90-degree confirmation',
    updatedAt: '2026-02-07T12:00:00Z',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    market: 'Crypto',
    signal: 'BUY',
    strength: 4.0,
    entry: 2850,
    stopLoss: 6,
    takeProfit1: 12,
    takeProfit2: 25,
    positionSize: '2%',
    elliottWave: 'Wave 5',
    smcZone: 'Demand Zone',
    gann: 'Support confirmed',
    updatedAt: '2026-02-07T11:45:00Z',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    market: 'Crypto',
    signal: 'SELL',
    strength: 2.8,
    entry: 105.50,
    stopLoss: 7,
    takeProfit1: 10,
    takeProfit2: 18,
    positionSize: '2%',
    elliottWave: 'Wave B',
    smcZone: 'Bearish Order Block',
    gann: 'Resistance at 45-degree',
    updatedAt: '2026-02-07T13:00:00Z',
  },
];

export const getAssetBySymbol = (symbol: string): Asset | undefined => {
  return mockAssets.find((asset) => asset.symbol === symbol);
};

export const getAssetsByMarket = (market: Market): Asset[] => {
  return mockAssets.filter((asset) => asset.market === market);
};

export const getAllMarkets = (): Market[] => {
  return ['NGX', 'US Stocks', 'Forex', 'Crypto'];
};

export const mockChatResponses: Record<string, string> = {
  'why is btc a buy': 'BTC is showing strong bullish momentum due to institutional order blocks at the current price level. Elliott Wave analysis indicates we are in Wave 3, which typically shows the strongest upward movement. Smart Money Concepts confirm accumulation zones, and Gann analysis provides 90-degree confirmation of the uptrend.',
  'which assets are strongest': 'Currently, the strongest signals are: 1) AAPL with a strength of 4.7 (US Stocks), 2) BTC with 4.5 (Crypto), and 3) USDJPY with 4.3 (Forex). All three show strong technical setups with favorable risk-reward ratios.',
  'market sentiment': 'Overall market sentiment is moderately bullish across most asset classes. US stocks and crypto are showing the strongest momentum, with 75% of tracked assets displaying buy signals. Forex markets are mixed, while NGX stocks show selective opportunities with rotation into banking and cement sectors.',
  'key buy zones': 'Based on Smart Money Concepts, the key buy zones are:\n\n1. **Primary Entry**: Current market level with strong order block support\n2. **Secondary Zone**: 3-5% below current price where institutional demand is visible\n3. **Deep Value Zone**: 8-12% pullback area aligning with major fair value gaps\n\nThe current entry zone shows confluence of multiple technical factors including Elliott Wave support and Gann angle confirmation.',
  'support levels': 'Key support levels identified:\n\n• **Immediate Support**: Located at the recent order block formation\n• **Major Support**: Historical demand zone 5-7% below current price\n• **Critical Support**: Institutional accumulation area at the 200-period moving average\n\nThese levels show high probability of price reaction based on volume profile and smart money positioning.',
  'elliott wave': 'The current Elliott Wave count shows we are in an impulsive Wave 3 structure, which is typically the strongest and most profitable wave. Wave 3 characteristics:\n\n✓ Strong momentum confirmation\n✓ High volume participation\n✓ Breaking through previous resistance\n✓ RSI showing bullish divergence\n\nExpected targets align with Fibonacci extensions at 1.618 and 2.618 levels.',
  'wave count': 'Current Elliott Wave structure analysis:\n\n**Wave 1**: Completed - Initial impulse move\n**Wave 2**: Completed - Healthy correction\n**Wave 3**: ACTIVE - Main trending wave (strongest momentum)\n**Wave 4**: Expected - Minor consolidation ahead\n**Wave 5**: Target - Final extension phase\n\nWave 3 is historically the most profitable phase with highest success probability.',
  'risk reward': 'The current risk/reward ratio is highly favorable:\n\n📊 **Risk**: 3.5% to stop loss\n📈 **Reward**: 15% to first target (TP1)\n🎯 **Extended Target**: 30% to second target (TP2)\n\n**R:R Ratios**:\n• TP1: 4.3:1 (Excellent)\n• TP2: 8.6:1 (Outstanding)\n\nThis setup exceeds the minimum 2:1 ratio required for high-probability trades. Position sizing recommendation is 2-3% of portfolio to manage downside exposure.',
  'risk/reward': 'Excellent risk/reward profile on this setup:\n\n**Entry to Stop Loss**: -3.5% risk\n**Entry to TP1**: +15% reward (4.3R)\n**Entry to TP2**: +30% reward (8.6R)\n\nWith institutional order flow supporting the entry zone and multiple technical confluences, the probability of reaching TP1 is estimated at 72%, making this a high-expectancy trade.',
  'resistance': 'Key resistance levels ahead:\n\n🔴 **R1** (Immediate): +8-10% - Previous swing high with minor supply\n🔴 **R2** (Major): +15-18% - Take Profit 1 zone with institutional distribution area\n🔴 **R3** (Extended): +28-32% - Take Profit 2 zone at psychological level\n\nSmart Money analysis shows reduced selling pressure at R1, increasing probability of breakthrough to higher targets.',
  'take profit': 'Recommended take profit strategy:\n\n**TP1 (50% position)**: First target at +15%\n- Located at previous resistance turned support\n- Confluence with Fibonacci 1.618 extension\n- Probability: 72%\n\n**TP2 (Remaining 50%)**: Extended target at +30%\n- Major psychological level\n- Gann angle resistance\n- Probability: 45%\n\n**Trailing Stop**: After TP1, move stop to breakeven and let TP2 run with trailing stop.',
  'stop loss': 'Stop loss placement strategy:\n\n🛡️ **Recommended Stop**: -3.5% below entry\n\n**Rationale**:\n• Below recent swing low structure\n• Outside order block invalidation zone\n• Beyond Gann support angle\n• Maintains healthy risk/reward ratio\n\n⚠️ **Risk Management**: This stop loss level ensures position size of 2-3% of portfolio keeps total account risk under 0.10% per trade. Never move stop loss further away from entry.',
  'entry': 'Optimal entry strategy:\n\n**Market Entry** (Recommended):\n- Current price level shows strong confluence\n- Order block support confirmed\n- RSI bullish divergence active\n- Entry confidence: HIGH\n\n**Limit Entry** (Conservative):\n- Set limit orders 1-2% below current price\n- Wait for pullback to fair value gap\n- May miss move if momentum continues\n\n**Scale-In Strategy**: Enter 50% now, add 50% on any pullback to support zone.',
  'how confident': 'AI Confidence Analysis:\n\n**Overall Signal Strength**: 4.2/5.0 (Strong)\n\nConfidence factors:\n✅ Elliott Wave structure clear and impulsive\n✅ Smart Money order blocks aligned\n✅ Gann angles confirming directional bias\n✅ RSI showing bullish divergence\n✅ Volume profile supports move\n\n⚠️ Risk factors:\n• Market-wide volatility events\n• Macro economic releases\n\nProbability of TP1: ~72% | Probability of TP2: ~45%',
  'analysis': 'Comprehensive Technical Analysis:\n\n📊 **Elliott Wave**: Wave 3 impulse active - strongest trending phase\n💰 **Smart Money**: Institutional order blocks showing accumulation\n📐 **Gann Analysis**: 90-degree angle confirming uptrend structure\n📈 **Oscillators**: RSI bullish divergence, MACD positive crossover\n\n**Confluence Score**: 8.5/10\n\nMultiple independent technical systems align, creating high-probability setup with favorable risk/reward profile.',
};

export const getMockChatResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  // Check for exact matches or partial matches
  for (const [key, response] of Object.entries(mockChatResponses)) {
    if (lowerQuestion.includes(key)) {
      return response;
    }
  }
  
  // Default response for unmatched questions
  return "I analyze market data using Elliott Wave theory, Smart Money Concepts, Gann analysis, and technical indicators to provide trading signals. I can help you understand:\n\n• Support and resistance levels\n• Elliott Wave counts\n• Risk/reward ratios\n• Entry and exit strategies\n• Market sentiment analysis\n\nWhat would you like to know about this asset?";
};
