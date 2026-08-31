import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import {
  Globe, Search, RefreshCw, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown,
  Activity, DollarSign, BarChart2, ShieldAlert, Award, ExternalLink
} from 'lucide-react';
import {
  getMarketStatus, getMarketIndices, getMarketMovers, getSectorPerformance,
  getMarketHistory, searchMarket, getForex, getCommodities, getMarketSignals
} from '../services/marketService';
import { SkeletonBlock, SkeletonChart, SkeletonTable } from '../components/ui/Skeleton';

const TIME_FILTERS = ['1D', '1W', '1M', '3M', '1Y'];

const SYMBOL_KEY_MAP = {
  'NIFTY 50': 'NIFTY50',
  'SENSEX': 'SENSEX',
  'BANK NIFTY': 'BANKNIFTY',
  'S&P 500': 'SPX',
  'NASDAQ 100': 'COMP',
  'Dow Jones': 'DJI',
  'Gold': 'GOLD',
  'Crude Oil': 'CRUDE'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    let dateStr = '';
    try {
      const d = new Date(label);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch { dateStr = label; }
    const formatted = typeof val === 'number'
      ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : val;
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl px-3 py-2 shadow-xl">
        <p className="text-[10px] font-mono text-[#8C8C8C] uppercase tracking-wider mb-0.5">{dateStr}</p>
        <p className="text-[14px] font-bold text-[#1A73E8]">{formatted}</p>
      </div>
    );
  }
  return null;
};

