// Type definitions for the trading signal platform

export type Market = 'NGX' | 'US Stocks' | 'Forex' | 'Crypto';

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface Asset {
  symbol: string;
  name: string;
  exchange?: string; // From API: NSENG, NYSE, etc.
  sector?: string; // From API
  market?: Market; // Derived from exchange
  signal?: SignalType;
  strength?: number; // 0.0 - 5.0
  entry?: number;
  stopLoss?: number; // percentage
  takeProfit1?: number; // percentage
  takeProfit2?: number; // percentage
  positionSize?: string; // e.g., "2%", "3%"
  elliottWave?: string;
  smcZone?: string; // Smart Money Concept zone
  gann?: string;
  updatedAt?: string; // ISO date string
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
}

export interface UserProfile {
  name: string;
  email: string;
  theme: 'light' | 'dark';
  notifications: boolean;
}

export type Timeframe = 'H4' | 'Daily' | 'Weekly' | 'Monthly';

export interface ChartData {
  symbol: string;
  timeframe: Timeframe;
  data: {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}
