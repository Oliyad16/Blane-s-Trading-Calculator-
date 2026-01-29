import React, { useState } from 'react';
import { Trade, AccountSettings, AnalysisResult } from '../types';
import { analyzeJournal } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrainCircuit, Activity, Award, AlertTriangle, Loader2 } from 'lucide-react';

interface DashboardProps {
  trades: Trade[];
  settings: AccountSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ trades, settings }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Calculate Stats
  const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  
  // Chart Data: Last 7 days PnL or last 10 trades
  const chartData = trades.slice(0, 10).reverse().map((t, idx) => ({
    name: t.date.substring(5), // MM-DD
    pnl: t.pnl,
    id: idx
  }));

  const handleRunAI = async () => {
    setLoadingAnalysis(true);
    try {
      const result = await analyzeJournal(trades, settings.balance);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm">Net Profit / Loss</p>
          <p className={`text-3xl font-serif mt-2 ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
             {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm">Win Rate</p>
          <p className="text-3xl font-serif text-gold-500 mt-2">{winRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-1">{wins}W - {losses}L</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm">Current Balance</p>
          <p className="text-3xl font-serif text-white mt-2">
            {(settings.balance + totalPnL).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 min-h-[300px]">
          <h3 className="text-xl font-serif text-white mb-6">Performance History</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} 
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis Section */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-xl border border-gold-500/30 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <BrainCircuit size={120} className="text-gold-500" />
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-serif text-gold-400 flex items-center gap-2">
                        <BrainCircuit size={24} />
                        AI Mentor
                    </h3>
                    <button 
                        onClick={handleRunAI}
                        disabled={loadingAnalysis}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                        {loadingAnalysis ? <Loader2 size={12} className="animate-spin" /> : 'Analyze'}
                    </button>
                </div>

                {analysis ? (
                    <div className="space-y-4 text-sm animate-fade-in flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        <p className="text-slate-300 italic">"{analysis.summary}"</p>
                        
                        <div>
                            <p className="text-emerald-400 font-bold flex items-center gap-2 mb-1"><Award size={14} /> Strengths</p>
                            <ul className="list-disc list-inside text-slate-400 text-xs pl-1">
                                {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>

                        <div>
                            <p className="text-rose-400 font-bold flex items-center gap-2 mb-1"><AlertTriangle size={14} /> Risks</p>
                            <ul className="list-disc list-inside text-slate-400 text-xs pl-1">
                                {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>

                        <div className="mt-4 bg-gold-500/10 p-3 rounded border border-gold-500/20">
                            <p className="text-gold-400 font-bold text-xs uppercase mb-1">Weekly Focus</p>
                            <p className="text-slate-200">{analysis.recommendation}</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                        <Activity size={40} className="text-slate-700 mb-4" />
                        <p className="text-slate-500 text-sm">Click 'Analyze' to let Gemini review your trading performance and provide actionable feedback.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
