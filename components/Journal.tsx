import React, { useState } from 'react';
import { Trade } from '../types';
import { StorageService } from '../services/storage';
import { Trash2, PlusCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { INSTRUMENTS } from '../constants';

interface JournalProps {
  trades: Trade[];
  onTradeUpdate: (trades: Trade[]) => void;
}

const Journal: React.FC<JournalProps> = ({ trades, onTradeUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrade, setNewTrade] = useState<Partial<Trade>>({
    pair: 'EURUSD',
    type: 'BUY',
    status: 'WIN',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSave = () => {
    if (!newTrade.pnl || !newTrade.date) return;
    
    const trade: Trade = {
      id: Date.now().toString(),
      date: newTrade.date!,
      pair: newTrade.pair || 'EURUSD',
      type: newTrade.type || 'BUY',
      entryPrice: Number(newTrade.entryPrice) || 0,
      exitPrice: Number(newTrade.exitPrice) || 0,
      lotSize: Number(newTrade.lotSize) || 0.01,
      pnl: Number(newTrade.pnl),
      status: newTrade.status || 'WIN',
      setup: newTrade.setup || '',
      notes: newTrade.notes || ''
    };

    const updated = StorageService.saveTrade(trade);
    onTradeUpdate(updated);
    setShowAddModal(false);
    setNewTrade({ pair: 'EURUSD', type: 'BUY', status: 'WIN', date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = (id: string) => {
    const updated = StorageService.deleteTrade(id);
    onTradeUpdate(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WIN': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'LOSS': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl h-full flex flex-col">
      <div className="p-6 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-2xl font-serif text-gold-500">Trade Journal</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gold-600 hover:bg-gold-500 text-slate-950 font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={18} />
          Log Trade
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {trades.length === 0 ? (
          <div className="text-center text-slate-500 mt-20">
            <p>No trades logged yet.</p>
            <p className="text-sm">Start building your history today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map(trade => (
              <div key={trade.id} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center hover:border-slate-600 transition-colors group">
                <div className="flex items-center gap-4 w-full md:w-auto mb-2 md:mb-0">
                  <div className={`p-2 rounded-full ${trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {trade.type === 'BUY' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-white">{trade.pair}</span>
                       <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(trade.status)}`}>{trade.status}</span>
                    </div>
                    <div className="text-xs text-slate-500">{trade.date} • {trade.lotSize} Lots</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                   <div className="text-right">
                      <div className={`font-mono font-bold text-lg ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">{trade.setup || 'No Setup'}</div>
                   </div>
                   <button 
                    onClick={() => handleDelete(trade.id)}
                    className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-serif text-white mb-6">Log New Trade</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 uppercase">Date</label>
                <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" 
                  value={newTrade.date} onChange={e => setNewTrade({...newTrade, date: e.target.value})} />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Pair</label>
                <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                   value={newTrade.pair} onChange={e => setNewTrade({...newTrade, pair: e.target.value})}>
                   {INSTRUMENTS.map(i => <option key={i.symbol} value={i.symbol}>{i.symbol}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                 <label className="text-xs text-slate-400 uppercase">Type</label>
                 <div className="flex bg-slate-950 rounded p-1 border border-slate-700">
                    <button onClick={() => setNewTrade({...newTrade, type: 'BUY'})} className={`flex-1 text-sm py-1 rounded ${newTrade.type === 'BUY' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Buy</button>
                    <button onClick={() => setNewTrade({...newTrade, type: 'SELL'})} className={`flex-1 text-sm py-1 rounded ${newTrade.type === 'SELL' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Sell</button>
                 </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase">Lots</label>
                <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" 
                  value={newTrade.lotSize} onChange={e => setNewTrade({...newTrade, lotSize: parseFloat(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 uppercase">Result (P/L $)</label>
                <input type="number" step="0.01" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold" 
                  placeholder="-50.00 or 100.00"
                  value={newTrade.pnl} onChange={e => setNewTrade({...newTrade, pnl: parseFloat(e.target.value)})} />
              </div>
              <div>
                 <label className="text-xs text-slate-400 uppercase">Status</label>
                 <select className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                   value={newTrade.status} onChange={e => setNewTrade({...newTrade, status: e.target.value as any})}>
                   <option value="WIN">Win</option>
                   <option value="LOSS">Loss</option>
                   <option value="BREAKEVEN">Breakeven</option>
                </select>
              </div>
            </div>
            
            <div className="mb-6">
                <label className="text-xs text-slate-400 uppercase">Setup / Strategy</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" 
                  placeholder="e.g. Trendline bounce, Gold Cross..."
                  value={newTrade.setup} onChange={e => setNewTrade({...newTrade, setup: e.target.value})} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-gold-600 hover:bg-gold-500 text-slate-900 font-bold rounded-lg transition-colors">Save Trade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
