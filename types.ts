export interface Trade {
  id: string;
  date: string; // ISO date string
  pair: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  lotSize: number;
  pnl: number; // Profit/Loss in dollars
  status: 'WIN' | 'LOSS' | 'BREAKEVEN';
  notes?: string;
  setup?: string;
}

export interface AccountSettings {
  balance: number;
  currency: string;
}

export enum CalculatorMode {
  RiskToLots = 'RISK_TO_LOTS',
  LotsToRisk = 'LOTS_TO_RISK',
  ValuePerPip = 'VALUE_PER_PIP'
}

export interface Instrument {
  symbol: string;
  type: 'FOREX' | 'INDEX' | 'CRYPTO' | 'METAL';
  contractSize: number; // Units per lot (e.g., 100,000 for Std Forex)
  pipSize: number; // e.g., 0.0001 or 0.01
}

export interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}
