import { Trade, AccountSettings } from "../types";

const TRADES_KEY = 'luxtrade_trades';
const SETTINGS_KEY = 'luxtrade_settings';

export const StorageService = {
  getTrades: (): Trade[] => {
    try {
      const stored = localStorage.getItem(TRADES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load trades", e);
      return [];
    }
  },

  saveTrade: (trade: Trade) => {
    const trades = StorageService.getTrades();
    const updated = [trade, ...trades];
    localStorage.setItem(TRADES_KEY, JSON.stringify(updated));
    return updated;
  },

  deleteTrade: (id: string) => {
    const trades = StorageService.getTrades();
    const updated = trades.filter(t => t.id !== id);
    localStorage.setItem(TRADES_KEY, JSON.stringify(updated));
    return updated;
  },

  getSettings: (): AccountSettings => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : { balance: 10000, currency: 'USD' };
  },

  saveSettings: (settings: AccountSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