export const MarketOverview = () => {
  const navigate = useNavigate();

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [loadingMovers, setLoadingMovers] = useState(true);
  const [loadingSectors, setLoadingSectors] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingForex, setLoadingForex] = useState(true);
  const [loadingCommodities, setLoadingCommodities] = useState(true);
  const [loadingSignals, setLoadingSignals] = useState(true);

  const [errors, setErrors] = useState({});

  const [status, setStatus] = useState(null);
  const [indices, setIndices] = useState({ india: [], usa: [], global_markets: [] });
  const [moversMarket, setMoversMarket] = useState('usa'); 
  const [movers, setMovers] = useState({ gainers: [], losers: [], active: [] });
  
  const [sectorsMarket, setSectorsMarket] = useState('usa'); 
  const [sectors, setSectors] = useState([]);
  
  const [forex, setForex] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [signals, setSignals] = useState([]);

  const [chartIndex, setChartIndex] = useState('S&P 500');
  const [chartTimeframe, setChartTimeframe] = useState('1M');
  const [historyData, setHistoryData] = useState([]);
  const [chartMarket, setChartMarket] = useState('USA'); 

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStatusData = useCallback(async (force = false) => {
    try {
      setLoadingStatus(true);
      const data = await getMarketStatus(force);
      setStatus(data);
      setErrors(prev => ({ ...prev, status: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, status: e.message }));
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchIndicesData = useCallback(async (force = false) => {
    try {
      setLoadingIndices(true);
      const data = await getMarketIndices(force);
      setIndices(data);
      setErrors(prev => ({ ...prev, indices: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, indices: e.message }));
    } finally {
      setLoadingIndices(false);
    }
  }, []);

  const fetchMoversData = useCallback(async (market, force = false) => {
    try {
      setLoadingMovers(true);
      const data = await getMarketMovers(market, force);
      setMovers(data);
      setErrors(prev => ({ ...prev, movers: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, movers: e.message }));
    } finally {
      setLoadingMovers(false);
    }
  }, []);

  const fetchSectorsData = useCallback(async (market, force = false) => {
    try {
      setLoadingSectors(true);
      const data = await getSectorPerformance(market, force);
      setSectors(data);
      setErrors(prev => ({ ...prev, sectors: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, sectors: e.message }));
    } finally {
      setLoadingSectors(false);
    }
  }, []);

  const fetchHistoryData = useCallback(async (symbolName, timeframe) => {
    try {
      setLoadingHistory(true);
      const symbol = SYMBOL_KEY_MAP[symbolName] || 'SPX';

      let outputsize = 30;
      if (timeframe === '1D') outputsize = 24;
      else if (timeframe === '1W') outputsize = 7;
      else if (timeframe === '1M') outputsize = 30;
      else if (timeframe === '3M') outputsize = 90;
      else if (timeframe === '1Y') outputsize = 250;
      
      const interval = timeframe === '1D' ? '1h' : '1day';
      const data = await getMarketHistory(symbol, interval, outputsize);
      setHistoryData(data);
      setErrors(prev => ({ ...prev, history: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, history: e.message }));
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchForexData = useCallback(async () => {
    try {
      setLoadingForex(true);
      const data = await getForex();
      setForex(data);
      setErrors(prev => ({ ...prev, forex: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, forex: e.message }));
    } finally {
      setLoadingForex(false);
    }
  }, []);

  const fetchCommoditiesData = useCallback(async () => {
    try {
      setLoadingCommodities(true);
      const data = await getCommodities();
      setCommodities(data);
      setErrors(prev => ({ ...prev, commodities: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, commodities: e.message }));
    } finally {
      setLoadingCommodities(false);
    }
  }, []);

  const fetchSignalsData = useCallback(async () => {
    try {
      setLoadingSignals(true);
      const data = await getMarketSignals();
      setSignals(data);
      setErrors(prev => ({ ...prev, signals: null }));
    } catch (e) {
      setErrors(prev => ({ ...prev, signals: e.message }));
    } finally {
      setLoadingSignals(false);
    }
  }, []);

  useEffect(() => {
    fetchStatusData();
    fetchIndicesData();
    fetchForexData();
    fetchCommoditiesData();
    fetchSignalsData();
  }, [fetchStatusData, fetchIndicesData, fetchForexData, fetchCommoditiesData, fetchSignalsData]);

  useEffect(() => {
    fetchMoversData(moversMarket);
  }, [moversMarket, fetchMoversData]);

  useEffect(() => {
    fetchSectorsData(sectorsMarket);
  }, [sectorsMarket, fetchSectorsData]);

  useEffect(() => {
    fetchHistoryData(chartIndex, chartTimeframe);
  }, [chartIndex, chartTimeframe, fetchHistoryData]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchMarket(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleRefresh = useCallback(async (force = true) => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([
      fetchStatusData(force),
      fetchIndicesData(force),
      fetchMoversData(moversMarket, force),
      fetchSectorsData(sectorsMarket, force),
      fetchHistoryData(chartIndex, chartTimeframe),
      fetchForexData(),
      fetchCommoditiesData(),
      fetchSignalsData()
    ]);
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [chartIndex, chartTimeframe, fetchCommoditiesData, fetchForexData, fetchHistoryData, fetchIndicesData, fetchMoversData, fetchSectorsData, fetchSignalsData, fetchStatusData, moversMarket, refreshing, sectorsMarket]);

  useEffect(() => {
    const checkAndPoll = setInterval(() => {
      if (document.visibilityState === 'visible') handleRefresh(true);
    }, 60000);

    return () => clearInterval(checkAndPoll);
  }, [handleRefresh]);

  const allIndices = [
    ...indices.india,
    ...indices.usa,
    ...indices.global_markets
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 page-enter">
      
      {}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#050505]">Market Overview</h1>
          <p className="text-[13px] text-[#595959] mt-1">Understand what's moving across global markets.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {}
          <div className="relative" ref={searchRef}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
            <input
              type="text"
              placeholder="Search assets, indices, forex..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-[#E5E5E5] bg-white text-[12.5px] outline-none focus:border-[#050505] w-64 focus-ring"
            />
            {searching && (
              <RefreshCw size={12} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#8C8C8C]" />
            )}
            
            {}
            {searchResults && (
              <div className="absolute right-0 left-0 mt-1.5 bg-white border border-[#E5E5E5] rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto p-2 space-y-2">
                {Object.keys(searchResults).every(k => searchResults[k].length === 0) ? (
                  <p className="text-[11.5px] text-[#8C8C8C] p-3 text-center">No symbols found.</p>
                ) : (
                  Object.entries(searchResults).map(([category, items]) => {
                    if (items.length === 0) return null;
                    return (
                      <div key={category} className="space-y-1">
                        <p className="text-[9px] font-mono font-bold text-[#8C8C8C] uppercase tracking-wider px-2 py-0.5 bg-[#FAFAFA] rounded-md">
                          {category}
                        </p>
                        {items.map((item) => (
                          <div
                            key={item.symbol}
                            onClick={() => {
                              setSearchQuery('');
                              setSearchResults(null);
                              if (item.type === 'equity') {
                                navigate(`/dashboard/companies/${item.symbol}`);
                              } else {
                                const matchedIndex = Object.keys(SYMBOL_KEY_MAP).find(k => SYMBOL_KEY_MAP[k] === item.symbol);
                                if (matchedIndex) {
                                  setChartIndex(matchedIndex);
                                }
                              }
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="text-[12px] font-bold text-[#050505]">{item.symbol}</p>
                              <p className="text-[10px] text-[#8C8C8C] truncate max-w-[180px]">{item.name}</p>
                            </div>
                            <span className="text-[9px] font-mono bg-[#FAFAFA] border border-[#EDEDEE] px-1.5 py-0.5 rounded text-[#595959]">
                              {item.exchange}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#595959] border border-[#E5E5E5] bg-white rounded-lg hover:bg-[#F5F5F5] hover:border-[#C8C8C8] transition-colors focus-ring"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {}
      <div className="flex flex-wrap items-center gap-5 py-3 border-y border-[#F0F0F0] text-[12px]">
        <div className="flex items-center gap-1.5">
          <span className="text-[#8C8C8C] font-semibold uppercase font-mono text-[10px]">Market Status:</span>
        </div>
        
        {loadingStatus ? (
          <SkeletonBlock className="h-4 w-32" />
        ) : errors.status ? (
          <span className="text-[#C5221F] text-[11px] flex items-center gap-1">
            <ShieldAlert size={12} /> Status Check Error
          </span>
        ) : (
          <>
            {}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#595959]">India ({status?.india?.exchange})</span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                status?.india?.status === 'open' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#F1F3F4] text-[#5F6368]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.india?.status === 'open' ? 'bg-[#137333] animate-pulse' : 'bg-[#5F6368]'}`} />
                {status?.india?.status === 'open' ? 'Market Open' : 'Market Closed'}
              </span>
            </div>

            {}
            <div className="flex items-center gap-2 border-l border-[#F0F0F0] pl-5">
              <span className="font-semibold text-[#595959]">USA ({status?.usa?.exchange})</span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${
                status?.usa?.status === 'open' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#F1F3F4] text-[#5F6368]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status?.usa?.status === 'open' ? 'bg-[#137333] animate-pulse' : 'bg-[#5F6368]'}`} />
                {status?.usa?.status === 'open' ? 'Market Open' : 'Market Closed'}
              </span>
            </div>

            <span className="text-[#ADADAD] text-[11px] ml-auto">
              Data refreshed · {lastUpdated.toLocaleTimeString()}
            </span>
          </>
        )}
      </div>

      {}
      <div className="bg-white border border-[#E5E5E5] rounded-xl py-3.5 px-4 shadow-sm overflow-hidden relative">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
          {loadingIndices ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-2 items-center shrink-0 border-r border-[#F0F0F0] pr-6 last:border-0">
                <SkeletonBlock className="h-3 w-14" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
            ))
          ) : errors.indices ? (
            <p className="text-[12px] text-[#C5221F] py-0.5">Indices data temporarily unavailable.</p>
          ) : (
            allIndices.map((idx) => {
              const isPos = idx.change >= 0;
              return (
                <div
                  key={idx.symbol}
                  onClick={() => {
                    const matchedName = Object.keys(SYMBOL_KEY_MAP).find(k => SYMBOL_KEY_MAP[k] === idx.symbol);
                    if (matchedName) {
                      setChartIndex(matchedName);
                      setChartMarket(idx.market);
                    }
                  }}
                  className="flex items-center gap-3 shrink-0 border-r border-[#F0F0F0] pr-6 last:border-0 cursor-pointer hover:bg-[#FAFAFA] p-1.5 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-[10px] font-mono text-[#8C8C8C] uppercase tracking-wider">{idx.name}</p>
                    <p className="text-[13.5px] font-bold text-[#050505] mt-0.5">{idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <span className={`flex items-center text-[11px] font-bold ${isPos ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                    {isPos ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {isPos ? '+' : ''}{idx.change_percent.toFixed(2)}%
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-5">
          <div>
            <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
              <Activity size={15} className="text-[#050505]" /> Market Snapshot
            </h3>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Key indices at a glance</p>
          </div>

          {loadingIndices ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {}
              <div>
                <p className="text-[9px] font-mono font-bold text-[#8C8C8C] uppercase tracking-wider mb-2">India</p>
                <div className="space-y-1.5">
                  {indices.india.map((idx) => {
                    const isPos = idx.change >= 0;
                    return (
                      <div
                        key={idx.symbol}
                        onClick={() => { setChartIndex(idx.name); setChartMarket('India'); }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                      >
                        <span className="text-[12px] font-bold text-[#595959]">{idx.name}</span>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-[12.5px] font-bold text-[#050505]">{idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${isPos ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'}`}>
                            {isPos ? '+' : ''}{idx.change_percent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {}
              <div className="pt-2 border-t border-[#F0F0F0]">
                <p className="text-[9px] font-mono font-bold text-[#8C8C8C] uppercase tracking-wider mb-2">United States</p>
                <div className="space-y-1.5">
                  {indices.usa.map((idx) => {
                    const isPos = idx.change >= 0;
                    return (
                      <div
                        key={idx.symbol}
                        onClick={() => { setChartIndex(idx.name); setChartMarket('USA'); }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                      >
                        <span className="text-[12px] font-bold text-[#595959]">{idx.name}</span>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-[12.5px] font-bold text-[#050505]">{idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${isPos ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'}`}>
                            {isPos ? '+' : ''}{idx.change_percent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {}
              <div className="pt-2 border-t border-[#F0F0F0]">
                <p className="text-[9px] font-mono font-bold text-[#8C8C8C] uppercase tracking-wider mb-2">Global & Macro</p>
                <div className="space-y-1.5">
                  {indices.global_markets.map((idx) => {
                    const isPos = idx.change >= 0;
                    return (
                      <div
                        key={idx.symbol}
                        onClick={() => {
                          const nameMap = { 'GOLD': 'Gold', 'CRUDE': 'Crude Oil' };
                          const targetName = nameMap[idx.symbol] || idx.name;
                          setChartIndex(targetName);
                          setChartMarket('Global');
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                      >
                        <span className="text-[12px] font-bold text-[#595959]">{idx.name}</span>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-[12.5px] font-bold text-[#050505]">{idx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${isPos ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]'}`}>
                            {isPos ? '+' : ''}{idx.change_percent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4 xl:col-span-2">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#F5F5F5]">
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-bold text-[#050505]">Market Performance</span>
              <span className="text-[11px] font-mono text-[#8C8C8C] uppercase tracking-wide px-2 py-0.5 bg-[#FAFAFA] border border-[#EDEDEE] rounded">
                {chartIndex}
              </span>
            </div>

            {}
            <div className="flex flex-wrap items-center gap-2">
              {}
              <select
                value={chartIndex}
                onChange={(e) => setChartIndex(e.target.value)}
                className="bg-white border border-[#E5E5E5] text-[11.5px] py-1.5 px-3 rounded-lg outline-none cursor-pointer focus-ring"
              >
                <optgroup label="India">
                  <option value="NIFTY 50">Nifty 50</option>
                  <option value="BANK NIFTY">Bank Nifty</option>
                  <option value="SENSEX">Sensex</option>
                </optgroup>
                <optgroup label="US">
                  <option value="S&P 500">S&P 500</option>
                  <option value="NASDAQ 100">Nasdaq 100</option>
                  <option value="Dow Jones">Dow Jones</option>
                </optgroup>
                <optgroup label="Global">
                  <option value="Gold">Gold</option>
                  <option value="Crude Oil">Crude Oil</option>
                </optgroup>
              </select>

              {}
              <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg border border-[#EDEDEE]">
                {TIME_FILTERS.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setChartTimeframe(tf)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded ${
                      chartTimeframe === tf
                        ? 'bg-white text-[#050505] shadow-xs'
                        : 'text-[#8C8C8C] hover:text-[#595959]'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {}
          {loadingHistory ? (
            <SkeletonChart height={260} />
          ) : errors.history ? (
            <div className="h-[260px] flex items-center justify-center text-center p-6 bg-[#FFF8F7] border border-[#FDECEA] rounded-xl text-[12px] text-[#C5221F]">
              <div>
                <ShieldAlert className="mx-auto mb-2 text-[#C5221F]" size={20} />
                <p>Could not load index history. Please verify connection or API limits.</p>
              </div>
            </div>
          ) : historyData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-[12px] text-[#8C8C8C]">
              <p>No chart data available for the selected symbol and timeframe.</p>
            </div>
          ) : (
            <div className="h-[260px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#050505" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#050505" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fontSize: 9, fill: '#ADADAD', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => {
                      try {
                        const d = new Date(v);
                        if (isNaN(d.getTime())) return '';
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      } catch { return ''; }
                    }}
                    interval="preserveStartEnd"
                    dy={6}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 9, fill: '#ADADAD', fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => {
                      if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
                      return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
                    }}
                    width={52}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke="#1A73E8"
                    strokeWidth={2}
                    fill="url(#chartGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#1A73E8', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#050505]">Market Movers</h3>
              <p className="text-[11px] text-[#8C8C8C] mt-0.5">Top price movers</p>
            </div>
            
            {}
            <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg border border-[#EDEDEE]">
              <button
                onClick={() => setMoversMarket('usa')}
                className={`text-[10px] font-bold px-3 py-1 rounded ${
                  moversMarket === 'usa' ? 'bg-white text-[#050505] shadow-xs' : 'text-[#8C8C8C]'
                }`}
              >
                USA
              </button>
              <button
                onClick={() => setMoversMarket('india')}
                className={`text-[10px] font-bold px-3 py-1 rounded ${
                  moversMarket === 'india' ? 'bg-white text-[#050505] shadow-xs' : 'text-[#8C8C8C]'
                }`}
              >
                India
              </button>
            </div>
          </div>

          {loadingMovers ? (
            <SkeletonTable rows={4} cols={5} />
          ) : errors.movers ? (
            <div className="text-center py-8 text-[12px] text-[#C5221F] bg-[#FFF8F7] rounded-xl border border-[#FDECEA]">
              <ShieldAlert className="mx-auto mb-2" size={20} />
              <p>Top movers could not be loaded.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {}
              <div>
                <p className="text-[9px] font-mono font-bold text-[#137333] uppercase tracking-wider bg-[#E6F4EA] px-2 py-0.5 rounded w-fit mb-2">
                  Top Gainers
                </p>
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-[#8C8C8C] border-b border-[#F0F0F0]">
                      <th className="py-2 font-semibold">Symbol</th>
                      <th className="py-2 font-semibold">Price</th>
                      <th className="py-2 font-semibold text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movers.gainers.map((stock) => (
                      <tr
                        key={stock.symbol}
                        onClick={() => navigate(`/dashboard/companies/${stock.symbol}`)}
                        className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer last:border-0"
                      >
                        <td className="py-2.5 font-bold text-[#050505] flex items-center gap-1.5">
                          {stock.symbol} <ExternalLink size={10} className="text-[#ADADAD]" />
                        </td>
                        <td className="py-2.5 text-[#595959]">${stock.price.toFixed(2)}</td>
                        <td className="py-2.5 text-[#137333] font-bold text-right">+{stock.change_percent.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {}
              <div className="pt-2 border-t border-[#F0F0F0]">
                <p className="text-[9px] font-mono font-bold text-[#C5221F] uppercase tracking-wider bg-[#FCE8E6] px-2 py-0.5 rounded w-fit mb-2">
                  Top Losers
                </p>
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="text-[#8C8C8C] border-b border-[#F0F0F0]">
                      <th className="py-2 font-semibold">Symbol</th>
                      <th className="py-2 font-semibold">Price</th>
                      <th className="py-2 font-semibold text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movers.losers.map((stock) => (
                      <tr
                        key={stock.symbol}
                        onClick={() => navigate(`/dashboard/companies/${stock.symbol}`)}
                        className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer last:border-0"
                      >
                        <td className="py-2.5 font-bold text-[#050505] flex items-center gap-1.5">
                          {stock.symbol} <ExternalLink size={10} className="text-[#ADADAD]" />
                        </td>
                        <td className="py-2.5 text-[#595959]">${stock.price.toFixed(2)}</td>
                        <td className="py-2.5 text-[#C5221F] font-bold text-right">{stock.change_percent.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
            <div>
              <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
                <BarChart2 size={16} /> Sector Performance
              </h3>
              <p className="text-[11px] text-[#8C8C8C] mt-0.5">Global sector trends</p>
            </div>
            
            {}
            <div className="flex bg-[#F5F5F5] p-0.5 rounded-lg border border-[#EDEDEE]">
              <button
                onClick={() => setSectorsMarket('usa')}
                className={`text-[10px] font-bold px-3 py-1 rounded ${
                  sectorsMarket === 'usa' ? 'bg-white text-[#050505] shadow-xs' : 'text-[#8C8C8C]'
                }`}
              >
                USA
              </button>
              <button
                onClick={() => setSectorsMarket('india')}
                className={`text-[10px] font-bold px-3 py-1 rounded ${
                  sectorsMarket === 'india' ? 'bg-white text-[#050505] shadow-xs' : 'text-[#8C8C8C]'
                }`}
              >
                India
              </button>
            </div>
          </div>

          {loadingSectors ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <SkeletonBlock className="h-3 w-16" />
                  <SkeletonBlock className="h-5 w-full" />
                </div>
              ))}
            </div>
          ) : sectors.length === 0 ? (
            <div className="text-center py-16 text-[12px] text-[#8C8C8C]">
              <ShieldAlert className="mx-auto mb-2" size={18} />
              <p>Sector performance is currently unavailable for this market.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
              {sectors.map((sec) => {
                const pct = sec.change_percent;  
                const isPos = pct >= 0;
                
                const barWidth = Math.min(Math.abs(pct) * 20, 100);
                return (
                  <div key={sec.sector} className="space-y-1">
                    <div className="flex justify-between text-[11.5px] font-semibold text-[#595959]">
                      <span>{sec.sector}</span>
                      <span className={isPos ? 'text-[#137333]' : 'text-[#C5221F]'}>
                        {isPos ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </div>
                    {}
                    <div className="h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isPos ? 'bg-[#34A853]' : 'bg-[#EA4335]'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
              <DollarSign size={15} /> Foreign Exchange (Forex)
            </h3>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Global exchange rates</p>
          </div>

          {loadingForex ? (
            <SkeletonTable rows={4} cols={4} />
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[#8C8C8C] border-b border-[#F0F0F0]">
                  <th className="py-2 font-semibold">Pair</th>
                  <th className="py-2 font-semibold">Rate</th>
                  <th className="py-2 font-semibold text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {forex.map((fx) => {
                  const isPos = fx.change >= 0;
                  return (
                    <tr
                      key={fx.pair}
                      onClick={() => {
                        setChartIndex(fx.pair);
                        setChartMarket('Global');
                      }}
                      className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer last:border-0"
                    >
                      <td className="py-2.5 font-bold text-[#050505]">{fx.pair}</td>
                      <td className="py-2.5 text-[#595959]">{fx.rate.toFixed(4)}</td>
                      <td className={`py-2.5 font-bold text-right ${isPos ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {isPos ? '+' : ''}{fx.change_percent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
              <Globe size={15} /> Commodities
            </h3>
            <p className="text-[11px] text-[#8C8C8C] mt-0.5">Spot prices for main physical assets</p>
          </div>

          {loadingCommodities ? (
            <SkeletonTable rows={3} cols={4} />
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[#8C8C8C] border-b border-[#F0F0F0]">
                  <th className="py-2 font-semibold">Name</th>
                  <th className="py-2 font-semibold">Price</th>
                  <th className="py-2 font-semibold text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {commodities.map((item) => {
                  const isPos = item.change >= 0;
                  return (
                    <tr
                      key={item.name}
                      onClick={() => {
                        setChartIndex(item.name);
                        setChartMarket('Global');
                      }}
                      className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA] cursor-pointer last:border-0"
                    >
                      <td className="py-2.5 font-bold text-[#050505]">{item.name}</td>
                      <td className="py-2.5 text-[#595959]">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`py-2.5 font-bold text-right ${isPos ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
                        {isPos ? '+' : ''}{item.change_percent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-[16px] font-bold text-[#050505] flex items-center gap-2">
            <Award size={15} className="text-[#050505]" /> Data-Driven Market Signals
          </h3>
          <p className="text-[11px] text-[#8C8C8C] mt-0.5">Deterministic signals calculated directly from real-time indices quotes</p>
        </div>

        {loadingSignals ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border border-[#E5E5E5] rounded-xl space-y-2">
                <SkeletonBlock className="h-3 w-16 bg-[#F0F0F0]" />
                <SkeletonBlock className="h-5 w-32 bg-[#F0F0F0]" />
                <SkeletonBlock className="h-12 w-full bg-[#F0F0F0]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signals.map((sig) => {
              const isBull = sig.signal.toLowerCase().includes('bullish') || sig.signal.toLowerCase().includes('momentum');
              const isBear = sig.signal.toLowerCase().includes('bearish');
              return (
                <div
                  key={sig.asset}
                  className="p-4 border border-[#E5E5E5] rounded-xl bg-white space-y-3 shadow-xs hover:border-[#C8C8C8] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#8C8C8C]">
                      {sig.asset}
                    </span>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                      isBull ? 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]' : 
                      (isBear ? 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]' : 'bg-[#F1F3F4] text-[#5F6368] border-[#E8EAED]')
                    }`}>
                      {sig.signal}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8C8C8C]">Strength Index:</span>
                      <span className="font-bold text-[#050505]">{sig.strength}/100</span>
                    </div>
                    {}
                    <div className="h-1 bg-[#F5F5F5] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isBull ? 'bg-[#34A853]' : (isBear ? 'bg-[#EA4335]' : 'bg-[#8C8C8C]')
                        }`}
                        style={{ width: `${sig.strength}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[12px] text-[#595959] leading-relaxed">
                    {sig.reason}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default MarketOverview;
