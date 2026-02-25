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

// Prediction API Types
export interface PredictionResponse {
  symbol: string;
  companyName: string;
  sentimentScore: number;
  technicalScore: number;
  fundamentalScore: number;
  finalScore: number;
  recommendation: string;
  confidence: number;
  currentPrice: number;
  suggestedEntry: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  breakdown: {
    tweetsAnalyzed: number;
    sentimentSummary: string;
    sentimentThemes: string[];
    technicalDirection: string;
    technicalIndicators: Record<string, any>;
    peRatio: number;
    eps: number;
    dividendYield: number;
    fundamentalSummary: string;
  };
  keyFactors: string[];
  risks: string[];
  analyzedAt: string;
  errorMessage: string | null;
  isSuccess: boolean;
}

export interface PredictionHistoryItem {
  id: number;
  assetSymbol: string;
  companyName: string;
  sentimentScore: number;
  technicalScore: number;
  fundamentalScore: number;
  finalScore: number;
  recommendation: string;
  confidence: number;
  priceAtPrediction: number;
  suggestedEntry: number;
  stopLoss: number;
  takeProfit: number;
  tweetsAnalyzed: number;
  keyFactorsJson: string;
  risksJson: string;
  sentimentSource: string;
  isScheduledPoll: boolean;
  predictedAt: string;
  createdAt: string;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentimentScore: number;
  sentimentLabel: string;
  relevance: number;
  topics: string[];
}

export interface SentimentResponse {
  symbol: string;
  companyName: string;
  sentimentScore: number;
  sentimentLabel: string;
  confidence: number;
  recentNews: NewsItem[];
  keyDrivers: string[];
  risks: string[];
  opportunities: string[];
  summary: string;
  analyzedAt: string;
  sourcesAnalyzed: number;
  errorMessage: string | null;
}

export interface WatchlistAnalysisResponse {
  analyzedAt: string;
  durationSeconds: number;
  totalStocks: number;
  buySignals: PredictionResponse[];
  sellSignals: PredictionResponse[];
  holdSignals: PredictionResponse[];
  errors: Array<{
    symbol: string;
    errorMessage: string;
  }>;
}

export interface DataVerification {
  symbol: string;
  recordCount: number;
  firstRecordDate: string;
  lastRecordDate: string;
  dateRangeDays: number;
  daysSinceLastUpdate: number;
  hasSufficientData: boolean;
  dataQuality: string;
  message: string;
  recommendedAction: string;
  latestClose: number;
  latestHigh: number;
  latestLow: number;
  latestVolume: number;
}

export interface DataSummarySymbol {
  symbol: string;
  name: string;
  recordCount: number;
  firstDate: string;
  lastDate: string;
  isReadyForPrediction: boolean;
}

export interface DataSummaryResponse {
  totalSymbols: number;
  totalRecords: number;
  symbolsReadyForPrediction: number;
  symbols: DataSummarySymbol[];
  generatedAt: string;
}
