
import React, { useState, useEffect, useMemo } from 'react';
import { INSTRUMENTS } from '../constants';
import { Instrument, AccountSettings } from '../types';
import { 
  DollarSign, 
  Percent, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Target, 
  CheckSquare,
  TrendingUp,
  Activity,
  Zap,
  ShieldCheck,
  Info
} from 'lucide-react';

interface CalculatorProps {
  settings: AccountSettings;
}

const Calculator: React.FC<CalculatorProps> = ({ settings }) => {
  const [instrument, setInstrument] = useState<Instrument>(INSTRUMENTS.find(i => i.symbol === '225JPY') || INSTRUMENTS[0]);
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('SELL');
  const [balance, setBalance] = useState<number>(settings.balance);
  
  // Custom Contract Size for Indices (Micro: 1, Mini: 100, Standard: 1000)
  const [contractSize, setContractSize] = useState<number>(100);
  
  // Independent Inputs
  const [riskAmount, setRiskAmount] = useState<string>('10');
  const [riskPercent, setRiskPercent] = useState<string>('0.1');
  const [lotSize, setLotSize] = useState<string>('0.06');
  const [calcMode, setCalcMode] = useState<'RISK' | 'LOTS'>('LOTS');
  
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [slDistance, setSlDistance] = useState<number>(20);
  const [slPrice, setSlPrice] = useState<number>(0);
  const [tpDistance, setTpDistance] = useState<number>(40);
  const [tpPrice, setTpPrice] = useState<number>(0);

  const isNikkei = instrument.symbol === '225JPY';
  const isSpx = instrument.symbol === 'SPX500';
  const isSpecialIndex = isNikkei || isSpx;
  const isIndex = instrument.type === 'INDEX';
  const unitLabel = isIndex ? 'Points' : 'Pips';

  // Precision logic for display
  const pricePrecision = useMemo(() => {
    if (isSpecialIndex) return 2;
    if (instrument.symbol.includes('JPY') || instrument.pipSize >= 0.01) return 2;
    if (instrument.symbol === 'XAUUSD') return 2;
    return 5;
  }, [instrument, isSpecialIndex]);

  // High-precision calculation for Risk and Reward dollars
  const results = useMemo(() => {
    const USDJPY = 158.00; // Reference JPY rate
    const numLots = parseFloat(lotSize) || 0.01;
    const numRiskAmt = parseFloat(riskAmount) || 10;
    
    let calcLots = numLots;
    let actualRisk = 0;
    let actualReward = 0;
    let valuePerUnit = 0;

    // 1. Calculate the linear dollar value per unit (pip/point) for most pairs
    const getLinearUnitValue = () => {
        if (isIndex) {
            // Special Indices (Nikkei, SPX) use the contractSize multiplier
            const multiplier = isSpecialIndex ? contractSize : instrument.contractSize;
            const val = multiplier * instrument.pipSize;
            return instrument.symbol.includes('JPY') ? val / USDJPY : val;
        }

        if (instrument.type === 'FOREX') {
            const pipValueInQuote = instrument.contractSize * instrument.pipSize;
            
            // Standard Forex Linear logic
            if (instrument.symbol.endsWith('USD')) return pipValueInQuote;
            if (instrument.symbol.endsWith('JPY')) return pipValueInQuote / USDJPY;
            if (instrument.symbol.startsWith('USD') && instrument.symbol !== 'USDMXN') {
                return entryPrice > 0 ? pipValueInQuote / entryPrice : 0.63; // fallback
            }
        }
        
        return instrument.contractSize * instrument.pipSize;
    };

    // 2. Special Logic for USDMXN (Non-linear PnL based on Exit Price)
    if (instrument.symbol === 'USDMXN') {
        const totalContract = numLots * instrument.contractSize;
        
        // Mode logic
        if (calcMode === 'RISK') {
            // Approximating lots for USDMXN based on Entry for the Risk Mode
            const approxUnitVal = (instrument.contractSize * instrument.pipSize) / entryPrice;
            const rawLots = (slDistance > 0 && approxUnitVal > 0) ? numRiskAmt / (slDistance * approxUnitVal) : 0.01;
            calcLots = Math.max(0.01, Math.floor(rawLots * 100) / 100);
        } else {
            calcLots = numLots;
        }

        const units = calcLots * instrument.contractSize;
        // PnL = Units * (PriceChange) / ClosingPrice
        if (direction === 'BUY') {
            actualRisk = slPrice > 0 ? Math.abs((entryPrice - slPrice) * units / slPrice) : 0;
            actualReward = tpPrice > 0 ? Math.abs((tpPrice - entryPrice) * units / tpPrice) : 0;
        } else {
            actualRisk = slPrice > 0 ? Math.abs((slPrice - entryPrice) * units / slPrice) : 0;
            actualReward = tpPrice > 0 ? Math.abs((entryPrice - tpPrice) * units / tpPrice) : 0;
        }
        valuePerUnit = calcLots * ((instrument.contractSize * instrument.pipSize) / entryPrice);
    } 
    // 3. Standard Logic for all other pairs
    else {
        const linearUnitVal = getLinearUnitValue();
        
        if (calcMode === 'RISK') {
            const rawLots = (slDistance > 0 && linearUnitVal > 0) ? numRiskAmt / (slDistance * linearUnitVal) : 0.01;
            calcLots = Math.max(0.01, Math.floor(rawLots * 100) / 100);
        } else {
            calcLots = numLots;
        }

        actualRisk = calcLots * slDistance * linearUnitVal;
        actualReward = calcLots * tpDistance * linearUnitVal;
        valuePerUnit = calcLots * linearUnitVal;
    }

    const rr = actualRisk > 0 ? (actualReward / actualRisk).toFixed(2) : '0';

    return {
      lots: calcLots,
      risk: actualRisk,
      reward: actualReward,
      rr: rr,
      valuePerUnit: valuePerUnit
    };
  }, [riskAmount, lotSize, calcMode, slDistance, tpDistance, slPrice, tpPrice, instrument, balance, contractSize, entryPrice, direction, isSpecialIndex]);

  useEffect(() => {
    const defaults: Record<string, number> = {
        'EURUSD': 1.0850, 'US30': 39500, 'NAS100': 18200, 'SPX500': 5230,
        '225JPY': 39000.0, 'XAUUSD': 2350, 'USDJPY': 158.00, 'EURJPY': 171.50, 'USDMXN': 17.07
    };
    const price = defaults[instrument.symbol] || 0;
    const defaultSl = isIndex ? 50 : 20;
    
    // Set initial contract size for special indices
    if (isSpecialIndex) {
        setContractSize(100); // Default to Mini
    } else if (isIndex) {
        setContractSize(instrument.contractSize);
    }

    setEntryPrice(price);
    setSlDistance(defaultSl);
    setTpDistance(defaultSl * 2);
    
    const slP = direction === 'BUY' ? price - (defaultSl * instrument.pipSize) : price + (defaultSl * instrument.pipSize);
    const tpP = direction === 'BUY' ? price + (defaultSl * 2 * instrument.pipSize) : price - (defaultSl * 2 * instrument.pipSize);
    setSlPrice(Number(slP.toFixed(pricePrecision)));
    setTpPrice(Number(tpP.toFixed(pricePrecision)));
  }, [instrument]);

  const handleRiskAmountChange = (val: string) => {
    setCalcMode('RISK');
    setRiskAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && balance > 0) {
      setRiskPercent(((num / balance) * 100).toFixed(2));
    }
  };

  const handleRiskPercentChange = (val: string) => {
    setCalcMode('RISK');
    setRiskPercent(val);
    const num = parseFloat(val);
    if (!isNaN(num) && balance > 0) {
      setRiskAmount(((num / 100) * balance).toFixed(2));
    }
  };

  const handleLotChange = (val: string) => {
    setCalcMode('LOTS');
    setLotSize(val);
  };

  const handleSlDistChange = (dist: number) => {
    setSlDistance(dist);
    const priceDist = dist * instrument.pipSize;
    setSlPrice(Number((direction === 'BUY' ? entryPrice - priceDist : entryPrice + priceDist).toFixed(pricePrecision)));
  };

  const handleSlPriceChange = (price: number) => {
    setSlPrice(price);
    const dist = Math.abs(entryPrice - price) / instrument.pipSize;
    setSlDistance(Number(dist.toFixed(1)));
  };

  const handleTpDistChange = (dist: number) => {
    setTpDistance(dist);
    const priceDist = dist * instrument.pipSize;
    setTpPrice(Number((direction === 'BUY' ? entryPrice + priceDist : entryPrice - priceDist).toFixed(pricePrecision)));
  };

  const handleTpPriceChange = (price: number) => {
    setTpPrice(price);
    const dist = Math.abs(entryPrice - price) / instrument.pipSize;
    setTpDistance(Number(dist.toFixed(1)));
  };

  const handleEntryPriceChange = (price: number) => {
    setEntryPrice(price);
    const slP = direction === 'BUY' ? price - (slDistance * instrument.pipSize) : price + (slDistance * instrument.pipSize);
    const tpP = direction === 'BUY' ? price + (tpDistance * instrument.pipSize) : price - (tpDistance * instrument.pipSize);
    setSlPrice(Number(slP.toFixed(pricePrecision)));
    setTpPrice(Number(tpP.toFixed(pricePrecision)));
  };

  const toggleDirection = (dir: 'BUY' | 'SELL') => {
    setDirection(dir);
    const slP = dir === 'BUY' ? entryPrice - (slDistance * instrument.pipSize) : entryPrice + (slDistance * instrument.pipSize);
    const tpP = dir === 'BUY' ? entryPrice + (tpDistance * instrument.pipSize) : entryPrice - (tpDistance * instrument.pipSize);
    setSlPrice(Number(slP.toFixed(pricePrecision)));
    setTpPrice(Number(tpP.toFixed(pricePrecision)));
  };

  return (
    <div className="w-full animate-fade-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
             <div className="relative w-full md:w-auto">
                 <select 
                    value={instrument.symbol}
                    onChange={(e) => setInstrument(INSTRUMENTS.find(i => i.symbol === e.target.value) || INSTRUMENTS[0])}
                    className="w-full md:w-auto appearance-none bg-slate-900 border border-slate-700 text-gold-400 font-bold py-3 px-10 pr-14 rounded-xl text-sm outline-none focus:border-gold-500 transition-all cursor-pointer shadow-lg"
                 >
                    {INSTRUMENTS.map(i => <option key={i.symbol} value={i.symbol}>{i.symbol}</option>)}
                 </select>
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <Activity size={18} />
                 </div>
             </div>
             
             <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto shadow-inner">
                <button onClick={() => toggleDirection('SELL')} className={`flex-1 md:px-10 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 ${direction === 'SELL' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500'}`}><ArrowDownCircle size={18} /> SELL</button>
                <button onClick={() => toggleDirection('BUY')} className={`flex-1 md:px-10 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-3 ${direction === 'BUY' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}><ArrowUpCircle size={18} /> BUY</button>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 block">Account Balance</label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-gold-500 transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 block">Entry Price</label>
                            <input type="number" value={entryPrice} step={instrument.pipSize} onChange={(e) => handleEntryPriceChange(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none font-mono text-lg transition-colors focus:border-gold-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                        <div className={`p-4 rounded-2xl border ${calcMode === 'RISK' ? 'border-gold-500/50 bg-gold-500/5 shadow-inner' : 'border-transparent'}`}>
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 block">Risk Amount ($)</label>
                            <input type="number" value={riskAmount} onChange={(e) => handleRiskAmountChange(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-white outline-none focus:border-gold-500 transition-colors" />
                        </div>
                        <div className={`p-4 rounded-2xl border ${calcMode === 'RISK' ? 'border-gold-500/50 bg-gold-500/5 shadow-inner' : 'border-transparent'}`}>
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 block">Risk %</label>
                            <div className="relative">
                                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                {/* Fixed: Passed e.target.value instead of an anonymous function */}
                                <input type="number" value={riskPercent} onChange={(e) => handleRiskPercentChange(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-white outline-none focus:border-gold-500 transition-colors" />
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl border ${calcMode === 'LOTS' ? 'border-gold-500/50 bg-gold-500/5 shadow-inner' : 'border-transparent'}`}>
                            <label className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 block">Lot Size</label>
                            <input type="number" step="0.01" min="0.01" value={lotSize} onChange={(e) => handleLotChange(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-gold-400 font-bold outline-none focus:border-gold-500 transition-colors" />
                        </div>
                    </div>

                    {isSpecialIndex && (
                       <div className="pt-4 border-t border-slate-800/50">
                          <label className="text-[10px] uppercase text-slate-500 font-bold tracking-widest mb-3 block flex items-center gap-2">
                             Broker Model Selection
                             <Info size={12} className="text-slate-600" />
                          </label>
                          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                             <button 
                                onClick={() => setContractSize(1)} 
                                className={`flex flex-col items-center py-2.5 rounded-lg transition-all ${contractSize === 1 ? 'bg-slate-800 text-gold-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                               <span className="text-[10px] font-black tracking-wider uppercase">MICRO</span>
                               <span className="text-[7px] opacity-40 uppercase font-bold mt-1">(1x Mult)</span>
                             </button>
                             <button 
                                onClick={() => setContractSize(100)} 
                                className={`flex flex-col items-center py-2.5 rounded-lg transition-all ${contractSize === 100 ? 'bg-slate-800 text-gold-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                               <span className="text-[10px] font-black tracking-wider uppercase">MINI</span>
                               <span className="text-[7px] opacity-40 uppercase font-bold mt-1">(100x Mult)</span>
                             </button>
                             <button 
                                onClick={() => setContractSize(1000)} 
                                className={`flex flex-col items-center py-2.5 rounded-lg transition-all ${contractSize === 1000 ? 'bg-slate-800 text-gold-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                             >
                               <span className="text-[10px] font-black tracking-wider uppercase">STANDARD</span>
                               <span className="text-[7px] opacity-40 uppercase font-bold mt-1">(1000x Mult)</span>
                             </button>
                          </div>
                          <p className="text-[9px] text-slate-600 mt-2 uppercase font-medium flex items-center gap-1">
                             <ShieldCheck size={10} className="text-gold-500" />
                             Multi-contract logic active for {instrument.symbol}.
                          </p>
                       </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                        <h3 className="flex items-center gap-3 mb-6 text-rose-400 font-bold uppercase text-sm tracking-widest"><TrendingUp className="rotate-180" size={20} /> Stop Loss</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-bold tracking-wider">Distance ({unitLabel})</label>
                                <input type="number" value={slDistance} onChange={(e) => handleSlDistChange(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-rose-500 font-mono transition-colors" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-bold tracking-wider">Exact Price</label>
                                <input type="number" value={slPrice} step={instrument.pipSize} onChange={(e) => handleSlPriceChange(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-rose-500 font-mono transition-colors" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <h3 className="flex items-center gap-3 mb-6 text-emerald-400 font-bold uppercase text-sm tracking-widest"><Target size={20} /> Take Profit</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-bold tracking-wider">Distance ({unitLabel})</label>
                                <input type="number" value={tpDistance} onChange={(e) => handleTpDistChange(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-emerald-500 font-mono transition-colors" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 block mb-2 uppercase font-bold tracking-wider">Exact Price</label>
                                <input type="number" value={tpPrice} step={instrument.pipSize} onChange={(e) => handleTpPriceChange(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-4 text-white outline-none focus:border-emerald-500 font-mono transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={140} className="text-gold-500" /></div>
                    <div className="relative z-10 space-y-10">
                        <div>
                            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Activity size={16} className="text-gold-500" /> Position Summary</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-slate-800/20 p-5 rounded-2xl border border-slate-700/30 backdrop-blur-sm">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Execution Risk</p>
                                    <p className="text-3xl font-serif text-rose-400">${results.risk.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                </div>
                                <div className="bg-slate-800/20 p-5 rounded-2xl border border-slate-700/30 backdrop-blur-sm">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Target Reward</p>
                                    <p className="text-3xl font-serif text-emerald-400">${results.reward.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
                                <span className="text-sm text-slate-400">Risk/Reward Ratio</span>
                                <span className="text-2xl font-bold text-gold-500">1 : {results.rr}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
                                <span className="text-sm text-slate-400">Execution Lots</span>
                                <span className="text-2xl font-bold text-white">{results.lots.toFixed(2)} <span className="text-xs text-slate-500 font-normal ml-1">Lots</span></span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-800/50">
                                <span className="text-sm text-slate-400">Value per {unitLabel}</span>
                                <span className="text-base font-mono text-slate-300">${results.valuePerUnit.toFixed(5)}</span>
                            </div>
                        </div>
                        <div className="pt-2">
                            <div className="bg-gold-500/5 border border-gold-500/10 p-5 rounded-2xl flex items-start gap-4 shadow-inner">
                                <div className="p-3 bg-gold-500/20 rounded-xl text-gold-500"><CheckSquare size={24} /></div>
                                <div>
                                    <p className="text-xs font-bold text-gold-500 uppercase tracking-widest mb-1">Market Logic Verified</p>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        {instrument.symbol === 'USDMXN' ? 'Non-linear PnL calculation active.' : 'Linear pip value calculation active.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Calculator;
