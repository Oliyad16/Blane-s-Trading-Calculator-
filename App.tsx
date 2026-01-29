import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calculator as CalcIcon, BookOpen, Settings } from 'lucide-react';
import Calculator from './components/Calculator';
import Journal from './components/Journal';
import Dashboard from './components/Dashboard';
import { StorageService } from './services/storage';
import { Trade, AccountSettings } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'journal'>('calculator');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettings] = useState<AccountSettings>({ balance: 10000, currency: 'USD' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Load data on mount
    const loadedTrades = StorageService.getTrades();
    const loadedSettings = StorageService.getSettings();
    setTrades(loadedTrades);
    setSettings(loadedSettings);
  }, []);

  const handleTradeUpdate = (updatedTrades: Trade[]) => {
    setTrades(updatedTrades);
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
        activeTab === id 
          ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-slate-900 font-bold shadow-lg shadow-gold-500/20' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      <Icon size={20} />
      <span className={`${!sidebarOpen && 'hidden md:hidden'} lg:inline`}>{label}</span>
    </button>
  );

  return (
    <div className="flex h-[100dvh] bg-slate-950 text-white overflow-hidden font-sans selection:bg-gold-500 selection:text-slate-900">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col hidden md:flex`}>
        <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-500 rounded-tr-xl rounded-bl-xl flex items-center justify-center">
                <span className="font-serif font-bold text-slate-900 text-lg">L</span>
            </div>
            {sidebarOpen && <h1 className="font-serif text-xl tracking-wider text-white">LUXTRADE</h1>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="calculator" icon={CalcIcon} label="Calculator" />
          <NavItem id="journal" icon={BookOpen} label="Journal" />
        </nav>

        <div className="p-4 border-t border-slate-800">
           {sidebarOpen ? (
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Account Balance</p>
                <p className="font-mono text-gold-400">{settings.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</p>
              </div>
           ) : (
               <div className="flex justify-center text-gold-400">
                   <Settings size={20} />
               </div>
           )}
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 flex justify-around p-3 pb-safe-area">
          <button onClick={() => setActiveTab('dashboard')} className={`p-2 ${activeTab === 'dashboard' ? 'text-gold-500' : 'text-slate-500'}`}><LayoutDashboard /></button>
          <button onClick={() => setActiveTab('calculator')} className={`p-2 ${activeTab === 'calculator' ? 'text-gold-500' : 'text-slate-500'}`}><CalcIcon /></button>
          <button onClick={() => setActiveTab('journal')} className={`p-2 ${activeTab === 'journal' ? 'text-gold-500' : 'text-slate-500'}`}><BookOpen /></button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 md:pb-8 relative overscroll-contain">
        <div className="max-w-7xl mx-auto min-h-full">
            {activeTab === 'calculator' && (
                <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-start md:justify-center pt-4 md:pt-0">
                     <div className="mb-6 md:mb-8 text-center md:text-left">
                        <h2 className="text-2xl md:text-4xl font-serif text-white mb-2">Position Sizing</h2>
                        <p className="text-slate-400 text-sm md:text-base">Precision risk management for the modern trader.</p>
                     </div>
                     <Calculator settings={settings} />
                </div>
            )}

            {activeTab === 'dashboard' && (
                <Dashboard trades={trades} settings={settings} />
            )}

            {activeTab === 'journal' && (
                <Journal trades={trades} onTradeUpdate={handleTradeUpdate} />
            )}
        </div>
      </main>
    </div>
  );
}

export default App;