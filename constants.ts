import { Instrument } from "./types";

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'EURUSD', type: 'FOREX', contractSize: 100000, pipSize: 0.0001 },
  { symbol: 'GBPUSD', type: 'FOREX', contractSize: 100000, pipSize: 0.0001 },
  { symbol: 'USDJPY', type: 'FOREX', contractSize: 100000, pipSize: 0.01 },
  { symbol: 'EURJPY', type: 'FOREX', contractSize: 100000, pipSize: 0.01 },
  { symbol: 'USDMXN', type: 'FOREX', contractSize: 100000, pipSize: 0.0001 },
  { symbol: 'US30', type: 'INDEX', contractSize: 1, pipSize: 1 }, 
  { symbol: 'NAS100', type: 'INDEX', contractSize: 1, pipSize: 1 },
  { symbol: 'SPX500', type: 'INDEX', contractSize: 1, pipSize: 1 },
  { symbol: '225JPY', type: 'INDEX', contractSize: 100, pipSize: 1 }, // Standard: 100 JPY per point per 1.0 Lot
  { symbol: 'XAUUSD', type: 'METAL', contractSize: 100, pipSize: 0.01 }, // Gold
  { symbol: 'BTCUSD', type: 'CRYPTO', contractSize: 1, pipSize: 1 },
];

export const MOCK_TRADES_INITIAL = [];